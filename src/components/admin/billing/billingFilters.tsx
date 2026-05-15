'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'semua', label: 'Semua Status' },
  { value: 'belum_bayar', label: 'Belum Dibayar' },
  { value: 'menunggu_verifikasi', label: 'Menunggu Verifikasi' },
  { value: 'lunas', label: 'Sudah Dibayar' },
  { value: 'overdue', label: 'Overdue' },
]

const SORT_OPTIONS = [
  { value: 'terbaru', label: 'Terbaru' },
  { value: 'terlama', label: 'Terlama' },
]

const BULAN_OPTIONS = [
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
const TAHUN_OPTIONS = [
  { value: 'semua', label: 'Semua Tahun' },
  ...Array.from({ length: 4 }, (_, i) => {
    const y = currentYear - i
    return { value: String(y), label: String(y) }
  }),
]

export default function BillingFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Gunakan ref agar selalu fresh tapi tidak trigger useEffect saat page berubah
  const searchParamsRef = useRef(searchParams)
  searchParamsRef.current = searchParams

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParamsRef.current.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || value === 'semua') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })
      params.delete('page')
      return params.toString()
    },
    [], // sengaja kosong — baca searchParams lewat ref, bukan closure
  )

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
  }, [search, pathname, router]) // createQueryString SENGAJA dihapus dari deps

  function handleSelect(key: string, value: string) {
    const qs = createQueryString({ [key]: value === 'semua' ? null : value })
    startTransition(() => {
      router.push(`${pathname}?${qs}`)
    })
  }

  const jenis = searchParams.get('jenis') === 'instalasi' ? 'instalasi' : 'bulanan'

  const hasActiveFilters =
    searchParams.get('search') ||
    searchParams.get('status') ||
    searchParams.get('bulan') ||
    searchParams.get('tahun') ||
    searchParams.get('sort')

  function clearAll() {
    setSearch('')
    const query = jenis === 'instalasi' ? '?jenis=instalasi' : ''
    startTransition(() => {
      router.push(`${pathname}${query}`)
    })
  }

  const selectCls =
    'h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-700 transition focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20'

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama pelanggan..."
            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm transition focus:border-brand-purple focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        {/* Bulan / tahun hanya relevan untuk tagihan bulanan */}
        {jenis === 'bulanan' ? (
          <>
            <select
              value={searchParams.get('bulan') ?? 'semua'}
              onChange={(e) => handleSelect('bulan', e.target.value)}
              className={selectCls}
            >
              {BULAN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              value={searchParams.get('tahun') ?? 'semua'}
              onChange={(e) => handleSelect('tahun', e.target.value)}
              className={selectCls}
            >
              {TAHUN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </>
        ) : null}

        {/* Status Filter */}
        <select
          value={searchParams.get('status') ?? 'semua'}
          onChange={(e) => handleSelect('status', e.target.value)}
          className={selectCls}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={searchParams.get('sort') ?? 'terbaru'}
          onChange={(e) => handleSelect('sort', e.target.value)}
          className={selectCls}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Clear */}
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
