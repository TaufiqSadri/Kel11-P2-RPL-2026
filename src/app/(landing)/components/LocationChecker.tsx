'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, Search, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import type { AreaLayanan } from '@/types/database'

type Status = 'idle' | 'covered' | 'not-covered'

function normalize(str: string) {
  return str.toLowerCase().replace(/\s+/g, ' ').trim()
}

export default function LocationChecker({ areas }: { areas: AreaLayanan[] }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<{ kecamatan?: string; nagari?: string }>({})
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [checking, setChecking] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Build flat list for autocomplete: kecamatan names + nagari names
  const allLocations = [
    ...Array.from(new Set(areas.map((a) => `Kec. ${a.kecamatan}`))),
    ...areas.map((a) => a.nagari),
  ]

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    const q = normalize(query)
    const matches = allLocations
      .filter((loc) => normalize(loc).includes(q))
      .slice(0, 6)
    setSuggestions(matches)
    setShowSuggestions(matches.length > 0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSearch() {
    if (!query.trim()) return
    setChecking(true)
    setShowSuggestions(false)

    setTimeout(() => {
      const q = normalize(query)
      // Check against areas from Supabase
      const match = areas.find(
        (a) =>
          normalize(a.nagari).includes(q) ||
          q.includes(normalize(a.nagari)) ||
          normalize(a.kecamatan).includes(q) ||
          q.includes(normalize(a.kecamatan))
      )
      if (match) {
        setStatus('covered')
        setResult({ kecamatan: match.kecamatan, nagari: match.nagari })
      } else {
        setStatus('not-covered')
        setResult({})
      }
      setChecking(false)
    }, 500)
  }

  function handleSelect(loc: string) {
    const cleaned = loc.startsWith('Kec. ') ? loc.slice(5) : loc
    setQuery(cleaned)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  function handleReset() {
    setQuery('')
    setStatus('idle')
    setResult({})
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="mt-7 max-w-2xl rounded-xl border border-gray-200 bg-white p-4 shadow-[0_12px_28px_rgba(17,17,17,0.08)]">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-50">
          <MapPin className="h-4 w-4 text-purple-900" />
        </span>
        <div>
          <p className="text-sm font-extrabold text-black">Cek Jangkauan Area</p>
          <p className="text-[11px] text-gray-500">Kabupaten Padang Pariaman, Sumatera Barat</p>
        </div>
      </div>

      {/* Input + button */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            id="location-search"
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setStatus('idle') }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Ketik nama kecamatan atau nagari…"
            className="h-11 w-full rounded-lg border border-gray-300 pl-3 pr-9 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#68247B] focus:ring-2 focus:ring-[#68247B]/20"
            aria-label="Cari lokasi"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
          />
          {query && (
            <button
              type="button"
              onClick={handleReset}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Hapus pencarian"
            >
              <XCircle size={16} />
            </button>
          )}

          {/* Suggestions dropdown */}
          {showSuggestions && (
            <ul
              role="listbox"
              className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
            >
              {suggestions.map((loc) => (
                <li
                  key={loc}
                  role="option"
                  aria-selected={false}
                  onMouseDown={() => handleSelect(loc)}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm text-gray-700 transition hover:bg-purple-50 hover:text-[#68247B]"
                >
                  <MapPin size={13} className="shrink-0 text-gray-400" />
                  {loc}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={handleSearch}
          disabled={checking || !query.trim()}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#68247B] px-4 text-sm font-bold text-white transition hover:bg-purple-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {checking ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          {checking ? 'Mengecek…' : 'Cek'}
        </button>
      </div>

      {/* Result */}
      {status === 'covered' && (
        <div className="mt-3 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
          <div>
            <p className="text-sm font-bold text-green-800">
              Selamat! Area <span className="text-green-700">{result.nagari}</span> sudah terjangkau.
            </p>
            <p className="mt-0.5 text-xs text-green-600">
              Kecamatan {result.kecamatan} · Kab. Padang Pariaman — Anda bisa langsung daftar berlangganan.
            </p>
          </div>
        </div>
      )}

      {status === 'not-covered' && (
        <div className="mt-3 flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
          <div>
            <p className="text-sm font-bold text-orange-800">Area belum tersedia.</p>
            <p className="mt-0.5 text-xs text-orange-600">
              Lokasi &quot;{query}&quot; belum masuk jangkauan kami. Hubungi admin untuk informasi lebih lanjut.
            </p>
          </div>
        </div>
      )}

      {status === 'idle' && (
        <p className="mt-2 text-[11px] text-gray-400">
          Contoh:{' '}
          {areas.slice(0, 3).map((a, i) => (
            <span key={a.nagari}>
              <span className="font-medium text-gray-500">{a.nagari}</span>
              {i < 2 ? ', ' : ''}
            </span>
          ))}
        </p>
      )}
    </div>
  )
}
