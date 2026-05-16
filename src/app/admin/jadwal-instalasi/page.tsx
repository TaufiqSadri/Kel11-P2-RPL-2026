import { CalendarClock, CheckCircle2, ChevronDown, Clock, Hammer, Phone, User, Wrench } from 'lucide-react'
import { updateJadwalInstalasiAction } from '@/app/admin/actions'
import StatCard from '@/components/StatCard'
import { getJadwalInstalasiList } from '@/lib/data/jadwalInstalasi'
import type { StatusJadwalInstalasi } from '@/types/database'

const STATUS_OPTIONS: Array<{ value: StatusJadwalInstalasi | 'semua'; label: string }> = [
  { value: 'semua', label: 'Semua Status' },
  { value: 'menunggu_jadwal', label: 'Menunggu Jadwal' },
  { value: 'terjadwal', label: 'Terjadwal' },
  { value: 'dikerjakan', label: 'Dikerjakan' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'dibatalkan', label: 'Dibatalkan' },
]

const STATUS_BADGE: Record<StatusJadwalInstalasi, string> = {
  menunggu_jadwal: 'bg-yellow-100 text-yellow-700',
  terjadwal: 'bg-blue-100 text-blue-700',
  dikerjakan: 'bg-purple-100 text-purple-700',
  selesai: 'bg-green-100 text-green-700',
  dibatalkan: 'bg-red-100 text-red-700',
}

function labelStatus(status: string) {
  return STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status
}

function toDateInput(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60_000)
  return localDate.toISOString().slice(0, 10)
}

function toTimeInput(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60_000)
  return localDate.toISOString().slice(11, 16)
}

