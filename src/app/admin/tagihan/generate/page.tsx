import Link from 'next/link'
import { ArrowLeft, CalendarDays, Receipt, Wrench } from 'lucide-react'
import { generateTagihanBulanan, generateTagihanInstalasiManual } from '@/app/admin/actions'
import { createAdminClient } from '@/lib/supabase/admin'

type PelangganOption = {
  id: string
  nama_lengkap: string
  paket_internet: {
    nama_paket: string
    kecepatan_mbps: number
  } | null
}

type RawPelangganOption = Omit<PelangganOption, 'paket_internet'> & {
  paket_internet:
    | PelangganOption['paket_internet']
    | NonNullable<PelangganOption['paket_internet']>[]
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

function PelangganSelect({ pelangganList }: { pelangganList: PelangganOption[] }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">Pelanggan</label>
      <select
        name="pelanggan_id"
        defaultValue="semua"
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
      >
        <option value="semua">Semua pelanggan aktif</option>
        {pelangganList.map((pelanggan) => {
          const paket = pelanggan.paket_internet
            ? `${pelanggan.paket_internet.nama_paket} ${pelanggan.paket_internet.kecepatan_mbps} Mbps`
            : 'Belum ada paket'

          return (
            <option key={pelanggan.id} value={pelanggan.id}>
              {pelanggan.nama_lengkap} - {paket}
            </option>
          )
        })}
      </select>
    </div>
  )
}

function getDefaultInstalasiDueDate() {
  const date = new Date()
  date.setDate(date.getDate() + 2)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default async function GenerateTagihanPage({
  searchParams,
}: {
  searchParams?: { success?: string; error?: string; jenis?: string }
}) {
  const admin = createAdminClient()
  const now = new Date()
  const defaultInstalasiDueDate = getDefaultInstalasiDueDate()
  const jenis = searchParams?.jenis === 'instalasi' ? 'instalasi' : 'bulanan'
  const isInstalasi = jenis === 'instalasi'
  const tagihanHref = isInstalasi ? '/admin/tagihan?jenis=instalasi' : '/admin/tagihan'

  const [{ count: pelangganAktif }, { data: pelangganRows }] = await Promise.all([
    admin
      .from('pelanggan')
      .select('*', { count: 'exact', head: true })
      .eq('status_langganan', 'aktif'),
    admin
      .from('pelanggan')
      .select('id, nama_lengkap, paket_internet(nama_paket, kecepatan_mbps)')
      .eq('status_langganan', 'aktif')
      .order('nama_lengkap', { ascending: true }),
  ])

  const pelangganList = ((pelangganRows ?? []) as RawPelangganOption[]).map((pelanggan) => ({
    ...pelanggan,
    paket_internet: Array.isArray(pelanggan.paket_internet)
      ? pelanggan.paket_internet[0] ?? null
      : pelanggan.paket_internet,
  }))

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={tagihanHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Kembali ke Tagihan
        </Link>
      </div>

      {searchParams?.success ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {searchParams.success}
        </div>
      ) : null}

      {searchParams?.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </div>
      ) : null}

      <div className="rounded-2xl bg-white p-6 shadow-card md:p-8">
        <div className="mb-8 flex items-start gap-3">
          <div className="rounded-xl bg-purple-100 p-3 text-brand-purple">
            <CalendarDays size={18} />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-gray-900">
              {isInstalasi ? 'Generate Tagihan Instalasi' : 'Generate Tagihan Bulanan'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isInstalasi
                ? 'Pilih pelanggan untuk membuat tagihan biaya instalasi perangkat.'
                : 'Pilih pelanggan dan periode untuk membuat tagihan bulanan.'}
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-400">Pelanggan Aktif</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{pelangganAktif ?? 0}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-400">Pelanggan Bisa Dipilih</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{pelangganList.length}</p>
          </div>
        </div>

        {isInstalasi ? (
          <form action={generateTagihanInstalasiManual} className="rounded-2xl border border-gray-100 p-5">
            <div className="mb-5 flex items-start gap-3">
              <div className="rounded-xl bg-orange-100 p-2.5 text-orange-600">
                <Wrench size={16} />
              </div>
              <div>
                <h2 className="font-display font-semibold text-gray-900">Tagihan Instalasi</h2>
                <p className="mt-1 text-xs text-gray-500">
                  Membuat tagihan biaya instalasi perangkat Rp 600.000.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <PelangganSelect pelangganList={pelangganList} />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Jatuh Tempo</label>
                <input
                  name="jatuh_tempo"
                  type="date"
                  required
                  defaultValue={defaultInstalasiDueDate}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Otomatis H+2 dari hari ini, bisa diubah sebelum tagihan dibuat.
                </p>
              </div>

              <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs text-yellow-800">
                Pelanggan yang sudah punya tagihan instalasi tidak akan dibuatkan duplikat.
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
              >
                Generate Tagihan Instalasi
              </button>
            </div>
          </form>
        ) : (
          <form action={generateTagihanBulanan} className="rounded-2xl border border-gray-100 p-5">
            <div className="mb-5 flex items-start gap-3">
              <div className="rounded-xl bg-purple-100 p-2.5 text-brand-purple">
                <Receipt size={16} />
              </div>
              <div>
                <h2 className="font-display font-semibold text-gray-900">Tagihan Bulanan</h2>
                <p className="mt-1 text-xs text-gray-500">
                  Membuat tagihan berdasarkan harga paket pelanggan.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <PelangganSelect pelangganList={pelangganList} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Bulan</label>
                  <select
                    name="bulan"
                    required
                    defaultValue={now.getMonth() + 1}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                  >
                    {BULAN.map((nama, index) => (
                      <option key={nama} value={index + 1}>
                        {nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Tahun</label>
                  <select
                    name="tahun"
                    required
                    defaultValue={now.getFullYear()}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                  >
                    {Array.from({ length: 7 }, (_, index) => now.getFullYear() - 3 + index).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Jatuh Tempo</label>
                <input
                  name="jatuh_tempo"
                  type="date"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Kosongkan untuk otomatis mengikuti tanggal bergabung pelanggan; jika tidak ada, tanggal 10.
                </p>
              </div>

              <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs text-yellow-800">
                Pelanggan yang sudah punya tagihan pada periode ini tidak akan dibuatkan duplikat.
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-brand-pink px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-700"
              >
                Generate Tagihan Bulanan
              </button>
            </div>
          </form>
        )}

        <div className="mt-5">
          <Link
            href={tagihanHref}
            className="inline-flex rounded-xl border border-gray-200 px-6 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Batal
          </Link>
        </div>
      </div>
    </div>
  )
}
