'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { approvePayment } from '@/lib/data/pembayaran'
import {
  deleteTagihan,
  deleteTagihanInstalasi,
  markAsPaid,
  markAsPaidInstalasi,
  updateTagihanByAdmin,
} from '@/lib/data/tagihan'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const BIAYA_INSTALASI = 600_000

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
    .update({ status_langganan: 'aktif', tanggal_bergabung: new Date().toISOString() })
    .eq('id', pelangganId)

  if (!existing) {
    await createTagihanInstalasi(admin, pelangganId)
  }

  revalidatePath('/admin')
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

  if (row?.tagihan_id) {
    await admin.from('tagihan').update({ status_tagihan: 'belum_bayar' }).eq('id', row.tagihan_id)
  } else if (row?.tagihan_instalasi_id) {
    await admin
      .from('tagihan_instalasi')
      .update({ status_tagihan: 'belum_bayar', bukti_pembayaran: null })
      .eq('id', row.tagihan_instalasi_id)
  }

  revalidatePath('/admin')
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

export async function activatePelanggan(pelangganId: string, _formData: FormData) {
  const admin = createAdminClient()
  await admin.from('pelanggan').update({ status_langganan: 'aktif' }).eq('id', pelangganId)
  revalidatePath('/admin/pelanggan')
}

export async function togglePelangganStatus(
  pelangganId: string,
  currentStatus: string,
  _formData: FormData
) {
  const admin = createAdminClient()

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

  revalidatePath('/admin/pelanggan')
}

/*
-----------------------------
  Function untuk CRUD Paket
-----------------------------
*/

export async function togglePaketStatus(
  paketId: string,
  isActive: boolean,
  _formData: FormData
) {
  const admin = createAdminClient()

  await admin
    .from('paket_internet')
    .update({
      is_active: !isActive
    })
    .eq('id', paketId)

  revalidatePath('/admin/paket')
}

export async function deletePaket(
  paketId: string,
  _formData: FormData
) {
  const admin = createAdminClient()

  await admin
    .from('paket_internet')
    .delete()
    .eq('id', paketId)

  revalidatePath('/admin/paket')
}

export async function addPaket(
  formData: FormData
) {
  const admin = createAdminClient()

  const nama_paket =
    formData.get('nama_paket') as string

  const kecepatan_mbps = Number(
    formData.get('kecepatan_mbps')
  )

  const harga = Number(
    formData.get('harga')
  )

  const deskripsi =
    formData.get('deskripsi') as string

  const createAnother =
    formData.get('create_another')

  const { error } = await admin
    .from('paket_internet')
    .insert({
      nama_paket,
      kecepatan_mbps,
      harga,
      deskripsi,
      is_active: true,
    })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/paket')

  if (createAnother) {
    redirect(
      `/admin/paket/createPaket?reset=${Date.now()}`
    )
  }

  redirect('/admin/paket')
}

export async function updatePaket(
  paketId: string,
  formData: FormData
) {
  const admin = createAdminClient()

  const nama_paket =
    formData.get('nama_paket') as string

  const kecepatan_mbps = Number(
    formData.get('kecepatan_mbps')
  )

  const harga = Number(
    formData.get('harga')
  )

  const deskripsi =
    formData.get('deskripsi') as string

  const { error } = await admin
    .from('paket_internet')
    .update({
      nama_paket,
      kecepatan_mbps,
      harga,
      deskripsi,
    })
    .eq('id', paketId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/paket')

  redirect('/admin/paket')
}

/*
---------------------------------
  Function untuk CRUD Pelanggan
---------------------------------
*/

// ── Tambah pelanggan oleh admin ───────────────────────────────────────────────
export async function addPelangganByAdmin(formData: FormData) {
  const admin = createAdminClient()

  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (password !== confirmPassword) return { error: 'Password tidak cocok.' }
  if (password.length < 8) return { error: 'Password minimal 8 karakter.' }

  const nama_lengkap = formData.get('nama_lengkap') as string
  const email = formData.get('email') as string
  const no_hp = formData.get('no_hp') as string
  const alamat_pemasangan = formData.get('alamat_pemasangan') as string
  const paket_id = formData.get('paket_id') as string
  const status_langganan = (formData.get('status_langganan') as string) || 'aktif'
  const latRaw = formData.get('latitude') as string
  const lngRaw = formData.get('longitude') as string
  const tanggalRaw = formData.get('tanggal_bergabung') as string

  if (!nama_lengkap || !email || !no_hp || !alamat_pemasangan || !paket_id) {
    return { error: 'Semua field wajib diisi.' }
  }

  // Buat akun auth via admin API (tanpa email confirmation)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nama_lengkap },
  })

  if (authError) {
    if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
      return { error: 'Email ini sudah terdaftar.' }
    }
    return { error: authError.message }
  }

  if (!authData.user) return { error: 'Gagal membuat akun.' }

  const tanggal_bergabung = tanggalRaw
    ? new Date(tanggalRaw).toISOString()
    : new Date().toISOString()

  const { error: pelangganError } = await admin.from('pelanggan').insert({
    user_id: authData.user.id,
    nama_lengkap,
    email,
    no_hp,
    alamat_pemasangan,
    latitude: latRaw ? Number(latRaw) : null,
    longitude: lngRaw ? Number(lngRaw) : null,
    paket_id,
    status_langganan,
    tanggal_bergabung,
  })

  if (pelangganError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return { error: 'Gagal menyimpan data pelanggan.' }
  }

  // Jika langsung diaktifkan oleh admin, buat tagihan instalasi 600k
  if (status_langganan === 'aktif') {
    const { data: newPelanggan } = await admin
      .from('pelanggan')
      .select('id')
      .eq('user_id', authData.user.id)
      .maybeSingle()
    if (newPelanggan?.id) {
      await createTagihanInstalasi(admin, newPelanggan.id)
    }
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
}
 
export async function deleteTagihanAction(tagihanId: string): Promise<void> {
  await deleteTagihan(tagihanId)
  revalidatePath('/admin/tagihan')
}

export async function markAsPaidInstalasiAction(instalasiId: string): Promise<void> {
  await markAsPaidInstalasi(instalasiId)
  revalidatePath('/admin/tagihan')
}

export async function deleteTagihanInstalasiAction(instalasiId: string): Promise<void> {
  await deleteTagihanInstalasi(instalasiId)
  revalidatePath('/admin/tagihan')
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
  const dueDay_input = Number(formData.get('jatuh_tempo_hari') ?? 10)

  if (!month || !year) {
    redirect('/admin/tagihan/generate?error=Periode%20tagihan%20tidak%20valid.')
  }

  const { createdAt } = getMonthDateRange(month, year, dueDay_input)

  const { data: pelangganRows, error: pelangganError } = await admin
    .from('pelanggan')
    .select('id, paket_id, tanggal_bergabung, paket_internet(harga)')
    .eq('status_langganan', 'aktif')

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

  const { data: existingRows, error: existingError } = await admin
    .from('tagihan')
    .select('pelanggan_id')
    .eq('bulan', month)
    .eq('tahun', year)

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
      const dueDateStr = `${year}-${String(month).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`

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

  revalidatePath('/admin')
  revalidatePath('/admin/tagihan')
  redirect(
    `/admin/tagihan/generate?success=${encodeURIComponent(
      `${inserts.length} tagihan berhasil dibuat untuk periode ${month}/${year}.`,
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
  revalidatePath(`/admin/tagihan/${tagihanId}`)
  redirect(`/admin/tagihan/${tagihanId}`)
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
 