function formatDateTime(value: string | null) {
  if (!value) return 'Belum dijadwalkan'
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AdminJadwalInstalasiPage({
  searchParams,
}: {
  searchParams?: { status?: string }
}) {
  const status = STATUS_OPTIONS.some((item) => item.value === searchParams?.status)
    ? (searchParams?.status as StatusJadwalInstalasi | 'semua')
    : 'semua'

  const result = await getJadwalInstalasiList({ status, pageSize: 50 })
  const rows = result.data
  const menunggu = rows.filter((row) => row.status === 'menunggu_jadwal').length
  const terjadwal = rows.filter((row) => row.status === 'terjadwal').length
  const dikerjakan = rows.filter((row) => row.status === 'dikerjakan').length
  const selesai = rows.filter((row) => row.status === 'selesai').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-gray-900">
            <Wrench size={21} className="text-brand-purple" />
            Jadwal Instalasi
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola jadwal pemasangan setelah pembayaran instalasi diverifikasi.
          </p>
        </div>
        <form action="/admin/jadwal-instalasi" className="flex w-full gap-2 sm:w-auto">
          <select
            name="status"
            defaultValue={status}
            className="h-11 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20 sm:w-56"
          >
            {STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-11 rounded-xl bg-brand-pink px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-700 active:scale-95"
          >
            Terapkan
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Menunggu Jadwal"
          value={menunggu}
          sub="Perlu diatur"
          icon={<Clock size={16} className="text-yellow-600" />}
          iconBg="bg-yellow-100"
          valueColor="text-yellow-600"
        />
        <StatCard
          label="Terjadwal"
          value={terjadwal}
          sub="Sudah punya tanggal"
          icon={<CalendarClock size={16} className="text-blue-600" />}
          iconBg="bg-blue-100"
          valueColor="text-blue-600"
        />
        <StatCard
          label="Dikerjakan"
          value={dikerjakan}
          sub="Dalam proses"
          icon={<Hammer size={16} className="text-purple-600" />}
          iconBg="bg-purple-100"
          valueColor="text-purple-600"
        />
        <StatCard
          label="Selesai"
          value={selesai}
          sub="Pelanggan aktif"
          icon={<CheckCircle2 size={16} className="text-green-600" />}
          iconBg="bg-green-100"
          valueColor="text-green-600"
        />
      </div>

      <div className="rounded-2xl bg-white shadow-card">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="font-display text-lg font-semibold text-gray-900">Daftar Jadwal</h2>
          <p className="mt-1 text-sm text-gray-500">
            Tandai status menjadi selesai hanya saat pemasangan benar-benar selesai. Status pelanggan akan berubah aktif.
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            Belum ada jadwal instalasi.
          </div>
        ) : (
          <div className="space-y-4 p-4 sm:p-6">
            {rows.map((row) => {
              const action = updateJadwalInstalasiAction.bind(null, row.id)
              const paket = row.pelanggan?.paket_internet
                ? `${row.pelanggan.paket_internet.nama_paket} ${row.pelanggan.paket_internet.kecepatan_mbps} Mbps`
                : 'Paket belum tersedia'
              const detailId = `jadwal-detail-${row.id}`

              return (
                <div
                  key={row.id}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/70 p-4"
                >
                  <input id={detailId} type="checkbox" className="peer sr-only" />

                  <div className="grid gap-3 xl:grid-cols-[minmax(180px,1.15fr)_minmax(150px,0.8fr)_minmax(130px,0.72fr)_minmax(150px,0.8fr)_minmax(300px,1.12fr)_auto] xl:items-center peer-checked:[&_.jadwal-chevron]:rotate-180">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-display text-lg font-semibold text-gray-900">
                          {row.pelanggan?.nama_lengkap ?? '-'}
                        </p>
                        <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[row.status]}`}>
                          {labelStatus(row.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-brand-purple">{paket}</p>
                    </div>

                    <div className="rounded-xl bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Kontak Pelanggan</p>
                      <p className="mt-1 font-medium text-gray-800">{row.pelanggan?.no_hp ?? '-'}</p>
                    </div>
                    <div className="rounded-xl bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Teknisi</p>
                      <p className="mt-1 font-medium text-gray-800">{row.teknisi ?? 'Belum ditentukan'}</p>
                    </div>
                    <div className="rounded-xl bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">No. HP Teknisi</p>
                      <p className="mt-1 font-medium text-gray-800">{row.no_hp_teknisi ?? 'Belum tersedia'}</p>
                    </div>

                    <form action={action} className="rounded-xl bg-white px-4 py-3">
                      <input type="hidden" name="tanggal_pemasangan" value={toDateInput(row.tanggal_pemasangan)} />
                      <input type="hidden" name="jam_pemasangan" value={toTimeInput(row.tanggal_pemasangan)} />
                      <input type="hidden" name="teknisi" value={row.teknisi ?? ''} />
                      <input type="hidden" name="no_hp_teknisi" value={row.no_hp_teknisi ?? ''} />
                      <input type="hidden" name="catatan" value={row.catatan ?? ''} />
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Ubah Status
                      </label>
                      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                        <select
                          name="status"
                          defaultValue={row.status}
                          className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                        >
                          {STATUS_OPTIONS.filter((item) => item.value !== 'semua').map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="h-10 rounded-xl bg-brand-pink px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-700 active:scale-95"
                        >
                          Simpan
                        </button>
                      </div>
                    </form>

                    <label
                      htmlFor={detailId}
                      className="grid h-12 w-12 cursor-pointer place-items-center justify-self-end rounded-full bg-white text-gray-500 shadow-sm transition hover:text-brand-purple"
                      aria-label={`Buka detail jadwal ${row.pelanggan?.nama_lengkap ?? 'pelanggan'}`}
                    >
                      <ChevronDown size={20} className="jadwal-chevron transition" />
                    </label>
                  </div>

                  <div className="hidden peer-checked:block">
                    <form action={action} className="mt-4 border-t border-gray-100 pt-4">
                      <input type="hidden" name="status" value={row.status} />
                      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.95fr)]">
                        <div className="space-y-4">
                          <div className="rounded-2xl bg-gray-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Alamat Pemasangan</p>
                            <p className="mt-1 text-sm leading-6 text-gray-600">{row.pelanggan?.alamat_pemasangan ?? '-'}</p>
                          </div>
                          <div className="rounded-2xl bg-gray-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Catatan Saat Ini</p>
                            <p className="mt-1 text-sm leading-6 text-gray-600">{row.catatan || 'Belum ada catatan.'}</p>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-white p-0">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Tanggal Pemasangan
                              </label>
                              <input
                                type="date"
                                name="tanggal_pemasangan"
                                defaultValue={toDateInput(row.tanggal_pemasangan)}
                                className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                              />
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Jam Pemasangan
                              </label>
                              <input
                                type="time"
                                name="jam_pemasangan"
                                defaultValue={toTimeInput(row.tanggal_pemasangan)}
                                className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                              />
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Teknisi
                              </label>
                              <div className="relative">
                                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                  name="teknisi"
                                  defaultValue={row.teknisi ?? ''}
                                  placeholder="Nama teknisi"
                                  className="h-11 w-full rounded-xl border border-gray-200 py-3 pl-10 pr-3 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                                No. HP Teknisi
                              </label>
                              <div className="relative">
                                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                  name="no_hp_teknisi"
                                  defaultValue={row.no_hp_teknisi ?? ''}
                                  placeholder="08xxxxxxxxxx"
                                  className="h-11 w-full rounded-xl border border-gray-200 py-3 pl-10 pr-3 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-2">
                              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Catatan
                              </label>
                              <textarea
                                name="catatan"
                                defaultValue={row.catatan ?? ''}
                                rows={3}
                                placeholder="Contoh: teknisi akan menghubungi sebelum datang, patokan rumah, atau kendala akses."
                                className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                              />
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs leading-5 text-gray-400">
                              Detail jadwal ini akan tampil di notifikasi dashboard pelanggan.
                            </p>
                            <button
                              type="submit"
                              className="h-11 rounded-xl bg-brand-pink px-5 text-sm font-semibold text-white transition hover:bg-pink-700 sm:w-36"
                            >
                              Simpan
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
