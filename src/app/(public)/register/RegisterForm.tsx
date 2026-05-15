'use client'

import { registerAction } from '@/app/(public)/register/actions'
import type { AreaLayanan, PaketInternet } from '@/types/database'
import { CheckCircle2, Eye, EyeOff, Loader2, MapPin, ShoppingCart, X } from 'lucide-react'
import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'

type Coords = { lat: number; lng: number }

type RegisterFormProps = {
  paketList: PaketInternet[]
  areaList: AreaLayanan[]
}

type ReviewData = {
  namaLengkap: string
  email: string
  noHp: string
  kecamatan: string
  nagari: string
  detailAlamat: string
}

const BIAYA_INSTALASI = 600_000

const TERMS = [
  'Pelanggan bertanggung jawab memastikan data diri, nomor HP, alamat pemasangan, dan titik lokasi yang diberikan benar serta dapat dihubungi oleh tim Distric Net.',
  'Layanan hanya dapat dipasang pada area jangkauan Distric Net. Jika lokasi berada di luar jangkauan atau tidak layak secara teknis, pendaftaran dapat ditolak atau dijadwalkan ulang.',
  'Akun pelanggan baru aktif setelah email berhasil diverifikasi dan data pendaftaran disetujui oleh admin.',
  'Biaya instalasi perangkat sebesar Rp 600.000 dibayarkan satu kali sesuai tagihan instalasi setelah pendaftaran disetujui admin.',
  'Bulan pertama layanan internet gratis untuk tagihan bulanan. Tagihan bulanan berikutnya mengikuti paket internet yang dipilih pelanggan.',
  'Pembayaran tagihan dilakukan melalui metode yang tersedia di dashboard pelanggan dan bukti pembayaran akan diverifikasi terlebih dahulu oleh admin.',
  'Pelanggan wajib menjaga perangkat yang dipasang di lokasi. Kerusakan, kehilangan, atau pemindahan perangkat tanpa konfirmasi dapat dikenakan biaya sesuai kebijakan Distric Net.',
  'Keterlambatan pembayaran atau pelanggaran penggunaan layanan dapat menyebabkan layanan dibatasi, dinonaktifkan sementara, atau dihentikan.',
  'Perubahan paket, perpindahan alamat, atau permintaan teknis lain perlu dikonfirmasi kepada admin agar dapat dijadwalkan.',
  'Dengan membuat pesanan, pelanggan menyatakan telah membaca dan menyetujui syarat serta ketentuan layanan Distric Net.',
]

// ── Bounding box Kabupaten Padang Pariaman ────────────────────────────────────
const BOUNDS = {
  south: -0.88,
  north: -0.28,
  west: 99.88,
  east: 100.38,
}
const CENTER: [number, number] = [-0.5450, 100.1167]

