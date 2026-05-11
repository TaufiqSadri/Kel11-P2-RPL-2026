'use client'

import { registerAction } from '@/app/(public)/register/actions'
import type { PaketInternet } from '@/types/database'
import { ChevronDown, Eye, EyeOff, Loader2, MapPin } from 'lucide-react'
import Link from 'next/link'
import { FormEvent, useEffect, useRef, useState } from 'react'

type Coords = { lat: number; lng: number }

type RegisterFormProps = {
  paketList: PaketInternet[]
}

// ── Bounding box Kabupaten Padang Pariaman ────────────────────────────────────
const BOUNDS = {
  south: -0.88,
  north: -0.28,  // sedikit lebih ketat agar tidak tembus ke Agam/Pariaman kota
  west:  99.88,
  east:  100.38,
}
const CENTER: [number, number] = [-0.5450, 100.1167]

function inBounds(lat: number, lng: number) {
  return (
    lat >= BOUNDS.south && lat <= BOUNDS.north &&
    lng >= BOUNDS.west  && lng <= BOUNDS.east
  )
}

function injectLeafletCss() {
  if (document.getElementById('leaflet-css')) return
  const link = document.createElement('link')
  link.id = 'leaflet-css'
  link.rel = 'stylesheet'
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
  document.head.appendChild(link)
}

