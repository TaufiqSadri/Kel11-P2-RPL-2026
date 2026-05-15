import { Suspense } from 'react'
import { deleteKomplainAction, respondKomplainAction } from '@/app/admin/actions'
import { getAllKomplain, getKomplainStats } from '@/lib/data/komplain'
import ConfirmActionForm from '@/components/ConfirmActionForm'
import { MessagesSquare } from 'lucide-react'

interface SearchParams {
  pelanggan?: string
  search?: string
  status?: string
  sort?: string
  page?: string
  success?: string
  error?: string
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white p-5 shadow-card">
          <div className="mb-3 h-3 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-8 w-14 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  )
}

async function StatsSection() {
  const stats = await getKomplainStats()
  const cards = [
    { label: 'Total Komplain', value: stats.total, color: 'text-gray-900' },
    { label: 'Menunggu', value: stats.menunggu, color: 'text-yellow-600' },
    { label: 'Selesai', value: stats.selesai, color: 'text-green-600' },
    { label: 'Belum Direspons', value: stats.belumDirespons, color: 'text-red-600' },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl bg-white p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{card.label}</p>
          <p className={`mt-3 font-display text-2xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  )
}

async function TableSection({ searchParams }: { searchParams: SearchParams }) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const status =
    searchParams.status === 'menunggu' || searchParams.status === 'selesai'
      ? searchParams.status
      : 'semua'
  const result = await getAllKomplain({
    pelangganId: searchParams.pelanggan,
    search: searchParams.search ?? '',
    status,
    sort: searchParams.sort === 'terlama' ? 'terlama' : 'terbaru',
    page,
    pageSize: 10,
  })

  return (
    <div className="rounded-2xl bg-white shadow-card">
      <div className="border-b border-gray-100 px-6 py-5">
        <h2 className="font-display text-lg font-semibold text-gray-900">Daftar Komplain</h2>
      </div>
      {result.data.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-gray-400">Belum ada komplain untuk ditampilkan.</div>
      ) : (
        <div className="space-y-4 p-4 md:p-6">
          {result.data.map((item) => {
            const action = respondKomplainAction.bind(null, item.id)
            const deleteAction = deleteKomplainAction.bind(null, item.id)
            return (
              <div key={item.id} className="rounded-2xl border border-gray-100 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{item.pelanggan?.nama_lengkap ?? 'Pelanggan tidak diketahui'}</p>
                    <p className="text-xs text-gray-400">
                      {item.pelanggan?.email ?? '-'} {item.pelanggan?.no_hp ? `· ${item.pelanggan.no_hp}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {item.status ? 'Selesai' : 'Menunggu'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {item.tanggal ? new Date(item.tanggal).toLocaleString('id-ID') : '-'}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 px-4 py-4 text-sm leading-6 text-gray-700">
                  {item.isi_komplain}
                </div>

                <form action={action} className="mt-4 space-y-3">
                  <textarea
                    name="respon_admin"
                    defaultValue={item.respon_admin ?? ''}
                    rows={3}
                    placeholder="Tulis respons admin..."
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                  />

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        name="selesai"
                        value="true"
                        defaultChecked={!!item.status}
                        className="h-4 w-4 rounded border-gray-300 text-brand-purple focus:ring-brand-purple"
                      />
                      Tandai selesai
                    </label>

                    <button
                      type="submit"
                      className="rounded-xl bg-brand-pink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-700"
                    >
                      Simpan Respons
                    </button>

                  </div>
                </form>
                <div className="mt-3">
                  <ConfirmActionForm
                    action={deleteAction}
                    itemName={`${item.pelanggan?.nama_lengkap ?? 'Pelanggan tidak diketahui'} - ${item.isi_komplain.slice(0, 60)}`}
                    title="Konfirmasi Hapus Komplain"
                    message="Komplain ini akan dihapus permanen."
                    confirmLabel="Ya, Hapus"
                  >
                    <button
                      type="submit"
                      className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Hapus Komplain
                    </button>
                  </ConfirmActionForm>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default async function AdminKomplainPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessagesSquare size={20} className='text-brand-purple' />
          Kelola Komplain
        </h1>
        <p className="mt-1 text-sm text-gray-500">Pantau keluhan pelanggan dan berikan respons langsung dari panel admin.</p>
      </div>

      {searchParams.success ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {searchParams.success}
        </div>
      ) : null}

      {searchParams.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </div>
      ) : null}

      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />
      </Suspense>

      <Suspense fallback={<div className="rounded-2xl bg-white p-8 shadow-card text-sm text-gray-400">Memuat komplain...</div>}>
        <TableSection searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
