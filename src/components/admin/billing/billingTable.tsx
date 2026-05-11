'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import type {
  TagihanInstalasiWithRelations,
  TagihanWithRelations,
  TagihanStatus,
} from '@/lib/data/tagihan'
import BillingActions from './billingActions'
import BillingActionsInstalasi from './billingActionsInstalasi'

type BillingVariant = 'bulanan' | 'instalasi'

interface Props {
  variant?: BillingVariant
  rows: TagihanWithRelations[] | TagihanInstalasiWithRelations[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const STATUS_CONFIG: Record<
  TagihanStatus,
  { label: string; cls: string; dot: string }
> = {
  belum_bayar: {
    label: 'Belum Dibayar',
    cls: 'bg-red-100 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
  menunggu_verifikasi: {
    label: 'Menunggu Verifikasi',
    cls: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    dot: 'bg-yellow-500',
  },
  lunas: {
    label: 'Lunas',
    cls: 'bg-green-100 text-green-700 border-green-200',
    dot: 'bg-green-500',
  },
  overdue: {
    label: 'Overdue',
    cls: 'bg-gray-200 text-gray-700 border-gray-300',
    dot: 'bg-gray-500',
  },
}

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']

function StatusBadge({ status }: { status: TagihanStatus }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    cls: 'bg-gray-100 text-gray-600 border-gray-200',
    dot: 'bg-gray-400',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
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

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

export default function BillingTable({
  variant = 'bulanan',
  rows,
  total,
  page,
  pageSize,
  totalPages,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [paidIds, setPaidIds] = useState<Set<string>>(new Set())
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const isInstalasi = variant === 'instalasi'
  const entityLabel = isInstalasi ? 'tagihan instalasi' : 'tagihan'

  function handleMarkPaid(id: string) {
    setPaidIds((prev) => new Set([...Array.from(prev), id]))
  }

  function handleDelete(id: string) {
    setDeletedIds((prev) => new Set([...Array.from(prev), id]))
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`${pathname}?${params.toString()}`)
  }

  const visibleRows = rows.filter((r) => !deletedIds.has(r.id))

  // Tidak ada data sama sekali di server
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 shadow-card">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <span className="text-3xl">🧾</span>
        </div>
        <p className="font-display font-semibold text-gray-600">Belum ada data {entityLabel}</p>
        <p className="mt-1 text-sm text-gray-400">
          {isInstalasi
            ? 'Tagihan instalasi muncul setelah aktivasi pelanggan.'
            : 'Tagihan yang dibuat akan muncul di sini.'}
        </p>
      </div>
    )
  }

  // Halaman out-of-bounds: server return kosong tapi ada data di halaman lain
  if (rows.length === 0 && total > 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 shadow-card">
        <p className="font-semibold text-gray-600">Halaman ini tidak memiliki data</p>
        <button
          type="button"
          onClick={() => goToPage(1)}
          className="mt-3 rounded-lg bg-brand-purple px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-900"
        >
          Kembali ke Halaman 1
        </button>
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
              {['Pelanggan', 'Periode', 'Nominal', 'Jatuh Tempo', 'Status', 'Bukti', 'Aksi'].map(
                (h) => (
                  <th
                    key={h}
                    className="px-5 pb-3 pt-5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const status: TagihanStatus = paidIds.has(row.id) ? 'lunas' : row.status_tagihan
              const buktiUrl = row.pembayaran?.[0]?.bukti_pembayaran ?? null

              if (isInstalasi) {
                const t = row as TagihanInstalasiWithRelations
                return (
                  <tr
                    key={t.id}
                    className="border-b border-gray-50 transition hover:bg-gray-50/50 last:border-0"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={t.pelanggan?.nama_lengkap ?? '?'} />
                        <div>
                          <p className="font-medium text-gray-900">{t.pelanggan?.nama_lengkap ?? '—'}</p>
                          <p className="text-xs text-gray-400">{t.pelanggan?.email ?? ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-medium text-gray-700">Biaya instalasi</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-gray-800">{fmt(t.jumlah_tagihan)}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{fmtDate(t.jatuh_tempo)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-5 py-4">
                      {buktiUrl ? (
                        <a
                          href={buktiUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-purple/30 px-2.5 py-1 text-xs font-semibold text-brand-purple transition hover:bg-brand-purple/5"
                        >
                          <ImageIcon size={11} />
                          Lihat
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <BillingActionsInstalasi
                        row={{ ...t, status_tagihan: status }}
                        onMarkPaid={handleMarkPaid}
                        onDelete={handleDelete}
                      />
                    </td>
                  </tr>
                )
              }

              const t = row as TagihanWithRelations
              return (
                <tr
                  key={t.id}
                  className="border-b border-gray-50 transition hover:bg-gray-50/50 last:border-0"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={t.pelanggan?.nama_lengkap ?? '?'} />
                      <div>
                        <p className="font-medium text-gray-900">{t.pelanggan?.nama_lengkap ?? '—'}</p>
                        <p className="text-xs text-gray-400">{t.pelanggan?.email ?? ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-medium text-gray-700">
                      {BULAN[t.bulan - 1]} {t.tahun}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-semibold text-gray-800">{fmt(t.jumlah_tagihan)}</span>
                  </td>
                  <td className="px-5 py-4 text-gray-500">{fmtDate(t.jatuh_tempo)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={status} />
                  </td>
                  <td className="px-5 py-4">
                    {buktiUrl ? (
                      <a
                        href={buktiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-purple/30 px-2.5 py-1 text-xs font-semibold text-brand-purple transition hover:bg-brand-purple/5"
                      >
                        <ImageIcon size={11} />
                        Lihat
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <BillingActions
                      tagihan={{ ...t, status_tagihan: status }}
                      onMarkPaid={handleMarkPaid}
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
        {visibleRows.map((row) => {
          const status: TagihanStatus = paidIds.has(row.id) ? 'lunas' : row.status_tagihan
          if (isInstalasi) {
            const t = row as TagihanInstalasiWithRelations
            return (
              <div key={t.id} className="flex items-start gap-3 px-4 py-4">
                <Avatar name={t.pelanggan?.nama_lengkap ?? '?'} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="truncate font-medium text-gray-900">{t.pelanggan?.nama_lengkap ?? '—'}</p>
                      <p className="text-xs text-gray-500">Biaya instalasi · {fmt(t.jumlah_tagihan)}</p>
                      <p className="text-xs text-gray-400">Jatuh tempo: {fmtDate(t.jatuh_tempo)}</p>
                    </div>
                    <BillingActionsInstalasi
                      row={{ ...t, status_tagihan: status }}
                      onMarkPaid={handleMarkPaid}
                      onDelete={handleDelete}
                    />
                  </div>
                  <div className="mt-2">
                    <StatusBadge status={status} />
                  </div>
                </div>
              </div>
            )
          }
          const t = row as TagihanWithRelations
          return (
            <div key={t.id} className="flex items-start gap-3 px-4 py-4">
              <Avatar name={t.pelanggan?.nama_lengkap ?? '?'} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="truncate font-medium text-gray-900">{t.pelanggan?.nama_lengkap ?? '—'}</p>
                    <p className="text-xs text-gray-500">
                      {BULAN[t.bulan - 1]} {t.tahun} · {fmt(t.jumlah_tagihan)}
                    </p>
                    <p className="text-xs text-gray-400">Jatuh tempo: {fmtDate(t.jatuh_tempo)}</p>
                  </div>
                  <BillingActions
                    tagihan={{ ...t, status_tagihan: status }}
                    onMarkPaid={handleMarkPaid}
                    onDelete={handleDelete}
                  />
                </div>
                <div className="mt-2">
                  <StatusBadge status={status} />
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
            Menampilkan {visibleRows.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize - deletedIds.size, total)} dari {total}{' '}
            {entityLabel}
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
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | '...')[]>((acc, p, i, arr) => {
                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-1 text-xs text-gray-400">
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
            Total {total} {entityLabel}
          </p>
        </div>
      )}
    </div>
  )
}
