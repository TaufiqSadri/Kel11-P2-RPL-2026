import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentPelanggan } from '@/lib/data/pelanggan'
import type { PaketInternet, PelangganWithPaket, PembayaranRow, TagihanRow } from '@/types/database'
import { redirect } from 'next/navigation'

export type PembayaranWithTagihan = PembayaranRow & {
  tagihan: (TagihanRow & { bulan: number; tahun: number }) | null
  tagihan_instalasi?: { id: string; pelanggan_id: string } | null
}

export type KomplainRow = {
  id: string
  pelanggan_id: string | null
  tanggal: string | null
  isi_komplain: string
  status: boolean | null
  respon_admin: string | null
  created_at: string | null
}

export async function requireActivePelanggan(): Promise<PelangganWithPaket> {
  const pelanggan = await getCurrentPelanggan()

  if (!pelanggan) redirect('/login')
  if (pelanggan.status_langganan === 'pending') redirect('/dashboard/pending')
  if (pelanggan.status_langganan === 'nonaktif') redirect('/dashboard/nonaktif')

  return pelanggan
}

export async function getDashboardPelangganData() {
  const pelanggan = await requireActivePelanggan()
  const supabase = await createClient()
  const admin = createAdminClient()

  // Step 1: ambil data yang tidak butuh bypass RLS pakai supabase client biasa
  const [
    { data: tagihan },
    { data: komplain },
    { data: paketAktif },
  ] = await Promise.all([
    supabase
      .from('tagihan')
      .select('*')
      .eq('pelanggan_id', pelanggan.id)
      .order('tahun', { ascending: false })
      .order('bulan', { ascending: false }),
    supabase
      .from('komplain')
      .select('*')
      .eq('pelanggan_id', pelanggan.id)
      .order('tanggal', { ascending: false }),
    supabase
      .from('paket_internet')
      .select('*')
      .eq('is_active', true)
      .order('harga'),
  ])

  // Step 2: ambil tagihan IDs milik pelanggan
  const tagihanIds = (tagihan ?? []).map((t) => t.id)

  const { data: instalasiRows } = await admin
    .from('tagihan_instalasi')
    .select('id')
    .eq('pelanggan_id', pelanggan.id)

  const instalasiIds = (instalasiRows ?? []).map((t) => t.id)

  // Step 3: fetch pembayaran pakai adminClient untuk bypass RLS,
  // filter via .in() langsung ke FK kolom (pola yang sama dengan admin verifikasi/tagihan)
  const [pembayaranBulanan, pembayaranInstalasi] = await Promise.all([
    tagihanIds.length > 0
      ? admin
          .from('pembayaran')
          .select('*, tagihan(bulan, tahun, pelanggan_id)')
          .in('tagihan_id', tagihanIds)
          .order('tanggal_pembayaran', { ascending: false })
          .limit(20)
          .then((r) => (r.data ?? []) as PembayaranWithTagihan[])
      : Promise.resolve([] as PembayaranWithTagihan[]),

    instalasiIds.length > 0
      ? admin
          .from('pembayaran')
          .select('*, tagihan_instalasi(id, pelanggan_id)')
          .in('tagihan_instalasi_id', instalasiIds)
          .order('tanggal_pembayaran', { ascending: false })
          .limit(20)
          .then((r) => (r.data ?? []) as PembayaranWithTagihan[])
      : Promise.resolve([] as PembayaranWithTagihan[]),
  ])

  const mergedPembayaran = [...pembayaranBulanan, ...pembayaranInstalasi]
  mergedPembayaran.sort(
    (a, b) =>
      new Date(b.tanggal_pembayaran).getTime() - new Date(a.tanggal_pembayaran).getTime(),
  )
  const pembayaran = mergedPembayaran.slice(0, 20)

  return {
    pelanggan,
    tagihan: ((tagihan ?? []) as TagihanRow[]).sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
    pembayaran,
    komplain: (komplain ?? []) as KomplainRow[],
    paketAktif: (paketAktif ?? []) as PaketInternet[],
  }
}

export async function getTagihanDetailForCurrentPelanggan(tagihanId: string) {
  const pelanggan = await requireActivePelanggan()
  const supabase = await createClient()

  const { data: tagihan } = await supabase
    .from('tagihan')
    .select('*')
    .eq('id', tagihanId)
    .eq('pelanggan_id', pelanggan.id)
    .single()

  if (!tagihan) return null

  const { data: pembayaran } = await supabase
    .from('pembayaran')
    .select('*')
    .eq('tagihan_id', tagihanId)
    .order('created_at', { ascending: false })

  return {
    pelanggan,
    tagihan: tagihan as TagihanRow,
    pembayaran: (pembayaran ?? []) as PembayaranRow[],
  }
}

export async function getTagihanInstalasiDetailForCurrentPelanggan(instalasiId: string) {
  const pelanggan = await requireActivePelanggan()
  const supabase = await createClient()

  const { data: instalasi } = await supabase
    .from('tagihan_instalasi')
    .select('*')
    .eq('id', instalasiId)
    .eq('pelanggan_id', pelanggan.id)
    .single()

  if (!instalasi) return null

  const { data: pembayaran } = await supabase
    .from('pembayaran')
    .select('*')
    .eq('tagihan_instalasi_id', instalasiId)
    .order('created_at', { ascending: false })

  return {
    pelanggan,
    instalasi,
    pembayaran: (pembayaran ?? []) as PembayaranRow[],
  }
}

export function getStatusTagihanMeta(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    belum_bayar: { label: 'Belum Bayar', className: 'bg-red-100 text-red-700' },
    menunggu_verifikasi: { label: 'Menunggu Verifikasi', className: 'bg-yellow-100 text-yellow-700' },
    lunas: { label: 'Lunas', className: 'bg-green-100 text-green-700' },
  }
  return map[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
}

export function getStatusVerifikasiMeta(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    menunggu: { label: 'Menunggu', className: 'bg-yellow-100 text-yellow-700' },
    diterima: { label: 'Diterima', className: 'bg-green-100 text-green-700' },
    ditolak: { label: 'Ditolak', className: 'bg-red-100 text-red-700' },
  }
  return map[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
}

export function getStatusKomplainMeta(status: boolean | null) {
  if (status) return { label: 'Selesai', className: 'bg-green-100 text-green-700' }
  return { label: 'Menunggu Respons', className: 'bg-yellow-100 text-yellow-700' }
}

export function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`
}

export function formatPeriode(bulan: number, tahun: number) {
  const bulanNama = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
  return `${bulanNama[bulan - 1] ?? bulan} ${tahun}`
}