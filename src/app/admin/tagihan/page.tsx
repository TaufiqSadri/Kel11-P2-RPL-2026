import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getTagihanStats, getTagihanInstalasiStats, getAllTagihan, getAllTagihanInstalasi } from '@/lib/data/tagihan'
import BillingStats from '@/components/admin/billing/billingStats'
import BillingFilters from '@/components/admin/billing/billingFilters'
import BillingTable from '@/components/admin/billing/billingTable'
import { CustomerStatsSkeleton, CustomerTableSkeleton } from '@/components/admin/customers/customerSkeleton'
import type { TagihanStatus } from '@/lib/data/tagihan'
 
interface SearchParams {
  pelanggan?: string
  search?: string
  bulan?: string
  tahun?: string
  status?: string
  sort?: string
  page?: string
  jenis?: string
}

// ─── Stats section ────────────────────────────────────────────────────────────
async function StatsSection({ jenis }: { jenis: 'bulanan' | 'instalasi' }) {
  const stats =
    jenis === 'instalasi' ? await getTagihanInstalasiStats() : await getTagihanStats()
  return <BillingStats stats={stats} forInstalasi={jenis === 'instalasi'} />
}

// ─── Table section ────────────────────────────────────────────────────────────
async function TableSection({ searchParams }: { searchParams: SearchParams }) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const validStatuses: TagihanStatus[] = ['belum_bayar', 'menunggu_verifikasi', 'lunas', 'overdue']
  const status = validStatuses.includes(searchParams.status as TagihanStatus)
    ? (searchParams.status as TagihanStatus)
    : 'semua'

  const jenis = searchParams.jenis === 'instalasi' ? 'instalasi' : 'bulanan'

  if (jenis === 'instalasi') {
    const result = await getAllTagihanInstalasi({
      pelangganId: searchParams.pelanggan,
      search: searchParams.search ?? '',
      status,
      sort: searchParams.sort === 'terlama' ? 'terlama' : 'terbaru',
      page,
      pageSize: 10,
    })
    return (
      <BillingTable
        variant="instalasi"
        rows={result.data}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
      />
    )
  }

  const result = await getAllTagihan({
    pelangganId: searchParams.pelanggan,
    search: searchParams.search ?? '',
    bulan: searchParams.bulan ?? 'semua',
    tahun: searchParams.tahun ?? 'semua',
    status,
    sort: searchParams.sort === 'terlama' ? 'terlama' : 'terbaru',
    page,
    pageSize: 10,
  })

  return (
    <BillingTable
      rows={result.data}
      total={result.total}
      page={result.page}
      pageSize={result.pageSize}
      totalPages={result.totalPages}
    />
  )
}
 
// ─── Stats skeleton that matches BillingStats 5-column grid ──────────────────
function BillingStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white p-5 shadow-card">
          <div className="mb-3 flex items-start justify-between">
            <div className="h-2.5 w-24 animate-pulse rounded-md bg-gray-100" />
            <div className="h-9 w-9 animate-pulse rounded-xl bg-gray-100" />
          </div>
          <div className="h-8 w-16 animate-pulse rounded-md bg-gray-100" />
          <div className="mt-1 h-2.5 w-28 animate-pulse rounded-md bg-gray-100" />
        </div>
      ))}
    </div>
  )
}
 
// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function AdminTagihanPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const jenis = searchParams.jenis === 'instalasi' ? 'instalasi' : 'bulanan'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Kelola Tagihan</h1>
          <p className="mt-1 text-sm text-gray-500">
            {jenis === 'instalasi'
              ? 'Tagihan biaya instalasi perangkat (pisah dari tagihan bulanan).'
              : 'Manajemen tagihan bulanan pelanggan Distric Net'}
          </p>
        </div>
        <Link
          href="/admin/tagihan/generate"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-pink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-700 active:scale-95"
        >
          <Plus size={15} />
          Buat Tagihan
        </Link>
      </div>
 
      {/* Stats */}
      <Suspense fallback={<BillingStatsSkeleton />}>
        <StatsSection jenis={jenis} />
      </Suspense>
 
      {/* Filters */}
      <BillingFilters />
 
      {/* Table */}
      <Suspense key={JSON.stringify(searchParams)} fallback={<CustomerTableSkeleton />}>
        <TableSection searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