function inBounds(lat: number, lng: number) {
  return (
    lat >= BOUNDS.south && lat <= BOUNDS.north &&
    lng >= BOUNDS.west && lng <= BOUNDS.east
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

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`
}

export default function RegisterForm({ paketList, areaList }: RegisterFormProps) {
  const [showMap, setShowMap] = useState(false)
  const [coords, setCoords] = useState<Coords | null>(null)
  const [detailAlamat, setDetailAlamat] = useState('')
  const [selectedKecamatan, setSelectedKecamatan] = useState('')
  const [selectedNagari, setSelectedNagari] = useState('')
  const [outOfBounds, setOutOfBounds] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedPaketId, setSelectedPaketId] = useState('')
  const [reviewOpen, setReviewOpen] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [reviewData, setReviewData] = useState<ReviewData | null>(null)

  const formRef = useRef<HTMLFormElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstRef = useRef<import('leaflet').Map | null>(null)
  const markerRef = useRef<import('leaflet').Marker | null>(null)

  const selectedPaket = paketList.find((paket) => paket.id === selectedPaketId) ?? null
  const areaByKecamatan = useMemo(() => {
    return areaList.reduce<Record<string, string[]>>((acc, area) => {
      if (!acc[area.kecamatan]) acc[area.kecamatan] = []
      if (!acc[area.kecamatan].includes(area.nagari)) acc[area.kecamatan].push(area.nagari)
      return acc
    }, {})
  }, [areaList])
  const kecamatanOptions = useMemo(() => Object.keys(areaByKecamatan).sort(), [areaByKecamatan])
  const nagariOptions = selectedKecamatan ? areaByKecamatan[selectedKecamatan] ?? [] : []
  const fullAlamat = [
    detailAlamat.trim(),
    selectedNagari ? `Nagari ${selectedNagari}` : '',
    selectedKecamatan ? `Kecamatan ${selectedKecamatan}` : '',
    'Kabupaten Padang Pariaman',
    'Sumatera Barat',
  ].filter(Boolean).join(', ')

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'id', 'User-Agent': 'DistricNet/1.0' } },
      )
      const data = (await res.json()) as { display_name?: string }
      setDetailAlamat(data.display_name ?? '')
    } catch {
      setDetailAlamat('')
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
    if (!navigator.geolocation) {
      setError('Peramban tidak mendukung GPS.')
      return
    }
    setError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setShowMap(true)
        handleCoords(lat, lng)
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
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const initLat = coords?.lat ?? CENTER[0]
      const initLng = coords?.lng ?? CENTER[1]
      const maxBounds = L.latLngBounds(
        L.latLng(BOUNDS.south, BOUNDS.west),
        L.latLng(BOUNDS.north, BOUNDS.east),
      )

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
        if (!inBounds(lat, lng)) {
          setOutOfBounds(true)
          return
        }
        marker.setLatLng(e.latlng)
        handleCoords(lat, lng)
      })

      map.on('moveend', () => {
        const c = map.getCenter()
        const clampedLat = Math.min(BOUNDS.north, Math.max(BOUNDS.south, c.lat))
        const clampedLng = Math.min(BOUNDS.east, Math.max(BOUNDS.west, c.lng))
        if (clampedLat !== c.lat || clampedLng !== c.lng) {
          map.panTo([clampedLat, clampedLng], { animate: false })
        }
      })

      mapInstRef.current = map
      markerRef.current = marker
    })

    return () => {
      cancelled = true
      mapInstRef.current?.remove()
      mapInstRef.current = null
      markerRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMap])

  useEffect(() => {
    if (!coords || !markerRef.current || !mapInstRef.current) return
    markerRef.current.setLatLng([coords.lat, coords.lng])
    mapInstRef.current.setView([coords.lat, coords.lng], 15)
  }, [coords])

  function handleReview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setReviewError('')

    const form = e.currentTarget
    if (!form.reportValidity()) return
    if (password !== confirmPassword) {
      setError('Password tidak cocok.')
      return
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }
    if (!coords) {
      setError('Pilih lokasi pemasangan di dalam wilayah Kabupaten Padang Pariaman.')
      return
    }
    if (!selectedKecamatan) {
      setError('Pilih kecamatan pemasangan terlebih dahulu.')
      return
    }
    if (!selectedNagari) {
      setError('Pilih nagari pemasangan terlebih dahulu.')
      return
    }
    if (!detailAlamat.trim()) {
      setError('Isi detail alamat pemasangan terlebih dahulu.')
      return
    }
    if (!selectedPaketId || !selectedPaket) {
      setError('Pilih paket internet terlebih dahulu.')
      return
    }

    const fd = new FormData(form)
    setReviewData({
      namaLengkap: String(fd.get('nama_lengkap') ?? ''),
      email: String(fd.get('email') ?? ''),
      noHp: String(fd.get('no_hp') ?? ''),
      kecamatan: selectedKecamatan,
      nagari: selectedNagari,
      detailAlamat: detailAlamat.trim(),
    })
    setTermsAccepted(false)
    setReviewOpen(true)
  }

  async function handleCreateOrder() {
    setReviewError('')
    if (!termsAccepted) {
      setReviewError('Baca dan setujui syarat ketentuan terlebih dahulu.')
      return
    }
    if (!formRef.current || !coords || !selectedPaket) {
      setReviewError('Data pesanan belum lengkap. Periksa kembali form pendaftaran.')
      return
    }

    setSubmitting(true)
    const fd = new FormData(formRef.current)
    fd.set('latitude', String(coords.lat))
    fd.set('longitude', String(coords.lng))
    fd.set('paket_id', selectedPaket.id)
    fd.set('alamat_pemasangan', fullAlamat)

    const result = await registerAction(fd)
    if (result?.error) {
      setError(result.error)
      setReviewOpen(false)
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-brand-pink focus:outline-none focus:ring-2 focus:ring-brand-pink/30'
  const selectCls = `${inputCls} bg-white`
  const sectionTitleCls = 'font-display text-xl font-bold text-gray-900'
  const sectionHelpCls = 'text-sm text-gray-500'

  return (
    <>
      <div className="w-full max-w-5xl">
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl font-bold text-gray-900">Form Registrasi</h1>
          <p className="mt-2 text-base text-gray-600">Pemasangan baru untuk layanan internet Distric Net.</p>
        </div>

        <form
          id="register-form"
          ref={formRef}
          onSubmit={handleReview}
          className="rounded-2xl bg-white p-6 shadow-card md:p-8"
        >
          <input type="hidden" name="paket_id" value={selectedPaketId} readOnly />
          <input type="hidden" name="alamat_pemasangan" value={fullAlamat} readOnly />

          <section>
            <div className="mb-5 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
              <h2 className={sectionTitleCls}>Detail Akun</h2>
              <p className={sectionHelpCls}>Detail penanggung jawab layanan dan pembayaran.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nama Lengkap</label>
                <input name="nama_lengkap" placeholder="Contoh: Budi Santoso" required className={inputCls} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                  <input name="email" type="email" placeholder="Contoh: budi@email.com" required className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">No. HP</label>
                  <input
                    name="no_hp"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]+"
                    placeholder="Contoh: 08123456789"
                    onInput={(e) => {
                      const el = e.currentTarget
                      el.value = el.value.replace(/\D/g, '')
                    }}
                    required
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 karakter"
                      className={`${inputCls} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Konfirmasi Password</label>
                  <div className="relative">
                    <input
                      name="confirm_password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password"
                      className={`${inputCls} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-9">
            <div className="mb-5 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
              <h2 className={sectionTitleCls}>Alamat Pemasangan</h2>
              <p className={sectionHelpCls}>Pilih titik dan isi detail alamat pemasangan.</p>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Kecamatan</label>
                  <select
                    name="kecamatan"
                    required
                    value={selectedKecamatan}
                    onChange={(ev) => {
                      setSelectedKecamatan(ev.target.value)
                      setSelectedNagari('')
                    }}
                    disabled={!kecamatanOptions.length}
                    className={selectCls}
                  >
                    <option value="">Pilih kecamatan</option>
                    {kecamatanOptions.map((kecamatan) => (
                      <option key={kecamatan} value={kecamatan}>
                        {kecamatan}
                      </option>
                    ))}
                  </select>
                  {!kecamatanOptions.length ? (
                    <p className="mt-1 text-xs text-red-600">Data kecamatan belum tersedia.</p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Nagari</label>
                  <select
                    name="nagari"
                    required
                    value={selectedNagari}
                    onChange={(ev) => setSelectedNagari(ev.target.value)}
                    disabled={!selectedKecamatan || !nagariOptions.length}
                    className={selectCls}
                  >
                    <option value="">
                      {selectedKecamatan ? 'Pilih nagari' : 'Pilih kecamatan dulu'}
                    </option>
                    {nagariOptions.map((nagari) => (
                      <option key={nagari} value={nagari}>
                        {nagari}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Lokasi Pemasangan</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={useGps}
                    className="inline-flex items-center gap-1 rounded-xl border border-brand-purple px-3 py-2 text-sm font-medium text-brand-purple transition hover:bg-brand-purple/5"
                  >
                    <MapPin size={14} /> Gunakan GPS
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError('')
                      setOutOfBounds(false)
                      setShowMap((v) => !v)
                    }}
                    className="rounded-xl bg-brand-purple px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-purple/90"
                  >
                    {showMap ? 'Sembunyikan Peta' : 'Pilih di Peta'}
                  </button>
                </div>
              </div>

              {showMap && (
                <div className="space-y-1.5">
                  <div ref={mapRef} className="h-[260px] w-full overflow-hidden rounded-xl border border-gray-200" />
                  {outOfBounds ? (
                    <p className="text-xs text-red-600">
                      Lokasi di luar wilayah Kabupaten Padang Pariaman. Pilih titik yang benar.
                    </p>
                  ) : null}
                  {!outOfBounds && coords ? (
                    <p className="text-xs text-green-700">
                      Lokasi dipilih: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    </p>
                  ) : null}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Detail Alamat Pemasangan</label>
                <textarea
                  name="detail_alamat_pemasangan"
                  required
                  rows={4}
                  value={detailAlamat}
                  onChange={(ev) => setDetailAlamat(ev.target.value)}
                  placeholder="Contoh: korong, nama jalan, patokan rumah, warna rumah, atau detail akses lokasi"
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Data alamat ini disimpan bersama titik koordinat dari peta.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-9">
            <div className="mb-5 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
              <h2 className={sectionTitleCls}>Paket Internet</h2>
              <p className={sectionHelpCls}>Pilih paket internet sesuai kebutuhan rumah.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {paketList.map((paket) => {
                const isSelected = selectedPaketId === paket.id
                const benefits = paket.benefits?.length
                  ? paket.benefits
                  : ['Unlimited sesuai paket', 'Support admin', 'Tersedia di wilayah jangkauan']

                return (
                  <button
                    key={paket.id}
                    type="button"
                    onClick={() => setSelectedPaketId(paket.id)}
                    aria-pressed={isSelected}
                    className={`flex min-h-[260px] flex-col overflow-hidden rounded-xl border bg-white text-left transition ${
                      isSelected
                        ? 'border-brand-purple shadow-lg ring-2 ring-brand-purple/20'
                        : 'border-gray-200 hover:border-brand-purple/40 hover:shadow-md'
                    }`}
                  >
                    <div className="w-full px-5 py-5 text-center">
                      <div className="flex min-h-12 items-center justify-center gap-2">
                        <h3 className="font-display text-lg font-bold text-gray-900">{paket.nama_paket}</h3>
                        {isSelected ? <CheckCircle2 size={18} className="text-brand-purple" /> : null}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{paket.kecepatan_mbps} Mbps</p>
                      <p className="mt-4 text-3xl font-bold text-brand-purple">
                        {formatRupiah(paket.harga)}
                        <span className="text-sm font-medium text-gray-400">/bln</span>
                      </p>
                    </div>
                    <div className="flex-1 divide-y divide-white bg-gray-50">
                      {benefits.slice(0, 4).map((benefit) => (
                        <p key={benefit} className="px-5 py-3 text-center text-sm text-gray-600">
                          {benefit}
                        </p>
                      ))}
                    </div>
                    <div className="p-4">
                      <span className={`flex w-full items-center justify-center rounded-lg py-2 text-sm font-semibold ${
                        isSelected ? 'bg-brand-purple text-white' : 'bg-brand-pink text-white'
                      }`}>
                        {isSelected ? 'Dipilih' : 'Pilih'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {error ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </form>

        <div className="mt-6 space-y-3">
          <div className="flex justify-end">
            <button
              type="submit"
              form="register-form"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-pink px-7 py-3 font-display font-semibold text-white shadow-card transition hover:bg-brand-pink-dark disabled:opacity-60"
            >
              <ShoppingCart size={16} />
              Review Pesanan
            </button>
          </div>
        </div>
      </div>

      {reviewOpen && reviewData && selectedPaket ? (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/55 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="font-display text-lg font-bold text-gray-900">Review Pesanan</h2>
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
                aria-label="Tutup review pesanan"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-6">
              <div className="mx-auto max-w-2xl space-y-3 text-sm">
                <div className="grid grid-cols-[140px_1fr] gap-3">
                  <p className="font-semibold text-gray-700">Nama</p>
                  <p className="text-gray-700">{reviewData.namaLengkap}</p>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-3">
                  <p className="font-semibold text-gray-700">Email</p>
                  <p className="break-all text-gray-700">{reviewData.email}</p>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-3">
                  <p className="font-semibold text-gray-700">No. HP</p>
                  <p className="text-gray-700">{reviewData.noHp}</p>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-3">
                  <p className="font-semibold text-gray-700">Alamat</p>
                  <div className="space-y-1 text-gray-700">
                    <p>{reviewData.detailAlamat}</p>
                    <p className="text-xs text-gray-500">
                      Nagari {reviewData.nagari}, Kecamatan {reviewData.kecamatan}, Kabupaten Padang Pariaman, Sumatera Barat
                    </p>
                    {coords ? (
                      <p className="text-xs text-gray-400">
                        Titik lokasi: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-3">
                  <p className="font-semibold text-gray-700">Paket Internet</p>
                  <div className="space-y-1 text-gray-700">
                    <p className="font-semibold">{selectedPaket.nama_paket} ({selectedPaket.kecepatan_mbps} Mbps)</p>
                    <p>{formatRupiah(selectedPaket.harga)} / bulan</p>
                    <p className="text-xs text-gray-500">Biaya instalasi: {formatRupiah(BIAYA_INSTALASI)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <h3 className="font-display text-xl font-bold text-gray-900">Syarat dan Ketentuan</h3>
                <p className="mt-1 text-sm italic text-gray-500">
                  Sebelum membuat pesanan, baca dan setujui ketentuan layanan di bawah ini.
                </p>
              </div>

              <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 px-5 py-4">
                <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-gray-600">
                  {TERMS.map((term) => (
                    <li key={term}>{term}</li>
                  ))}
                </ol>
              </div>

              {reviewError ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {reviewError}
                </div>
              ) : null}
            </div>

            <div className="border-t border-gray-100 bg-white px-5 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-start gap-3 text-sm font-medium text-gray-600">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) => setTermsAccepted(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-purple focus:ring-brand-purple"
                  />
                  Saya telah membaca dan setuju dengan syarat ketentuan ini.
                </label>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewOpen(false)}
                    disabled={submitting}
                    className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateOrder}
                    disabled={submitting || !termsAccepted}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-pink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-pink-dark disabled:opacity-60"
                  >
                    {submitting ? <Loader2 size={15} className="animate-spin" /> : <ShoppingCart size={15} />}
                    Buat Pesanan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
