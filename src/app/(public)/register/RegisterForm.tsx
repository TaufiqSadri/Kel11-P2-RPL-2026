'use client'

import 'leaflet/dist/leaflet.css'

import { registerAction } from '@/app/(public)/register/actions'
import type { PaketInternet } from '@/types/database'
import { ChevronDown, Loader2, MapPin } from 'lucide-react'
import Link from 'next/link'
import { FormEvent, useEffect, useRef, useState } from 'react'

type Coords = { lat: number; lng: number }

type RegisterFormProps = {
  paketList: PaketInternet[]
}

export default function RegisterForm({ paketList }: RegisterFormProps) {
  const [showMap, setShowMap] = useState(false)
  const [coords, setCoords] = useState<Coords | null>(null)
  const [alamat, setAlamat] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null)
  const markerRef = useRef<import('leaflet').Marker | null>(null)

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        {
          headers: {
            'Accept-Language': 'id',
            'User-Agent': 'DistricNet/1.0 (https://distric-net.local)',
          },
        },
      )
      const data = (await res.json()) as { display_name?: string }
      setAlamat(data.display_name ?? '')
    } catch {
      setAlamat('')
    }
  }

  async function handleCoords(lat: number, lng: number) {
    setCoords({ lat, lng })
    await reverseGeocode(lat, lng)
  }

  function useGps() {
    if (!navigator.geolocation) {
      setError('Peramban tidak mendukung GPS.')
      return
    }
    setError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setShowMap(true)
        void handleCoords(lat, lng)
      },
      () => setError('Tidak bisa mengambil lokasi GPS. Coba pilih di peta.'),
    )
  }

  useEffect(() => {
    if (!showMap) {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
      markerRef.current = null
      return
    }

    if (!mapRef.current || mapInstanceRef.current) return

    let cancelled = false

    void import('leaflet').then((L) => {
      if (cancelled || !mapRef.current) return

      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const defaultLat = coords?.lat ?? -0.9493
      const defaultLng = coords?.lng ?? 100.4172

      const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 14)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map)

      const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map)
      marker.on('dragend', () => {
        const ll = marker.getLatLng()
        void handleCoords(ll.lat, ll.lng)
      })
      map.on('click', (e: import('leaflet').LeafletMouseEvent) => {
        marker.setLatLng(e.latlng)
        void handleCoords(e.latlng.lat, e.latlng.lng)
      })

      mapInstanceRef.current = map
      markerRef.current = marker
    })

    return () => {
      cancelled = true
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMap])

  useEffect(() => {
    if (!coords || !markerRef.current || !mapInstanceRef.current) return
    markerRef.current.setLatLng([coords.lat, coords.lng])
    mapInstanceRef.current.setView([coords.lat, coords.lng], 15)
  }, [coords])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    if (coords) {
      fd.set('latitude', String(coords.lat))
      fd.set('longitude', String(coords.lng))
    }
    const result = await registerAction(fd)
    if (result?.error) {
      setError(result.error)
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-card">
      <div className="mb-6 text-center">
        <h1 className="font-display text-4xl font-bold text-gray-900">Pendaftaran Baru</h1>
        <p className="mt-1 text-sm text-gray-500">Lengkapi data diri Anda untuk memulai layanan Distric Net.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Nama Lengkap</label>
          <input
            name="nama_lengkap"
            required
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-brand-pink focus:outline-none focus:ring-2 focus:ring-brand-pink/30"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-brand-pink focus:outline-none focus:ring-2 focus:ring-brand-pink/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">No. HP</label>
            <input
              name="no_hp"
              type="tel"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-brand-pink focus:outline-none focus:ring-2 focus:ring-brand-pink/30"
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Lokasi pemasangan</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={useGps}
              className="inline-flex items-center gap-1 rounded-xl border border-brand-purple px-3 py-2 text-sm font-medium text-brand-purple transition hover:bg-brand-purple/5"
            >
              <MapPin size={14} />
              Gunakan GPS
            </button>
            <button
              type="button"
              onClick={() => {
                setError('')
                setShowMap((v) => !v)
              }}
              className="rounded-xl bg-brand-purple px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-purple/90"
            >
              {showMap ? 'Sembunyikan peta' : 'Pilih di Map'}
            </button>
          </div>
        </div>

        {showMap ? (
          <div ref={mapRef} className="h-[220px] w-full overflow-hidden rounded-xl border border-gray-200"
          />
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Alamat Pemasangan</label>
          <textarea 
          name="alamat_pemasangan" 
          required 
          rows={3} 
          value={alamat} 
          onChange={(ev) => setAlamat(ev.target.value)} 
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-brand-pink focus:outline-none focus:ring-2 focus:ring-brand-pink/30"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Paket Internet</label>
          <div className="relative">
            <select 
            name="paket_id" 
            required defaultValue="" 
            className="h-12 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-10 text-sm transition focus:border-brand-pink focus:outline-none focus:ring-2 focus:ring-brand-pink/30"
            >
              <option value="" disabled>
                Pilih Paket
              </option>
              {paketList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama_paket} — {p.kecepatan_mbps} Mbps
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <label className="flex items-start gap-2 text-xs text-gray-500">
          <input type="checkbox" required className="mt-0.5" />
          Saya setuju dengan syarat & ketentuan Distric Net.
        </label>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button 
        type="submit" 
        disabled={submitting} 
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-800 py-3 font-display font-semibold text-white transition hover:bg-purple-950 disabled:opacity-60"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          Daftar Sekarang
        </button>

        <p className="text-center text-sm text-gray-500">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold text-brand-purple hover:underline">
            Masuk
          </Link>
        </p>
      </form>
    </div>
  )
}
