import Link from 'next/link'
import { Download, BarChart2, Filter, X } from 'lucide-react'
import { formatRupiah } from '@/lib/data/dashboardPelanggan'
import { getLaporanOverview, getLaporanPreview } from '@/lib/data/laporan'

const bulanNama = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
const bulanOptions = [
  { value: 'semua', label: 'Semua Bulan' },
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
]
const currentYear = new Date().getFullYear()
const tahunOptions = [
  { value: 'semua', label: 'Semua Tahun' },
  ...Array.from({ length: 5 }, (_, index) => {
    const year = currentYear - index
    return { value: String(year), label: String(year) }
  }),
]
const statusOptions = [
  { value: 'semua', label: 'Semua Status' },
  { value: 'belum_bayar', label: 'Belum Dibayar' },
  { value: 'menunggu_verifikasi', label: 'Menunggu Verifikasi' },
  { value: 'lunas', label: 'Lunas' },
]
const exportOptions = [
  { label: 'Tagihan', type: 'tagihan' },
  { label: 'Pembayaran', type: 'pembayaran' },
  { label: 'Pelanggan', type: 'pelanggan' },
  { label: 'Komplain', type: 'komplain' },
]

interface SearchParams {
  bulan?: string
  tahun?: string
  status?: string
}

function parseMonth(value?: string) {
  const month = Number(value)
  return Number.isInteger(month) && month >= 1 && month <= 12 ? month : null
}

function parseYear(value?: string) {
  const year = Number(value)
  return Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : null
}

