import { createAdminClient } from '@/lib/supabase/admin'
import { unstable_cache } from 'next/cache'

export interface LaporanOverview {
  totalPelanggan: number
  pelangganAktif: number
  pelangganPending: number
  pelangganNonaktif: number
  totalTagihan: number
  tagihanBelumBayar: number
  tagihanMenungguVerifikasi: number
  tagihanLunas: number
  totalPendapatanTerverifikasi: number
  totalTunggakan: number
  totalKomplain: number
  komplainMenunggu: number
}

// Cache overview for 60 seconds — summary data doesn't need real-time accuracy
export const getLaporanOverview = unstable_cache(
  async (): Promise<LaporanOverview> => {
    const admin = createAdminClient()

    // All count-only queries in parallel — no full row fetches
    const [
      totalPelanggan,
      pelangganAktif,
      pelangganPending,
      pelangganNonaktif,
      totalTagihan,
      tagihanBelumBayar,
      tagihanMenungguVerifikasi,
      tagihanLunas,
      totalKomplain,
      komplainMenunggu,
      // Financial data still needs rows but we minimise columns
      pembayaranDiterima,
      tagihanTunggakan,
    ] = await Promise.all([
      admin.from('pelanggan').select('*', { count: 'exact', head: true }),
      admin.from('pelanggan').select('*', { count: 'exact', head: true }).eq('status_langganan', 'aktif'),
      admin.from('pelanggan').select('*', { count: 'exact', head: true }).eq('status_langganan', 'pending'),
      admin.from('pelanggan').select('*', { count: 'exact', head: true }).eq('status_langganan', 'nonaktif'),
      admin.from('tagihan').select('*', { count: 'exact', head: true }),
      admin.from('tagihan').select('*', { count: 'exact', head: true }).eq('status_tagihan', 'belum_bayar'),
      admin.from('tagihan').select('*', { count: 'exact', head: true }).eq('status_tagihan', 'menunggu_verifikasi'),
      admin.from('tagihan').select('*', { count: 'exact', head: true }).eq('status_tagihan', 'lunas'),
      admin.from('komplain').select('*', { count: 'exact', head: true }),
      admin.from('komplain').select('*', { count: 'exact', head: true }).eq('status', false),
      // Only fetch minimal columns for sum calculations
      admin.from('pembayaran').select('jumlah_bayar').eq('status_verifikasi', 'diterima'),
      admin.from('tagihan').select('jumlah_tagihan').neq('status_tagihan', 'lunas'),
    ])

    const totalPendapatanTerverifikasi = (pembayaranDiterima.data ?? []).reduce(
      (sum, item) => sum + item.jumlah_bayar,
      0,
    )
    const totalTunggakan = (tagihanTunggakan.data ?? []).reduce(
      (sum, item) => sum + item.jumlah_tagihan,
      0,
    )

    return {
      totalPelanggan: totalPelanggan.count ?? 0,
      pelangganAktif: pelangganAktif.count ?? 0,
      pelangganPending: pelangganPending.count ?? 0,
      pelangganNonaktif: pelangganNonaktif.count ?? 0,
      totalTagihan: totalTagihan.count ?? 0,
      tagihanBelumBayar: tagihanBelumBayar.count ?? 0,
      tagihanMenungguVerifikasi: tagihanMenungguVerifikasi.count ?? 0,
      tagihanLunas: tagihanLunas.count ?? 0,
      totalPendapatanTerverifikasi,
      totalTunggakan,
      totalKomplain: totalKomplain.count ?? 0,
      komplainMenunggu: komplainMenunggu.count ?? 0,
    }
  },
  ['laporan-overview'],
  { revalidate: 60 },
)

// Cache preview for 60 seconds
export const getLaporanPreview = unstable_cache(
  async () => {
    const admin = createAdminClient()

    const [{ data: tagihan }, { data: pembayaran }, { data: komplain }] = await Promise.all([
      admin
        .from('tagihan')
        .select('*, pelanggan(nama_lengkap, email)')
        .order('tahun', { ascending: false })
        .order('bulan', { ascending: false })
        .limit(8),
      admin
        .from('pembayaran')
        .select('*, tagihan(bulan, tahun, pelanggan(nama_lengkap))')
        .order('tanggal_pembayaran', { ascending: false })
        .limit(8),
      admin
        .from('komplain')
        .select('*, pelanggan(nama_lengkap)')
        .order('tanggal', { ascending: false })
        .limit(8),
    ])

    return {
      tagihan: tagihan ?? [],
      pembayaran: pembayaran ?? [],
      komplain: komplain ?? [],
    }
  },
  ['laporan-preview'],
  { revalidate: 60 },
)