export default function RegisterForm({ paketList }: RegisterFormProps) {
  const [showMap, setShowMap] = useState(false)
  const [coords, setCoords] = useState<Coords | null>(null)
  const [alamat, setAlamat] = useState('')
  const [outOfBounds, setOutOfBounds] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const mapRef    = useRef<HTMLDivElement>(null)
  const mapInstRef = useRef<import('leaflet').Map | null>(null)
  const markerRef  = useRef<import('leaflet').Marker | null>(null)

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'id', 'User-Agent': 'DistricNet/1.0' } },
      )
      const data = (await res.json()) as { display_name?: string }
      setAlamat(data.display_name ?? '')
    } catch {
      setAlamat('')
    }
  }

  function handleCoords(lat: number, lng: number) {
    if (!inBounds(lat, lng)) {
      setOutOfBounds(true)
      setCoords(null)
      return
    }
    setOutOfBounds(false)
    setCoords({ lat, lng })
    void reverseGeocode(lat, lng)
  }

  function useGps() {
    if (!navigator.geolocation) { setError('Peramban tidak mendukung GPS.'); return }
    setError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setShowMap(true)
        handleCoords(lat, lng)
        // Pan map to GPS location
        if (mapInstRef.current && markerRef.current) {
          mapInstRef.current.setView([lat, lng], 15)
          markerRef.current.setLatLng([lat, lng])
        }
      },
      () => setError('Tidak bisa mengambil lokasi GPS. Coba pilih di peta.'),
    )
  }

  // ── Leaflet init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showMap) {
      mapInstRef.current?.remove()
      mapInstRef.current = null
      markerRef.current = null
      return
    }
    if (!mapRef.current || mapInstRef.current) return

    injectLeafletCss()

    let cancelled = false

    void import('leaflet').then((L) => {
      if (cancelled || !mapRef.current) return

      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const initLat = coords?.lat ?? CENTER[0]
      const initLng = coords?.lng ?? CENTER[1]

      // Leaflet bounds object
      const maxBounds = L.latLngBounds(
        L.latLng(BOUNDS.south, BOUNDS.west),
        L.latLng(BOUNDS.north, BOUNDS.east),
      )

      // minZoom = 11 memastikan area tampilan TIDAK melebihi bounds Padang Pariaman
      // (container ~512px wide, bounds width 0.55° → zoom 11 visible 0.35° < 0.55° ✓)
      const map = L.map(mapRef.current, {
        maxBounds,
        maxBoundsViscosity: 1.0,
        minZoom: 11,
        maxZoom: 18,
      }).setView([initLat, initLng], 13)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map)


      const marker = L.marker([initLat, initLng], { draggable: true }).addTo(map)
      marker.on('dragend', () => {
        const ll = marker.getLatLng()
        handleCoords(ll.lat, ll.lng)
        if (!inBounds(ll.lat, ll.lng)) {
          marker.setLatLng(coords ? [coords.lat, coords.lng] : CENTER)
        }
      })

      map.on('click', (e: import('leaflet').LeafletMouseEvent) => {
        const { lat, lng } = e.latlng
        if (!inBounds(lat, lng)) { setOutOfBounds(true); return }
        marker.setLatLng(e.latlng)
        handleCoords(lat, lng)
      })

      // ── Failsafe: clamp center setelah setiap gerakan ──
      // maxBounds + viscosity kadang tidak cukup untuk sisi utara;
      // ini memastikan center map selalu dalam bounds Padang Pariaman.
      map.on('moveend', () => {
        const c = map.getCenter()
        const clampedLat = Math.min(BOUNDS.north, Math.max(BOUNDS.south, c.lat))
        const clampedLng = Math.min(BOUNDS.east,  Math.max(BOUNDS.west,  c.lng))
        if (clampedLat !== c.lat || clampedLng !== c.lng) {
          map.panTo([clampedLat, clampedLng], { animate: false })
        }
      })

      mapInstRef.current = map
      markerRef.current  = marker
    })

    return () => {
      cancelled = true
      mapInstRef.current?.remove()
      mapInstRef.current = null
      markerRef.current  = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMap])

  useEffect(() => {
    if (!coords || !markerRef.current || !mapInstRef.current) return
    markerRef.current.setLatLng([coords.lat, coords.lng])
    mapInstRef.current.setView([coords.lat, coords.lng], 15)
  }, [coords])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) { setError('Password tidak cocok.'); return }
    if (password.length < 8) { setError('Password minimal 8 karakter.'); return }
    if (!coords) { setError('Pilih lokasi pemasangan di dalam wilayah Kabupaten Padang Pariaman.'); return }

    setSubmitting(true)
    const fd = new FormData(e.currentTarget)
    fd.set('latitude',  String(coords.lat))
    fd.set('longitude', String(coords.lng))
    const result = await registerAction(fd)
    if (result?.error) { setError(result.error); setSubmitting(false) }
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-brand-pink focus:outline-none focus:ring-2 focus:ring-brand-pink/30'

  return (
    <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-card">
      <div className="mb-6 text-center">
        <h1 className="font-display text-4xl font-bold text-gray-900">Pendaftaran Baru</h1>
        <p className="mt-1 text-sm text-gray-500">Lengkapi data diri untuk memulai layanan Distric Net.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nama */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Nama Lengkap</label>
          <input name="nama_lengkap" required className={inputCls} />
        </div>

        {/* Email + HP */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input name="email" type="email" required className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">No. HP</label>
            <input name="no_hp" type="tel" required className={inputCls} />
          </div>
        </div>

        {/* Password */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input name="password" type={showPassword ? 'text' : 'password'} required
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 karakter" className={inputCls + ' pr-11'} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Konfirmasi Password</label>
            <div className="relative">
              <input name="confirm_password" type={showConfirmPassword ? 'text' : 'password'} required
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password" className={inputCls + ' pr-11'} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Map section */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Lokasi Pemasangan</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={useGps}
              className="inline-flex items-center gap-1 rounded-xl border border-brand-purple px-3 py-2 text-sm font-medium text-brand-purple transition hover:bg-brand-purple/5">
              <MapPin size={14} /> Gunakan GPS
            </button>
            <button type="button" onClick={() => { setError(''); setOutOfBounds(false); setShowMap((v) => !v) }}
              className="rounded-xl bg-brand-purple px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-purple/90">
              {showMap ? 'Sembunyikan Peta' : 'Pilih di Peta'}
            </button>
          </div>
        </div>

        {showMap && (
          <div className="space-y-1.5">
            <div ref={mapRef} className="h-[240px] w-full overflow-hidden rounded-xl border border-gray-200" />
            {outOfBounds && (
              <p className="text-xs text-red-600">
                ⚠️ Lokasi di luar wilayah Kabupaten Padang Pariaman. Pilih titik yang benar.
              </p>
            )}
            {!outOfBounds && coords && (
              <p className="text-xs text-green-700">
                ✓ Lokasi dipilih: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </p>
            )}
          </div>
        )}

        {/* Alamat */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Alamat Pemasangan</label>
          <textarea name="alamat_pemasangan" required rows={3}
            value={alamat} onChange={(ev) => setAlamat(ev.target.value)}
            className={inputCls} />
        </div>

        {/* Paket */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Paket Internet</label>
          <div className="relative">
            <select name="paket_id" required defaultValue=""
              className="h-12 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-10 text-sm transition focus:border-brand-pink focus:outline-none focus:ring-2 focus:ring-brand-pink/30">
              <option value="" disabled>Pilih Paket</option>
              {paketList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama_paket} — {p.kecepatan_mbps} Mbps
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Info biaya instalasi */}
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
          <p className="text-sm font-bold text-yellow-800">💡 Informasi Biaya</p>
          <ul className="mt-1.5 space-y-1 text-xs text-yellow-700">
            <li>• <span className="font-semibold">Tagihan pertama:</span> Rp 600.000 (biaya instalasi perangkat)</li>
            <li>• <span className="font-semibold">Bulan pertama:</span> GRATIS — tidak ada tagihan bulanan</li>
            <li>• <span className="font-semibold">Bulan berikutnya:</span> sesuai paket yang Anda pilih</li>
          </ul>
        </div>

        {/* Syarat */}
        <label className="flex items-start gap-2 text-xs text-gray-500">
          <input type="checkbox" required className="mt-0.5" />
          Saya setuju dengan syarat &amp; ketentuan Distric Net.
        </label>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button type="submit" disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-800 py-3 font-display font-semibold text-white transition hover:bg-purple-950 disabled:opacity-60">
          {submitting && <Loader2 size={16} className="animate-spin" />}
          Daftar Sekarang
        </button>

        <p className="text-center text-sm text-gray-500">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold text-brand-purple hover:underline">Masuk</Link>
        </p>
      </form>
    </div>
  )
}