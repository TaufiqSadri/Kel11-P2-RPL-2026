'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { approvePayment } from '@/lib/data/pembayaran'
import {
  deleteTagihan,
  deleteTagihanInstalasi,
  markAsPaid,
  markAsPaidInstalasi,
  updateTagihanByAdmin,
  updateTagihanInstalasiByAdmin,
} from '@/lib/data/tagihan'
import { syncSuspendedPelangganStatuses } from '@/lib/data/pelangganStatus'
import { updateJadwalInstalasiByAdmin } from '@/lib/data/jadwalInstalasi'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const BIAYA_INSTALASI = 600_000

function getAppOrigin() {
  const explicitOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL

  if (explicitOrigin) return explicitOrigin.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

function parseDateInput(value: FormDataEntryValue | null) {
  const date = String(value ?? '').trim()
  if (!date) return null
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : 'invalid'
}

// Helper: buat tagihan instalasi Rp 600.000 di tabel tagihan_instalasi
async function createTagihanInstalasi(admin: ReturnType<typeof createAdminClient>, pelangganId: string) {
  const now = new Date()
  // Jatuh tempo = tanggal aktivasi + 2 hari
  const due = new Date(now)
  due.setUTCDate(due.getUTCDate() + 2)
  const jatuh_tempo = due.toISOString().slice(0, 10)

  await admin.from('tagihan_instalasi').insert({
    pelanggan_id: pelangganId,
    jumlah_tagihan: BIAYA_INSTALASI,
    status_tagihan: 'belum_bayar',
    jatuh_tempo,
  })
}

export async function approvePelanggan(pelangganId: string, _formData: FormData) {
  const admin = createAdminClient()

  // Cek apakah sudah pernah ada tagihan instalasi (hindari duplikat)
  const { data: existing } = await admin
    .from('tagihan_instalasi')
    .select('id')
    .eq('pelanggan_id', pelangganId)
    .maybeSingle()

  await admin
    .from('pelanggan')
    .update({ status_langganan: 'ditangguhkan', tanggal_bergabung: null })
    .eq('id', pelangganId)

  if (!existing) {
    await createTagihanInstalasi(admin, pelangganId)
  }

  await syncSuspendedPelangganStatuses([pelangganId])
  revalidatePath('/admin')
  revalidatePath('/admin/pelanggan')
  revalidatePath('/admin/tagihan')
}

export async function approvePembayaran(pembayaranId: string, _tagihanId: string | null, _formData: FormData) {
  await approvePayment(pembayaranId)
  revalidatePath('/admin')
}

export async function rejectPembayaran(pembayaranId: string, catatan: string, _formData: FormData) {
  const admin = createAdminClient()
  await admin
    .from('pembayaran')
    .update({ status_verifikasi: 'ditolak', catatan_admin: catatan || null })
    .eq('id', pembayaranId)

  const { data: row } = await admin
    .from('pembayaran')
    .select('tagihan_id, tagihan_instalasi_id')
    .eq('id', pembayaranId)
    .single()

  let pelangganId: string | null = null
  if (row?.tagihan_id) {
    const { data } = await admin
      .from('tagihan')
      .update({ status_tagihan: 'belum_bayar' })
      .eq('id', row.tagihan_id)
      .select('pelanggan_id')
      .single()
    pelangganId = data?.pelanggan_id ?? null
  } else if (row?.tagihan_instalasi_id) {
    const { data } = await admin
      .from('tagihan_instalasi')
      .update({ status_tagihan: 'belum_bayar', bukti_pembayaran: null })
      .eq('id', row.tagihan_instalasi_id)
      .select('pelanggan_id')
      .single()
    pelangganId = data?.pelanggan_id ?? null
  }

  if (pelangganId) {
    await syncSuspendedPelangganStatuses([pelangganId])
  }
  revalidatePath('/admin')
  revalidatePath('/admin/pelanggan')
  revalidatePath('/admin/verifikasi')
  revalidatePath('/admin/tagihan')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/riwayat')
}

export async function deactivatePelanggan(pelangganId: string, _formData: FormData) {
  const admin = createAdminClient()
  await admin.from('pelanggan').update({ status_langganan: 'nonaktif' }).eq('id', pelangganId)
  revalidatePath('/admin/pelanggan')
}

export async function suspendPelanggan(pelangganId: string, _formData: FormData) {
  const admin = createAdminClient()
  await admin.from('pelanggan').update({ status_langganan: 'ditangguhkan' }).eq('id', pelangganId)
  revalidatePath('/admin')
  revalidatePath('/admin/pelanggan')
  revalidatePath(`/admin/pelanggan/${pelangganId}`)
}

export async function activatePelanggan(pelangganId: string, _formData: FormData) {
  const admin = createAdminClient()
  await admin.from('pelanggan').update({ status_langganan: 'aktif' }).eq('id', pelangganId)
  await syncSuspendedPelangganStatuses([pelangganId])
  revalidatePath('/admin/pelanggan')
}

export async function togglePelangganStatus(
  pelangganId: string,
  currentStatus: string,
  _formData: FormData
) {
  const admin = createAdminClient()

  if (currentStatus === 'proses_instalasi') {
    revalidatePath('/admin/pelanggan')
    return
  }

  const newStatus =
    currentStatus === 'aktif'
      ? 'nonaktif'
      : 'aktif'

  await admin
    .from('pelanggan')
    .update({
      status_langganan: newStatus,
    })
    .eq('id', pelangganId)

  await syncSuspendedPelangganStatuses([pelangganId])
  revalidatePath('/admin/pelanggan')
}

/*
---------------------------------
  Function untuk CRUD Pelanggan
---------------------------------
*/

// ── Tambah pelanggan oleh admin ───────────────────────────────────────────────
export async function addPelangganByAdmin(formData: FormData) {
  const admin = createAdminClient()

  const nama_lengkap = String(formData.get('nama_lengkap') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const no_hp = String(formData.get('no_hp') ?? '').trim()
  const paket_id = String(formData.get('paket_id') ?? '').trim()
  const bulanMasuk = Number(formData.get('bulan_masuk'))
  const tahunMasuk = Number(formData.get('tahun_masuk'))

  if (!nama_lengkap || !email || !no_hp || !paket_id || !bulanMasuk || !tahunMasuk) {
    return { error: 'Semua field wajib diisi.' }
  }
  if (bulanMasuk < 1 || bulanMasuk > 12 || tahunMasuk < 2000) {
    return { error: 'Bulan atau tahun masuk tidak valid.' }
  }

  const { data: authData, error: authError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${getAppOrigin()}/auth/set-password`,
    data: {
      nama_lengkap,
      no_hp,
      role: 'pelanggan',
      created_by_admin: true,
    },
  })

  if (authError) {
    const message = authError.message.toLowerCase()
    if (message.includes('already registered') || message.includes('already been registered') || message.includes('already exists')) {
      return { error: 'Email ini sudah terdaftar.' }
    }
    return { error: authError.message }
  }

  if (!authData.user) return { error: 'Gagal membuat undangan akun.' }

  const { error: updateError } = await admin.auth.admin.updateUserById(authData.user.id, {
    email,
    user_metadata: {
      nama_lengkap,
      no_hp,
      role: 'pelanggan',
      created_by_admin: true,
    },
  })

  if (updateError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return { error: updateError.message }
  }

  const { data: pelangganBaru, error: pelangganError } = await admin
    .from('pelanggan')
    .insert({
      user_id: authData.user.id,
      nama_lengkap,
      email,
      no_hp,
      alamat_pemasangan: 'Belum diisi',
      latitude: null,
      longitude: null,
      paket_id,
      status_langganan: 'ditangguhkan',
      tanggal_bergabung: null,
    })
    .select('id')
    .single()

  if (pelangganError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return { error: 'Gagal menyimpan data pelanggan.' }
  }

  if (pelangganBaru?.id) {
    await createTagihanInstalasi(admin, pelangganBaru.id)
    await syncSuspendedPelangganStatuses([pelangganBaru.id])
  }

  revalidatePath('/admin/pelanggan')
  return { success: true }
}

// ── Update data pelanggan ─────────────────────────────────────────────────────
export async function updatePelangganByAdmin(pelangganId: string, formData: FormData): Promise<void> {
  const admin = createAdminClient()
 
  const nama_lengkap = formData.get('nama_lengkap') as string
  const no_hp = formData.get('no_hp') as string
  const alamat_pemasangan = formData.get('alamat_pemasangan') as string
  const paket_id = formData.get('paket_id') as string
  const status_langganan = formData.get('status_langganan') as string
  const latRaw = formData.get('latitude') as string
  const lngRaw = formData.get('longitude') as string
  const tanggalRaw = formData.get('tanggal_bergabung') as string

  const tanggal_bergabung = tanggalRaw
    ? new Date(tanggalRaw).toISOString()
    : undefined
 
  const { error } = await admin
    .from('pelanggan')
    .update({
      nama_lengkap,
      no_hp,
      alamat_pemasangan,
      paket_id,
      status_langganan,
      latitude: latRaw ? Number(latRaw) : null,
      longitude: lngRaw ? Number(lngRaw) : null,
      ...(tanggal_bergabung ? { tanggal_bergabung } : {}),
    })
    .eq('id', pelangganId)
 
  if (error) throw new Error(error.message)
 
  await syncSuspendedPelangganStatuses([pelangganId])
  revalidatePath('/admin/pelanggan')
  revalidatePath(`/admin/pelanggan/${pelangganId}`)
  redirect(`/admin/pelanggan/${pelangganId}`)
}

// ── Delete pelanggan ──────────────────────────────────────────────────────────
export async function deletePelangganByAdmin(pelangganId: string, userId: string) {
  const admin = createAdminClient()

  await admin.from('pelanggan').delete().eq('id', pelangganId)
  await admin.auth.admin.deleteUser(userId)

  revalidatePath('/admin/pelanggan')
  redirect('/admin/pelanggan')
}

/*
---------------------------------
  Function untuk manage Tagihan
---------------------------------
*/
export async function markAsPaidAction(tagihanId: string): Promise<void> {
  await markAsPaid(tagihanId)
  revalidatePath('/admin/tagihan')
  revalidatePath('/admin/pelanggan')
}
 
export async function deleteTagihanAction(tagihanId: string): Promise<void> {
  await deleteTagihan(tagihanId)
  revalidatePath('/admin/tagihan')
  revalidatePath('/admin/pelanggan')
}

export async function markAsPaidInstalasiAction(instalasiId: string): Promise<void> {
  await markAsPaidInstalasi(instalasiId)
  revalidatePath('/admin/tagihan')
  revalidatePath('/admin/pelanggan')
}

export async function deleteTagihanInstalasiAction(instalasiId: string): Promise<void> {
  await deleteTagihanInstalasi(instalasiId)
  revalidatePath('/admin/tagihan')
  revalidatePath('/admin/pelanggan')
}

function getMonthDateRange(month: number, year: number, dueDay = 10) {
  const createdAt = new Date(Date.UTC(year, month - 1, 1))
  const dueDate = new Date(Date.UTC(year, month - 1, dueDay))

  return {
    createdAt: createdAt.toISOString(),
    dueDate: dueDate.toISOString().slice(0, 10),
  }
}

export async function generateTagihanBulanan(formData: FormData) {
  const admin = createAdminClient()
  const month = Number(formData.get('bulan'))
  const year = Number(formData.get('tahun'))
  const pelangganId = String(formData.get('pelanggan_id') ?? 'semua').trim()
  const dueDay_input = Number(formData.get('jatuh_tempo_hari') ?? 10)
  const dueDateOverride = parseDateInput(formData.get('jatuh_tempo'))

  if (!month || !year) {
    redirect('/admin/tagihan/generate?error=Periode%20tagihan%20tidak%20valid.')
  }
  if (dueDateOverride === 'invalid') {
    redirect('/admin/tagihan/generate?error=Format%20jatuh%20tempo%20tidak%20valid.')
  }

  const { createdAt } = getMonthDateRange(month, year, dueDay_input)

  let pelangganQuery = admin
    .from('pelanggan')
    .select('id, paket_id, tanggal_bergabung, paket_internet(harga)')
    .eq('status_langganan', 'aktif')

  if (pelangganId && pelangganId !== 'semua') {
    pelangganQuery = pelangganQuery.eq('id', pelangganId)
  }

  const { data: pelangganRows, error: pelangganError } = await pelangganQuery

  if (pelangganError) {
    redirect(`/admin/tagihan/generate?error=${encodeURIComponent(pelangganError.message)}`)
  }

  // Filter pelanggan layak:
  // - Harus punya paket
  // - Bulan pertama GRATIS (tanggal_bergabung di bulan/tahun yang sama = skip)
  const pelangganAktif = (pelangganRows ?? []).filter((item) => {
    if (!item.paket_id || !item.paket_internet) return false
    if (item.tanggal_bergabung) {
      const joinDate = new Date(item.tanggal_bergabung)
      const joinMonth = joinDate.getUTCMonth() + 1
      const joinYear = joinDate.getUTCFullYear()
      if (joinMonth === month && joinYear === year) return false // bulan pertama gratis
    }
    return true
  })

  let existingQuery = admin
    .from('tagihan')
    .select('pelanggan_id')
    .eq('bulan', month)
    .eq('tahun', year)

  if (pelangganId && pelangganId !== 'semua') {
    existingQuery = existingQuery.eq('pelanggan_id', pelangganId)
  }

  const { data: existingRows, error: existingError } = await existingQuery

  if (existingError) {
    redirect(`/admin/tagihan/generate?error=${encodeURIComponent(existingError.message)}`)
  }

  const existingPelangganIds = new Set((existingRows ?? []).map((item) => item.pelanggan_id))

  // Bangun tagihan per-pelanggan dengan jatuh_tempo individual
  const inserts = pelangganAktif
    .filter((item) => !existingPelangganIds.has(item.id))
    .map((item) => {
      const paket = Array.isArray(item.paket_internet) ? item.paket_internet[0] : item.paket_internet

      // Hitung jatuh_tempo: hari join pelanggan di bulan tagihan, capped di hari terakhir bulan
      let dueDay = dueDay_input
      if (item.tanggal_bergabung) {
        const joinDay = new Date(item.tanggal_bergabung).getUTCDate()
        const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
        dueDay = Math.min(joinDay, lastDayOfMonth)
      }
      const dueDateStr =
        dueDateOverride ??
        `${year}-${String(month).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`

      return {
        pelanggan_id: item.id,
        bulan: month,
        tahun: year,
        jumlah_tagihan: paket?.harga ?? 0,
        status_tagihan: 'belum_bayar',
        jatuh_tempo: dueDateStr,
        created_at: createdAt,
      }
    })

  if (inserts.length > 0) {
    const { error: insertError } = await admin.from('tagihan').insert(inserts)
    if (insertError) {
      redirect(`/admin/tagihan/generate?error=${encodeURIComponent(insertError.message)}`)
    }
  }

  await syncSuspendedPelangganStatuses(inserts.map((item) => item.pelanggan_id))
  revalidatePath('/admin')
  revalidatePath('/admin/tagihan')
  redirect(
    `/admin/tagihan/generate?success=${encodeURIComponent(
      `${inserts.length} tagihan bulanan berhasil dibuat untuk periode ${month}/${year}.`,
    )}`,
  )
}

export async function generateTagihanInstalasiManual(formData: FormData) {
  const admin = createAdminClient()
  const pelangganId = String(formData.get('pelanggan_id') ?? 'semua').trim()
  const dueDateOverride = parseDateInput(formData.get('jatuh_tempo'))

  if (dueDateOverride === 'invalid') {
    redirect('/admin/tagihan/generate?jenis=instalasi&error=Format%20jatuh%20tempo%20tidak%20valid.')
  }

  let pelangganQuery = admin
    .from('pelanggan')
    .select('id')
    .eq('status_langganan', 'aktif')

  if (pelangganId && pelangganId !== 'semua') {
    pelangganQuery = pelangganQuery.eq('id', pelangganId)
  }

  const { data: pelangganRows, error: pelangganError } = await pelangganQuery

  if (pelangganError) {
    redirect(`/admin/tagihan/generate?jenis=instalasi&error=${encodeURIComponent(pelangganError.message)}`)
  }

  let existingQuery = admin
    .from('tagihan_instalasi')
    .select('pelanggan_id')

  if (pelangganId && pelangganId !== 'semua') {
    existingQuery = existingQuery.eq('pelanggan_id', pelangganId)
  }

  const { data: existingRows, error: existingError } = await existingQuery

  if (existingError) {
    redirect(`/admin/tagihan/generate?jenis=instalasi&error=${encodeURIComponent(existingError.message)}`)
  }

  const existingPelangganIds = new Set((existingRows ?? []).map((item) => item.pelanggan_id))
  const due = new Date()
  due.setUTCDate(due.getUTCDate() + 2)
  const jatuh_tempo = dueDateOverride ?? due.toISOString().slice(0, 10)

  const inserts = (pelangganRows ?? [])
    .filter((item) => !existingPelangganIds.has(item.id))
    .map((item) => ({
      pelanggan_id: item.id,
      jumlah_tagihan: BIAYA_INSTALASI,
      status_tagihan: 'belum_bayar',
      jatuh_tempo,
    }))

  if (inserts.length > 0) {
    const { error: insertError } = await admin.from('tagihan_instalasi').insert(inserts)
    if (insertError) {
      redirect(`/admin/tagihan/generate?jenis=instalasi&error=${encodeURIComponent(insertError.message)}`)
    }
  }

  await syncSuspendedPelangganStatuses(inserts.map((item) => item.pelanggan_id))
  revalidatePath('/admin')
  revalidatePath('/admin/tagihan')
  redirect(
    `/admin/tagihan/generate?jenis=instalasi&success=${encodeURIComponent(
      `${inserts.length} tagihan instalasi berhasil dibuat.`,
    )}`,
  )
}

export async function updateTagihanAction(tagihanId: string, formData: FormData) {
  const jumlahTagihan = Number(formData.get('jumlah_tagihan') ?? 0)
  const jatuhTempo = String(formData.get('jatuh_tempo') ?? '').trim() || null
  const statusTagihan = String(formData.get('status_tagihan') ?? 'belum_bayar') as
    | 'belum_bayar'
    | 'menunggu_verifikasi'
    | 'lunas'

  await updateTagihanByAdmin({ tagihanId, jumlahTagihan, jatuhTempo, statusTagihan })
  revalidatePath('/admin/tagihan')
  revalidatePath('/admin/pelanggan')
  revalidatePath(`/admin/tagihan/${tagihanId}`)
  redirect(`/admin/tagihan/${tagihanId}`)
}

export async function updateTagihanInstalasiAction(instalasiId: string, formData: FormData) {
  const jumlahTagihan = Number(formData.get('jumlah_tagihan') ?? 0)
  const jatuhTempo = String(formData.get('jatuh_tempo') ?? '').trim() || null
  const statusTagihan = String(formData.get('status_tagihan') ?? 'belum_bayar') as
    | 'belum_bayar'
    | 'menunggu_verifikasi'
    | 'lunas'

  await updateTagihanInstalasiByAdmin({ instalasiId, jumlahTagihan, jatuhTempo, statusTagihan })
  revalidatePath('/admin/tagihan')
  revalidatePath('/admin/pelanggan')
  redirect('/admin/tagihan?jenis=instalasi')
}

export async function updateJadwalInstalasiAction(jadwalId: string, formData: FormData) {
  await updateJadwalInstalasiByAdmin(jadwalId, formData)
}

export async function respondKomplainAction(komplainId: string, formData: FormData) {
  const admin = createAdminClient()
  const responAdmin = String(formData.get('respon_admin') ?? '').trim()
  const selesai = formData.get('selesai') === 'true'

  const { error } = await admin
    .from('komplain')
    .update({
      respon_admin: responAdmin || null,
      status: selesai,
    })
    .eq('id', komplainId)

  if (error) {
    redirect(`/admin/komplain?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/admin/komplain')
  revalidatePath('/dashboard/komplain')
  redirect('/admin/komplain?success=Komplain%20berhasil%20diperbarui.')
}

export async function deleteKomplainAction(komplainId: string) {
  const admin = createAdminClient()

  const { error } = await admin.from('komplain').delete().eq('id', komplainId)

  if (error) {
    redirect(`/admin/komplain?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/admin/komplain')
  revalidatePath('/dashboard/komplain')
  redirect('/admin/komplain?success=Komplain%20berhasil%20dihapus.')
}
 
