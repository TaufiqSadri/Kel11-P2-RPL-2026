import { Suspense } from 'react'
import Link from 'next/link'
import { UserPlus, Users } from 'lucide-react'
import { getPelangganStats, getPelangganList, getPaketList } from '@/lib/data/pelanggan'
import CustomerStats from '@/components/admin/customers/customerStats'
import CustomerFilters from '@/components/admin/customers/customerFilters'
import CustomerTable from '@/components/admin/customers/customerTable'
import {
  CustomerStatsSkeleton,
  CustomerTableSkeleton,
} from '@/components/admin/customers/customerSkeleton'
import type { StatusLangganan } from '@/types/database'

interface SearchParams {
  search?: string
  status?: string
  paket_id?: string
  sort?: string
  page?: string
}

// ─── Stats (isolated Suspense boundary) ──────────────────────────────────────
async function StatsSection() {
  const stats = await getPelangganStats()
  return <CustomerStats stats={stats} />
}

// ─── Table (isolated Suspense boundary) ──────────────────────────────────────
async function TableSection({ searchParams }: { searchParams: SearchParams }) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const status = (['aktif', 'ditangguhkan', 'proses_instalasi', 'pending', 'nonaktif'].includes(searchParams.status ?? '')
    ? searchParams.status
    : 'semua') as StatusLangganan | 'semua'

  const result = await getPelangganList({
    search: searchParams.search ?? '',
    status,
    paket_id: searchParams.paket_id ?? 'semua',
    sort: searchParams.sort === 'terlama' ? 'terlama' : 'terbaru',
    page,
    pageSize: 10,
  })

  return (
    <CustomerTable
      rows={result.data}
      total={result.total}
      page={result.page}
      pageSize={result.pageSize}
      totalPages={result.totalPages}
    />
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function AdminPelangganPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  // Fetch paket list for filter options (fast, cached)
  const paketList = await getPaketList()

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={20} className='text-brand-purple'/>
            Kelola Pelanggan
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manajemen data pelanggan Distric Net
          </p>
        </div>
        <Link
          href="/admin/pelanggan/createPelanggan"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-pink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-700 active:scale-95"
        >
          <UserPlus size={15} />
          Tambah Pelanggan
        </Link>
      </div>

      {/* ── Stats Cards ── */}
      <Suspense fallback={<CustomerStatsSkeleton />}>
        <StatsSection />
      </Suspense>

      {/* ── Filters ── */}
      <CustomerFilters paketList={paketList} />

      {/* ── Table ── */}
      <Suspense
        key={JSON.stringify(searchParams)}
        fallback={<CustomerTableSkeleton />}
      >
        <TableSection searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
