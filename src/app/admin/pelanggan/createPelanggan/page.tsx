'use client'

import { addPelangganByAdmin } from '@/app/admin/actions'
import { ArrowLeft, ChevronDown, Loader2, MailCheck } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Paket = {
  id: string
  nama_paket: string
  kecepatan_mbps: number
  harga: number
}

const BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

export default function TambahPelangganPage() {
  const [paketList, setPaketList] = useState<Paket[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const now = useMemo(() => new Date(), [])
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const yearOptions = useMemo(
    () => Array.from({ length: 7 }, (_, index) => currentYear - 5 + index),
    [currentYear],
  )

  useEffect(() => {
    fetch('/api/admin/paket')
      .then((response) => response.json())
      .then((data) => setPaketList(Array.isArray(data) ? data : []))
      .catch(() => setPaketList([]))
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const fd = new FormData(e.currentTarget)
    const result = await addPelangganByAdmin(fd)
    if (result?.error) {
      setError(result.error)
      setSubmitting(false)
    } else {
      setSuccess(true)
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-10 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <MailCheck size={28} className="text-green-600" />
        </div>
        <h2 className="font-display text-xl font-bold text-gray-900">Undangan Pelanggan Terkirim!</h2>
        <p className="mt-2 text-sm text-gray-500">
          Data pelanggan tersimpan, tagihan instalasi dibuat, dan email aktivasi sudah dikirim untuk membuat password.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/admin/pelanggan"
            className="rounded-xl bg-brand-purple px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-900"
          >
            Kembali ke Daftar
          </Link>
          <button
            type="button"
            onClick={() => {
              setError('')
              setSuccess(false)
            }}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Tambah Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/pelanggan"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Kembali
        </Link>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-card md:p-8">
        <div className="mb-8">
          <h1 className="font-display text-xl font-bold text-gray-900">Tambah Pelanggan Baru</h1>
          <p className="mt-1 text-sm text-gray-500">
            Isi data pelanggan, pilih paket, dan tentukan periode awal. Layanan aktif setelah instalasi selesai.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Nama Lengkap</label>
            <input
              name="nama_lengkap"
              required
              placeholder="Nama sesuai KTP"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="nama@email.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">No. HP</label>
              <input
                name="no_hp"
                type="tel"
                required
                placeholder="08xxxxxxxxxx"
                onInput={(event) => {
                  const input = event.currentTarget
                  input.value = input.value.replace(/\D/g, '')
                }}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Paket Internet</label>
            <div className="relative">
              <select
                name="paket_id"
                required
                defaultValue=""
                className="h-[50px] w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-10 text-sm transition focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
              >
                <option value="" disabled>Pilih paket</option>
                {paketList.map((paket) => (
                  <option key={paket.id} value={paket.id}>
                    {paket.nama_paket} - {paket.kecepatan_mbps} Mbps (Rp {paket.harga.toLocaleString('id-ID')}/bln)
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Bulan Masuk</label>
              <div className="relative">
                <select
                  name="bulan_masuk"
                  defaultValue={String(currentMonth)}
                  required
                  className="h-[50px] w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-10 text-sm transition focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                >
                  {BULAN.map((bulan, index) => (
                    <option key={bulan} value={index + 1}>
                      {bulan}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tahun Masuk</label>
              <div className="relative">
                <select
                  name="tahun_masuk"
                  defaultValue={String(currentYear)}
                  required
                  className="h-[50px] w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-10 text-sm transition focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                >
                  {yearOptions.map((tahun) => (
                    <option key={tahun} value={tahun}>
                      {tahun}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
          
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-xl bg-brand-pink px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:opacity-60"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
              Simpan Pelanggan
            </button>
            <Link
              href="/admin/pelanggan"
              className="rounded-xl border border-gray-200 px-6 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Batal
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
