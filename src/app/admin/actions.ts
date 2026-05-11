'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { deleteTagihan, markAsPaid, updateTagihanByAdmin } from '@/lib/data/tagihan'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function approvePelanggan(pelangganId: string, _formData: FormData) {
  const admin = createAdminClient()
  const { error } = await admin.from('pelanggan').update({ status_langganan: 'aktif' }).eq('id', pelangganId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function approvePembayaran(pembayaranId: string, tagihanId: string, _formData: FormData) {
  const admin = createAdminClient()
  await Promise.all([
    admin.from('pembayaran').update({ status_verifikasi: 'diterima' }).eq('id', pembayaranId),
    admin.from('tagihan').update({ status_tagihan: 'lunas' }).eq('id', tagihanId),
  ])
  revalidatePath('/admin')
  revalidatePath('/admin/verifikasi')
}

export async function rejectPembayaran(pembayaranId: string, catatan: string, _formData: FormData) {
  const admin = createAdminClient()
  await admin
    .from('pembayaran')
    .update({ status_verifikasi: 'ditolak', catatan_admin: catatan })
    .eq('id', pembayaranId)
  revalidatePath('/admin')
  revalidatePath('/admin/verifikasi')
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
  const dueDay = Number(formData.get('jatuh_tempo_hari') ?? 10)

  if (!month || !year) {
    redirect('/admin/tagihan/generate?error=Periode%20tagihan%20tidak%20valid.')
  }

  const { createdAt, dueDate } = getMonthDateRange(month, year, dueDay)

  const { data: pelangganRows, error: pelangganError } = await admin
    .from('pelanggan')
    .select('id, paket_id, paket_internet(harga)')
    .eq('status_langganan', 'aktif')

  if (pelangganError) {
    redirect(`/admin/tagihan/generate?error=${encodeURIComponent(pelangganError.message)}`)
  }

  const pelangganAktif = (pelangganRows ?? []).filter((item) => item.paket_id && item.paket_internet)

  const { data: existingRows, error: existingError } = await admin
    .from('tagihan')
    .select('pelanggan_id')
    .eq('bulan', month)
    .eq('tahun', year)

  if (existingError) {
    redirect(`/admin/tagihan/generate?error=${encodeURIComponent(existingError.message)}`)
  }

  const existingPelangganIds = new Set((existingRows ?? []).map((item) => item.pelanggan_id))

  const inserts = pelangganAktif
    .filter((item) => !existingPelangganIds.has(item.id))
    .map((item) => {
      const paket = Array.isArray(item.paket_internet) ? item.paket_internet[0] : item.paket_internet
      return {
        pelanggan_id: item.id,
        bulan: month,
        tahun: year,
        jumlah_tagihan: paket?.harga ?? 0,
        status_tagihan: 'belum_bayar',
        jatuh_tempo: dueDate,
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
 
