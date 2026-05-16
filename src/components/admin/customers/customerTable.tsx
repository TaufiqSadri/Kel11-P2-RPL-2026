'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { PelangganWithPaket, StatusLangganan } from '@/types/database'
import CustomerActions from './customerActions'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  rows: PelangganWithPaket[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function StatusBadge({ status }: { status: StatusLangganan }) {
  const map: Record<StatusLangganan, string> = {
    aktif: 'bg-green-100 text-green-700 border-green-200',
    ditangguhkan: 'bg-orange-100 text-orange-700 border-orange-200',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    nonaktif: 'bg-red-100 text-red-500 border-red-200',
  }
  const label: Record<StatusLangganan, string> = {
    aktif: 'Aktif',
    ditangguhkan: 'Ditangguhkan',
    pending: 'Pending',
    nonaktif: 'Nonaktif',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${map[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === 'aktif'
            ? 'bg-green-500'
            : status === 'ditangguhkan'
            ? 'bg-orange-500'
            : status === 'pending'
            ? 'bg-yellow-500'
            : 'bg-red-400'
        }`}
      />
      {label[status]}
    </span>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Deterministic color from name
  const colors = [
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
    'bg-blue-100 text-blue-700',
    'bg-teal-100 text-teal-700',
    'bg-orange-100 text-orange-700',
  ]
  const idx = name.charCodeAt(0) % colors.length

  return (
    <div
      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-display text-sm font-bold ${colors[idx]}`}
    >
      {initials}
    </div>
  )
}

export default function CustomerTable({
  rows,
  total,
  page,
  pageSize,
  totalPages,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Optimistic status updates
  const [optimisticStatuses, setOptimisticStatuses] = useState<
    Record<string, StatusLangganan>
  >({})
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())

  function handleStatusChange(id: string, newStatus: StatusLangganan) {
    setOptimisticStatuses((prev) => ({ ...prev, [id]: newStatus }))
  }

  function handleDelete(id: string) {
    setDeletedIds((prev) => new Set([...Array.from(prev), id]))
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`${pathname}?${params.toString()}`)
  }

  const fmt = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const visibleRows = rows.filter((r) => !deletedIds.has(r.id))

  if (visibleRows.length === 0 && total === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 shadow-card">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <span className="text-3xl">👤</span>
        </div>
        <p className="font-display font-semibold text-gray-600">Belum ada pelanggan</p>
        <p className="mt-1 text-sm text-gray-400">
          Pelanggan yang mendaftar akan muncul di sini.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white shadow-card">
      {/* Desktop table */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 pb-3 pt-5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                Pelanggan
              </th>
              <th className="px-4 pb-3 pt-5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                Kontak
              </th>
              <th className="px-4 pb-3 pt-5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                Paket
              </th>
              <th className="px-4 pb-3 pt-5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                Status
              </th>
              <th className="px-4 pb-3 pt-5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                Bergabung
              </th>
              <th className="px-6 pb-3 pt-5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((p) => {
              const status =
                (optimisticStatuses[p.id] as StatusLangganan | undefined) ??
                p.status_langganan
              return (
                <tr
                  key={p.id}
                  className="border-b border-gray-50 transition hover:bg-gray-50/50 last:border-0"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.nama_lengkap} />
                      <div>
                        <p className="font-medium text-gray-900">{p.nama_lengkap}</p>
                        <p className="text-xs text-gray-400 font-mono">{p.id.slice(0, 8)}…</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-gray-700">{p.email}</p>
                    <p className="text-xs text-gray-400">{p.no_hp}</p>
                  </td>
                  <td className="px-4 py-4">
                    {p.paket_internet ? (
                      <div>
                        <p className="font-medium text-gray-700">
                          {p.paket_internet.nama_paket}
                        </p>
                        <p className="text-xs text-brand-purple font-semibold">
                          {p.paket_internet.kecepatan_mbps} Mbps
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={status} />
                  </td>
                  <td className="px-4 py-4 text-gray-500">
                    {fmt.format(new Date(p.tanggal_bergabung))}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <CustomerActions
                      pelanggan={{ ...p, status_langganan: status }}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-gray-100 lg:hidden">
        {visibleRows.map((p) => {
          const status =
            (optimisticStatuses[p.id] as StatusLangganan | undefined) ??
            p.status_langganan
          return (
            <div key={p.id} className="flex items-start gap-3 px-4 py-4">
              <Avatar name={p.nama_lengkap} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900 truncate">{p.nama_lengkap}</p>
                    <p className="text-xs text-gray-400 truncate">{p.email}</p>
                    <p className="text-xs text-gray-400">{p.no_hp}</p>
                  </div>
                  <CustomerActions
                    pelanggan={{ ...p, status_langganan: status }}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={status} />
                  {p.paket_internet ? (
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-brand-purple">
                      {p.paket_internet.kecepatan_mbps} Mbps
                    </span>
                  ) : null}
                  <span className="text-xs text-gray-400">
                    {fmt.format(new Date(p.tanggal_bergabung))}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <p className="text-xs text-gray-500">
            Menampilkan {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, total)} dari {total} pelanggan
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - page) <= 1,
              )
              .reduce<(number | '...')[]>((acc, p, i, arr) => {
                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) {
                  acc.push('...')
                }
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-1 text-gray-400 text-xs">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => goToPage(p as number)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition ${
                      p === page
                        ? 'bg-brand-purple text-white'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}

            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-gray-100 px-6 py-3">
          <p className="text-xs text-gray-400">
            Total {total} pelanggan
          </p>
        </div>
      )}
    </div>
  )
}
