import { createAdminClient } from '@/lib/supabase/admin'
import { syncSuspendedPelangganStatuses } from '@/lib/data/pelangganStatus'

export interface LaporanOverview {
  totalPelanggan: number
  pelangganAktif: number
  pelangganDitangguhkan: number
  pelangganProsesInstalasi: number
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

export interface LaporanFilters {
  bulan?: number | null
  tahun?: number | null
  status?: string | null
}

const TAGIHAN_STATUSES = ['belum_bayar', 'menunggu_verifikasi', 'lunas'] as const

function isTagihanStatus(status?: string | null) {
  return !!status && TAGIHAN_STATUSES.includes(status as (typeof TAGIHAN_STATUSES)[number])
}

function applyTagihanFilters(
  query: any,
  filters: LaporanFilters,
) {
  let next = query
  if (filters.bulan) next = next.eq('bulan', filters.bulan)
  if (filters.tahun) next = next.eq('tahun', filters.tahun)
  if (isTagihanStatus(filters.status)) next = next.eq('status_tagihan', filters.status)
  return next
}

function applyTagihanPeriodFilters(
  query: any,
  filters: LaporanFilters,
) {
  let next = query
  if (filters.bulan) next = next.eq('bulan', filters.bulan)
  if (filters.tahun) next = next.eq('tahun', filters.tahun)
  return next
}

function applyPaymentTagihanFilters(
  query: any,
  filters: LaporanFilters,
) {
  let next = query
  if (filters.bulan) next = next.eq('tagihan.bulan', filters.bulan)
  if (filters.tahun) next = next.eq('tagihan.tahun', filters.tahun)
  if (isTagihanStatus(filters.status)) next = next.eq('tagihan.status_tagihan', filters.status)
  return next
}

function dateRangeFromFilters(filters: LaporanFilters) {
  if (!filters.tahun) return null

  const startMonth = filters.bulan ? filters.bulan - 1 : 0
  const start = new Date(Date.UTC(filters.tahun, startMonth, 1))
  const end = filters.bulan
    ? new Date(Date.UTC(filters.tahun, startMonth + 1, 1))
    : new Date(Date.UTC(filters.tahun + 1, 0, 1))

  return {
    from: start.toISOString(),
    to: end.toISOString(),
  }
}

function applyDateRange(
  query: any,
  column: string,
  filters: LaporanFilters,
) {
  const range = dateRangeFromFilters(filters)
  if (!range) return query
  return query.gte(column, range.from).lt(column, range.to)
}

export async function getLaporanOverview(filters: LaporanFilters = {}): Promise<LaporanOverview> {
  await syncSuspendedPelangganStatuses()
  const admin = createAdminClient()

  const totalTagihanQuery = applyTagihanFilters(
    admin.from('tagihan').select('*', { count: 'exact', head: true }),
    filters,
  )
  const tagihanBelumBayarQuery = applyTagihanPeriodFilters(
    admin.from('tagihan').select('*', { count: 'exact', head: true }),
    filters,
  ).eq('status_tagihan', 'belum_bayar')
  const tagihanMenungguQuery = applyTagihanPeriodFilters(
    admin.from('tagihan').select('*', { count: 'exact', head: true }),
    filters,
  ).eq('status_tagihan', 'menunggu_verifikasi')
  const tagihanLunasQuery = applyTagihanPeriodFilters(
    admin.from('tagihan').select('*', { count: 'exact', head: true }),
    filters,
  ).eq('status_tagihan', 'lunas')

  const hasTagihanFilter = !!filters.bulan || !!filters.tahun || isTagihanStatus(filters.status)
  const pembayaranDiterimaQuery = hasTagihanFilter
    ? applyPaymentTagihanFilters(
        admin
          .from('pembayaran')
          .select('jumlah_bayar, tagihan!inner(bulan, tahun, status_tagihan)')
          .eq('status_verifikasi', 'diterima'),
        filters,
      )
    : admin.from('pembayaran').select('jumlah_bayar').eq('status_verifikasi', 'diterima')

  const tagihanTunggakanBase = applyTagihanPeriodFilters(
    admin.from('tagihan').select('jumlah_tagihan'),
    filters,
  )
  const tagihanTunggakanQuery =
    isTagihanStatus(filters.status) && filters.status !== 'lunas'
      ? tagihanTunggakanBase.eq('status_tagihan', filters.status)
      : tagihanTunggakanBase.neq('status_tagihan', 'lunas')

  const komplainQuery = applyDateRange(
    admin.from('komplain').select('*', { count: 'exact', head: true }),
    'tanggal',
    filters,
  )
  const komplainMenungguQuery = applyDateRange(
    admin.from('komplain').select('*', { count: 'exact', head: true }).eq('status', false),
    'tanggal',
    filters,
  )

  const [
    totalPelanggan,
    pelangganAktif,
    pelangganDitangguhkan,
    pelangganProsesInstalasi,
    pelangganPending,
    pelangganNonaktif,
    totalTagihan,
    tagihanBelumBayar,
    tagihanMenungguVerifikasi,
    tagihanLunas,
    totalKomplain,
    komplainMenunggu,
    pembayaranDiterima,
    tagihanTunggakan,
  ] = await Promise.all([
    admin.from('pelanggan').select('*', { count: 'exact', head: true }),
    admin.from('pelanggan').select('*', { count: 'exact', head: true }).eq('status_langganan', 'aktif'),
    admin.from('pelanggan').select('*', { count: 'exact', head: true }).eq('status_langganan', 'ditangguhkan'),
    admin.from('pelanggan').select('*', { count: 'exact', head: true }).eq('status_langganan', 'proses_instalasi'),
    admin.from('pelanggan').select('*', { count: 'exact', head: true }).eq('status_langganan', 'pending'),
    admin.from('pelanggan').select('*', { count: 'exact', head: true }).eq('status_langganan', 'nonaktif'),
    totalTagihanQuery,
    isTagihanStatus(filters.status) && filters.status !== 'belum_bayar'
      ? Promise.resolve({ count: 0 })
      : tagihanBelumBayarQuery,
    isTagihanStatus(filters.status) && filters.status !== 'menunggu_verifikasi'
      ? Promise.resolve({ count: 0 })
      : tagihanMenungguQuery,
    isTagihanStatus(filters.status) && filters.status !== 'lunas'
      ? Promise.resolve({ count: 0 })
      : tagihanLunasQuery,
    komplainQuery,
    komplainMenungguQuery,
    pembayaranDiterimaQuery,
    filters.status === 'lunas' ? Promise.resolve({ data: [] }) : tagihanTunggakanQuery,
  ])

  const totalPendapatanTerverifikasi = (pembayaranDiterima.data ?? []).reduce(
    (sum: number, item: { jumlah_bayar?: number | null }) => sum + Number(item.jumlah_bayar ?? 0),
    0,
  )
  const totalTunggakan = (tagihanTunggakan.data ?? []).reduce(
    (sum: number, item: { jumlah_tagihan?: number | null }) => sum + Number(item.jumlah_tagihan ?? 0),
    0,
  )

  return {
    totalPelanggan: totalPelanggan.count ?? 0,
    pelangganAktif: pelangganAktif.count ?? 0,
    pelangganDitangguhkan: pelangganDitangguhkan.count ?? 0,
    pelangganProsesInstalasi: pelangganProsesInstalasi.count ?? 0,
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
}

export async function getLaporanPreview(filters: LaporanFilters = {}) {
  const admin = createAdminClient()

  const tagihanQuery = applyTagihanFilters(
    admin
      .from('tagihan')
      .select('*, pelanggan(nama_lengkap, email)')
      .order('tahun', { ascending: false })
      .order('bulan', { ascending: false })
      .limit(8),
    filters,
  )

  const pembayaranQuery = applyPaymentTagihanFilters(
    admin
      .from('pembayaran')
      .select('*, tagihan!inner(bulan, tahun, status_tagihan, pelanggan(nama_lengkap))')
      .order('tanggal_pembayaran', { ascending: false })
      .limit(8),
    filters,
  )

  const komplainQuery = applyDateRange(
    admin
      .from('komplain')
      .select('*, pelanggan(nama_lengkap)')
      .order('tanggal', { ascending: false })
      .limit(8),
    'tanggal',
    filters,
  )

  const [{ data: tagihan }, { data: pembayaran }, { data: komplain }] = await Promise.all([
    tagihanQuery,
    pembayaranQuery,
    komplainQuery,
  ])

  return {
    tagihan: tagihan ?? [],
    pembayaran: pembayaran ?? [],
    komplain: komplain ?? [],
  }
}