export default async function AdminLaporanPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const filters = {
    bulan: parseMonth(searchParams.bulan),
    tahun: parseYear(searchParams.tahun),
    status: statusOptions.some((item) => item.value === searchParams.status && item.value !== 'semua')
      ? searchParams.status
      : null,
  }
  const [overview, preview] = await Promise.all([
    getLaporanOverview(filters),
    getLaporanPreview(filters),
  ])

  const cards = [
    { label: 'Pelanggan Aktif', value: overview.pelangganAktif, sub: `${overview.totalPelanggan} total pelanggan` },
    { label: 'Tagihan Lunas', value: overview.tagihanLunas, sub: `${overview.totalTagihan} total tagihan` },
    { label: 'Menunggu Verifikasi', value: overview.tagihanMenungguVerifikasi, sub: 'Perlu dicek admin' },
    { label: 'Komplain Menunggu', value: overview.komplainMenunggu, sub: `${overview.totalKomplain} total komplain` },
  ]

  const hasActiveFilters = filters.bulan || filters.tahun || filters.status

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 size={20} className='text-brand-purple' />
            Laporan
          </h1>
          <p className="mt-1 text-sm text-gray-500">Ringkasan operasional, review data terbaru, dan export laporan admin.</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-card">
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center">
          <form action="/admin/laporan" className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Filter size={15} className="text-brand-purple" />
            Filter Laporan
          </div>
          <select
            name="bulan"
            defaultValue={filters.bulan ? String(filters.bulan) : 'semua'}
            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-700 outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 sm:w-48"
          >
            {bulanOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            name="tahun"
            defaultValue={filters.tahun ? String(filters.tahun) : 'semua'}
            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-700 outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 sm:w-48"
          >
            {tahunOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={filters.status ?? 'semua'}
            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-700 outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 sm:w-64"
          >
            {statusOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-10 w-full rounded-xl bg-brand-purple px-4 text-sm font-semibold text-white transition hover:bg-brand-purple/90 sm:w-auto"
          >
            Terapkan
          </button>
          {hasActiveFilters ? (
            <Link
              href="/admin/laporan"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-red-200 px-3 text-sm font-medium text-red-500 transition hover:bg-red-50"
            >
              <X size={14} />
              Reset
            </Link>
          ) : null}
          </form>

          <form action="/admin/laporan/export" method="get" className="flex w-full flex-col gap-2 sm:flex-row lg:ml-auto lg:w-auto">
            {filters.bulan ? <input type="hidden" name="bulan" value={filters.bulan} /> : null}
            {filters.tahun ? <input type="hidden" name="tahun" value={filters.tahun} /> : null}
            {filters.status ? <input type="hidden" name="status" value={filters.status} /> : null}
            <select
              name="type"
              className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 sm:w-48"
              defaultValue="tagihan"
            >
              {exportOptions.map((item) => (
                <option key={item.type} value={item.type}>
                  {item.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:w-auto"
            >
              <Download size={14} />
              Export Excel
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl bg-white p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{card.label}</p>
            <p className="mt-3 font-display text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="mt-1 text-xs text-gray-400">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold text-gray-900">Review Keuangan</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-400">Pendapatan Terverifikasi</p>
              <p className="mt-2 font-semibold text-green-700">{formatRupiah(overview.totalPendapatanTerverifikasi)}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-400">Total Tunggakan</p>
              <p className="mt-2 font-semibold text-red-600">{formatRupiah(overview.totalTunggakan)}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-400">Pelanggan Pending</p>
              <p className="mt-2 font-semibold text-yellow-700">{overview.pelangganPending}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-400">Pelanggan Ditangguhkan</p>
              <p className="mt-2 font-semibold text-orange-700">{overview.pelangganDitangguhkan}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-400">Pelanggan Nonaktif</p>
              <p className="mt-2 font-semibold text-gray-700">{overview.pelangganNonaktif}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold text-gray-900">Review Operasional</h2>
          <div className="mt-5 space-y-3 text-sm text-gray-600">
            <div className="rounded-xl border border-gray-100 px-4 py-3">
              Ada <span className="font-semibold text-gray-900">{overview.tagihanBelumBayar}</span> tagihan belum dibayar di luar yang sedang diverifikasi.
            </div>
            <div className="rounded-xl border border-gray-100 px-4 py-3">
              Ada <span className="font-semibold text-gray-900">{overview.tagihanMenungguVerifikasi}</span> pembayaran yang sedang menunggu pemeriksaan admin.
            </div>
            <div className="rounded-xl border border-gray-100 px-4 py-3">
              Ada <span className="font-semibold text-gray-900">{overview.komplainMenunggu}</span> komplain pelanggan yang belum selesai.
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold text-gray-900">Tagihan Terbaru</h2>
          <div className="mt-4 space-y-3">
            {preview.tagihan.map((item: any) => (
              <div key={item.id} className="rounded-xl border border-gray-100 px-4 py-3 text-sm">
                <p className="font-semibold text-gray-900">{item.pelanggan?.nama_lengkap ?? '-'}</p>
                <p className="text-gray-500">
                  {bulanNama[item.bulan - 1]} {item.tahun} · {formatRupiah(item.jumlah_tagihan)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold text-gray-900">Pembayaran Terbaru</h2>
          <div className="mt-4 space-y-3">
            {preview.pembayaran.map((item: any) => (
              <div key={item.id} className="rounded-xl border border-gray-100 px-4 py-3 text-sm">
                <p className="font-semibold text-gray-900">{item.tagihan?.pelanggan?.nama_lengkap ?? '-'}</p>
                <p className="text-gray-500">
                  {item.tagihan ? `${bulanNama[item.tagihan.bulan - 1]} ${item.tagihan.tahun}` : '-'} · {formatRupiah(item.jumlah_bayar)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold text-gray-900">Komplain Terbaru</h2>
          <div className="mt-4 space-y-3">
            {preview.komplain.map((item: any) => (
              <div key={item.id} className="rounded-xl border border-gray-100 px-4 py-3 text-sm">
                <p className="font-semibold text-gray-900">{item.pelanggan?.nama_lengkap ?? '-'}</p>
                <p className="line-clamp-2 text-gray-500">{item.isi_komplain}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
