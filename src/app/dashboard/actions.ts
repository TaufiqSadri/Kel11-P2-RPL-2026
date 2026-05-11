'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function getAuthenticatedPelanggan() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: pelanggan } = await supabase
    .from('pelanggan')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!pelanggan) redirect('/login')

  return { supabase, pelanggan, user }
}

function redirectWithMessage(path: string, type: 'success' | 'error', message: string) {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`)
}

export async function submitPembayaran(formData: FormData) {
  const { supabase, pelanggan } = await getAuthenticatedPelanggan()

  const tagihanId = String(formData.get('tagihan_id') ?? '')
  const buktiPembayaran = String(formData.get('bukti_pembayaran') ?? '').trim()
  const jumlahBayar = Number(formData.get('jumlah_bayar') ?? 0)

  if (!tagihanId || !buktiPembayaran || !jumlahBayar) {
    redirectWithMessage(`/dashboard/tagihan/${tagihanId}`, 'error', 'Jumlah bayar dan file bukti pembayaran wajib diisi.')
  }

  try {
    new URL(buktiPembayaran)
  } catch {
    redirectWithMessage(`/dashboard/tagihan/${tagihanId}`, 'error', 'File bukti pembayaran belum berhasil diunggah.')
  }

  const { data: tagihan } = await supabase
    .from('tagihan')
    .select('*')
    .eq('id', tagihanId)
    .eq('pelanggan_id', pelanggan.id)
    .single()

  if (!tagihan) {
    redirectWithMessage('/dashboard/tagihan', 'error', 'Tagihan tidak ditemukan.')
  }

  if (tagihan.status_tagihan !== 'belum_bayar') {
    redirectWithMessage(`/dashboard/tagihan/${tagihanId}`, 'error', 'Tagihan ini tidak bisa dibayar ulang saat ini.')
  }

  const { data: pembayaranAktif } = await supabase
    .from('pembayaran')
    .select('id, status_verifikasi')
    .eq('tagihan_id', tagihanId)
    .in('status_verifikasi', ['menunggu', 'diterima'])

  if ((pembayaranAktif ?? []).length > 0) {
    redirectWithMessage(`/dashboard/tagihan/${tagihanId}`, 'error', 'Pembayaran untuk tagihan ini sudah pernah dikirim.')
  }

  const admin = createAdminClient()
  const [{ error: insertError }, { error: updateError }] = await Promise.all([
    admin.from('pembayaran').insert({
      tagihan_id: tagihanId,
      tanggal_pembayaran: new Date().toISOString(),
      jumlah_bayar: jumlahBayar,
      bukti_pembayaran: buktiPembayaran,
      status_verifikasi: 'menunggu',
    }),
    admin.from('tagihan').update({ status_tagihan: 'menunggu_verifikasi' }).eq('id', tagihanId),
  ])

  if (insertError || updateError) {
    redirectWithMessage(
      `/dashboard/tagihan/${tagihanId}`,
      'error',
      insertError?.message ?? updateError?.message ?? 'Gagal mengirim pembayaran.',
    )
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/tagihan')
  revalidatePath(`/dashboard/tagihan/${tagihanId}`)
  revalidatePath('/dashboard/riwayat')
  revalidatePath('/admin/verifikasi')
  revalidatePath('/admin/tagihan')

  redirectWithMessage(`/dashboard/tagihan/${tagihanId}`, 'success', 'Bukti pembayaran berhasil dikirim.')
}

export async function submitPembayaranInstalasi(formData: FormData) {
  const { pelanggan } = await getAuthenticatedPelanggan()
  const admin = createAdminClient()

  const instalasiId = String(formData.get('instalasi_id') ?? '')
  const buktiPembayaran = String(formData.get('bukti_pembayaran') ?? '').trim()
  const jumlahBayar = Number(formData.get('jumlah_bayar') ?? 0)

  if (!instalasiId || !buktiPembayaran || !jumlahBayar) {
    redirectWithMessage(`/dashboard/tagihan-instalasi/${instalasiId}`, 'error', 'Jumlah bayar dan file bukti pembayaran wajib diisi.')
  }

  try { new URL(buktiPembayaran) } catch {
    redirectWithMessage(`/dashboard/tagihan-instalasi/${instalasiId}`, 'error', 'File bukti pembayaran belum berhasil diunggah.')
  }

  // Pastikan tagihan instalasi milik pelanggan ini
  const { data: instalasi } = await admin
    .from('tagihan_instalasi')
    .select('*')
    .eq('id', instalasiId)
    .eq('pelanggan_id', pelanggan.id)
    .single()

  if (!instalasi) redirectWithMessage('/dashboard', 'error', 'Tagihan instalasi tidak ditemukan.')
  if (instalasi.status_tagihan !== 'belum_bayar') {
    redirectWithMessage(`/dashboard/tagihan-instalasi/${instalasiId}`, 'error', 'Tagihan instalasi ini sudah dibayar atau sedang diverifikasi.')
  }

  const { data: pembayaranAktif } = await admin
    .from('pembayaran')
    .select('id, status_verifikasi')
    .eq('tagihan_instalasi_id', instalasiId)
    .in('status_verifikasi', ['menunggu', 'diterima'])

  if ((pembayaranAktif ?? []).length > 0) {
    redirectWithMessage(
      `/dashboard/tagihan-instalasi/${instalasiId}`,
      'error',
      'Pembayaran untuk tagihan instalasi ini sudah pernah dikirim.',
    )
  }

  const [{ error: insertError }, { error: updateError }] = await Promise.all([
    admin.from('pembayaran').insert({
      tagihan_id: null,
      tagihan_instalasi_id: instalasiId,
      tanggal_pembayaran: new Date().toISOString(),
      jumlah_bayar: jumlahBayar,
      bukti_pembayaran: buktiPembayaran,
      status_verifikasi: 'menunggu',
    }),
    admin
      .from('tagihan_instalasi')
      .update({ status_tagihan: 'menunggu_verifikasi', bukti_pembayaran: buktiPembayaran })
      .eq('id', instalasiId),
  ])

  if (insertError || updateError) {
    redirectWithMessage(
      `/dashboard/tagihan-instalasi/${instalasiId}`,
      'error',
      insertError?.message ?? updateError?.message ?? 'Gagal mengirim pembayaran.',
    )
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/riwayat')
  revalidatePath(`/dashboard/tagihan-instalasi/${instalasiId}`)
  revalidatePath('/admin/verifikasi')
  revalidatePath('/admin/tagihan')
  redirectWithMessage(`/dashboard/tagihan-instalasi/${instalasiId}`, 'success', 'Bukti pembayaran instalasi berhasil dikirim.')
}


export async function updateProfilPelanggan(formData: FormData) {
  const { supabase, pelanggan } = await getAuthenticatedPelanggan()

  const noHp = String(formData.get('no_hp') ?? '').trim()
  const alamat = String(formData.get('alamat_pemasangan') ?? '').trim()
  const latitudeRaw = String(formData.get('latitude') ?? '').trim()
  const longitudeRaw = String(formData.get('longitude') ?? '').trim()

  if (!noHp || !alamat) {
    redirectWithMessage('/dashboard/profil', 'error', 'Nomor HP dan alamat pemasangan wajib diisi.')
  }

  const { error } = await supabase
    .from('pelanggan')
    .update({
      no_hp: noHp,
      alamat_pemasangan: alamat,
      latitude: latitudeRaw ? Number(latitudeRaw) : null,
      longitude: longitudeRaw ? Number(longitudeRaw) : null,
    })
    .eq('id', pelanggan.id)

  if (error) {
    redirectWithMessage('/dashboard/profil', 'error', error.message)
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/profil')

  redirectWithMessage('/dashboard/profil', 'success', 'Profil berhasil diperbarui.')
}

export async function createKomplain(formData: FormData) {
  const { supabase, pelanggan } = await getAuthenticatedPelanggan()

  const isiKomplain = String(formData.get('isi_komplain') ?? '').trim()

  if (isiKomplain.length < 10) {
    redirectWithMessage('/dashboard/komplain', 'error', 'Isi komplain minimal 10 karakter.')
  }

  const { error } = await supabase.from('komplain').insert({
    pelanggan_id: pelanggan.id,
    tanggal: new Date().toISOString(),
    isi_komplain: isiKomplain,
    status: false,
  })

  if (error) {
    redirectWithMessage('/dashboard/komplain', 'error', error.message)
  }

  revalidatePath('/dashboard/komplain')

  redirectWithMessage('/dashboard/komplain', 'success', 'Komplain berhasil dikirim.')
}
