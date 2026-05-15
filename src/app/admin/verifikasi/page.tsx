import { Suspense } from 'react'
import { getPembayaranList, getVerificationStats } from '@/lib/data/pembayaran'
import VerificationStats from '@/components/admin/verification/verificationStats'
import VerificationFilters from '@/components/admin/verification/verificationFilters'
import VerificationTableWithInvoice from '@/components/admin/verification/verificationTableWrapper'
import { CheckCircle } from 'lucide-react'

interface SearchParams {
  pelanggan?: string
  search?   : string
  status?   : string
  sort?     : string
  page?     : string
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white p-5 shadow-card">
          <div className="mb-3 flex items-start justify-between">
            <div className="h-2.5 w-28 animate-pulse rounded-md bg-gray-100" />
            <div className="h-9 w-9 animate-pulse rounded-xl bg-gray-100" />
          </div>
          <div className="h-8 w-12 animate-pulse rounded-md bg-gray-100" />
          <div className="mt-1 h-2.5 w-24 animate-pulse rounded-md bg-gray-100" />
        </div>
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="rounded-2xl bg-white shadow-card overflow-hidden">
      <div className="hidden lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Pelanggan','Periode','Nominal','Tanggal Upload','Bukti','Status','Invoice','Aksi'].map((h) => (
                <th key={h} className="px-5 pb-3 pt-5 text-left text-xs font-semibold uppercase tracking-wider text-gray-300">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 animate-pulse rounded-full bg-gray-100" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-32 animate-pulse rounded-md bg-gray-100" />
                      <div className="h-2.5 w-20 animate-pulse rounded-md bg-gray-100" />
                    </div>
                  </div>
                </td>
                {Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-5 py-4"><div className="h-3.5 w-20 animate-pulse rounded-md bg-gray-100" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

async function StatsSection() {
  const stats = await getVerificationStats()
  return <VerificationStats stats={stats} />
}

async function TableSection({ searchParams }: { searchParams: SearchParams }) {
  const page   = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const status =
    searchParams.status === 'menunggu' || searchParams.status === 'diterima' || searchParams.status === 'ditolak'
      ? searchParams.status
      : 'semua'

  const result = await getPembayaranList({
    pelangganId: searchParams.pelanggan,
    search     : searchParams.search ?? '',
    status,
    sort       : searchParams.sort === 'terlama' ? 'terlama' : 'terbaru',
    page,
    pageSize   : 10,
  })

  return (
    <VerificationTableWithInvoice
      rows      ={result.data}
      total     ={result.total}
      page      ={result.page}
      pageSize  ={result.pageSize}
      totalPages={result.totalPages}
    />
  )
}

export default async function AdminVerifikasiPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CheckCircle size={20} className="text-brand-purple" />
          Verifikasi Pembayaran
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Semua pembayaran pelanggan ditampilkan di sini, diurutkan terbaru secara default.
        </p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />
      </Suspense>

      <VerificationFilters />

      <Suspense key={JSON.stringify(searchParams)} fallback={<TableSkeleton />}>
        <TableSection searchParams={searchParams} />
      </Suspense>
    </div>
  )
}