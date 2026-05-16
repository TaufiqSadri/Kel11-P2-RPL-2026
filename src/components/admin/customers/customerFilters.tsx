'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'

interface Paket {
      id: string
      nama_paket: string
      kecepatan_mbps: number
}

interface Props {
      paketList: Paket[]
}

const STATUS_OPTIONS = [
      { value: 'semua', label: 'Semua Status' },
      { value: 'aktif', label: 'Aktif' },
      { value: 'ditangguhkan', label: 'Ditangguhkan' },
      { value: 'proses_instalasi', label: 'Proses Instalasi' },
      { value: 'pending', label: 'Pending' },
      { value: 'nonaktif', label: 'Nonaktif' },
]

const SORT_OPTIONS = [
      { value: 'terbaru', label: 'Terbaru' },
      { value: 'terlama', label: 'Terlama' },
]

export default function CustomerFilters({ paketList }: Props) {
      const router = useRouter()
      const pathname = usePathname()
      const searchParams = useSearchParams()
      const [isPending, startTransition] = useTransition()

      const [search, setSearch] = useState(searchParams.get('search') ?? '')
      const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

      const createQueryString = useCallback(
            (updates: Record<string, string | null>) => {
                  const params = new URLSearchParams(searchParams.toString())
                  Object.entries(updates).forEach(([key, value]) => {
                  if (value === null || value === '' || value === 'semua') {
                  params.delete(key)
                  } else {
                  params.set(key, value)
                  }
                  })
                  // Reset to page 1 on filter change
                  params.delete('page')
                  return params.toString()
            },
            [searchParams],
      )

      // Debounced search
      useEffect(() => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
            debounceRef.current = setTimeout(() => {
                  const qs = createQueryString({ search: search || null })
                  startTransition(() => {
                  router.push(`${pathname}?${qs}`)
                  })
            }, 350)
            return () => {
                  if (debounceRef.current) clearTimeout(debounceRef.current)
            }
      }, [search, createQueryString, pathname, router])

      function handleSelect(key: string, value: string) {
      const qs = createQueryString({ [key]: value === 'semua' ? null : value })

      startTransition(() => {
            router.push(`${pathname}?${qs}`)
      })
      }

      const hasActiveFilters =
            searchParams.get('search') ||
            searchParams.get('status') ||
            searchParams.get('paket_id') ||
            searchParams.get('sort')

      function clearAll() {
            setSearch('')
            startTransition(() => {
                  router.push(pathname)
            })
      }

      return (
            <div className="rounded-2xl bg-white p-4 shadow-card">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                              <Search
                                    size={15}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              />
                              <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari nama, email, atau no HP..."
                                    className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm transition focus:border-brand-purple focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                              />
                              {search && (
                                    <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                    <X size={14} />
                                    </button>
                              )}
                        </div>

                        {/* Status Filter */}
                        <select
                        value={searchParams.get('status') ?? 'semua'}
                        onChange={(e) => handleSelect('status', e.target.value)}
                        className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-700 transition focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                        >
                        {STATUS_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                              {o.label}
                              </option>
                        ))}
                        </select>

                        {/* Paket Filter */}
                        <select
                        value={searchParams.get('paket_id') ?? 'semua'}
                        onChange={(e) => handleSelect('paket_id', e.target.value)}
                        className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-700 transition focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                        >
                        <option value="semua">Semua Paket</option>
                        {paketList.map((p) => (
                              <option key={p.id} value={p.id}>
                              {p.nama_paket} — {p.kecepatan_mbps} Mbps
                              </option>
                        ))}
                        </select>

                        {/* Sort */}
                        <select
                        value={searchParams.get('sort') ?? 'terbaru'}
                        onChange={(e) => handleSelect('sort', e.target.value)}
                        className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-700 transition focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                        >
                        {SORT_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                              {o.label}
                              </option>
                        ))}
                        </select>

                        {/* Clear filters */}
                        {hasActiveFilters ? (
                        <button
                              type="button"
                              onClick={clearAll}
                              className="flex h-10 items-center gap-1.5 rounded-xl border border-red-200 px-3 text-sm font-medium text-red-500 transition hover:bg-red-50"
                        >
                              <X size={14} />
                              Reset
                        </button>
                        ) : null}

                        {/* Pending indicator */}
                        {isPending ? (
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                              <SlidersHorizontal size={13} className="animate-pulse" />
                              Memuat...
                        </div>
                        ) : null}
                  </div>
            </div>
      )
}
