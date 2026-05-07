import { createClient } from '@/lib/supabase/server'
import { getCurrentPelanggan } from '@/lib/data/pelanggan'
import type { PaketInternet, PelangganWithPaket, PembayaranRow, TagihanRow } from '@/types/database'
import { redirect } from 'next/navigation'

export type PembayaranWithTagihan = PembayaranRow & {
  tagihan: TagihanRow | null
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

  // Step 1: ambil tagihan dulu — butuh ID-nya untuk filter pembayaran
  const { data: tagihan } = await supabase
    .from('tagihan')
    .select('*')
    .eq('pelanggan_id', pelanggan.id)
    .order('tahun', { ascending: false })
    .order('bulan', { ascending: false })

  const tagihanIds = (tagihan ?? []).map((t) => t.id)

  // Step 2: query sisanya paralel, pembayaran sudah difilter by tagihan IDs milik pelanggan ini
  const [{ data: pembayaran }, { data: komplain }, { data: paketAktif }] =
    await Promise.all([
      tagihanIds.length > 0
        ? supabase
            .from('pembayaran')
            .select('*, tagihan(*)')
            .in('tagihan_id', tagihanIds)
            .order('tanggal_pembayaran', { ascending: false })
            .limit(20)
        : Promise.resolve({ data: [] as PembayaranWithTagihan[], error: null }),
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

  return {
    pelanggan,
    tagihan: ((tagihan ?? []) as TagihanRow[]).sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
    pembayaran: (pembayaran ?? []) as PembayaranWithTagihan[],
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

export function getStatusTagihanMeta(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    belum_bayar: {
      label: 'Belum Bayar',
      className: 'bg-red-100 text-red-700',
    },
    menunggu_verifikasi: {
      label: 'Menunggu Verifikasi',
      className: 'bg-yellow-100 text-yellow-700',
    },
    lunas: {
      label: 'Lunas',
      className: 'bg-green-100 text-green-700',
    },
  }

  return map[status] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-600',
  }
}

export function getStatusVerifikasiMeta(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    menunggu: {
      label: 'Menunggu',
      className: 'bg-yellow-100 text-yellow-700',
    },
    diterima: {
      label: 'Diterima',
      className: 'bg-green-100 text-green-700',
    },
    ditolak: {
      label: 'Ditolak',
      className: 'bg-red-100 text-red-700',
    },
  }

  return map[status] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-600',
  }
}

export function getStatusKomplainMeta(status: boolean | null) {
  if (status) {
    return {
      label: 'Selesai',
      className: 'bg-green-100 text-green-700',
    }
  }

  return {
    label: 'Menunggu Respons',
    className: 'bg-yellow-100 text-yellow-700',
  }
}

export function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`
}

export function formatPeriode(bulan: number, tahun: number) {
  const bulanNama = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
  return `${bulanNama[bulan - 1] ?? bulan} ${tahun}`
}