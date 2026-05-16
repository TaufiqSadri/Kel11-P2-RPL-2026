import { createAdminClient } from '@/lib/supabase/admin'
import { ArrowLeft, MapPin, Phone, Mail, Wifi, Calendar } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import DeletePelangganButton from './deletePelangganButton'
import { syncSuspendedPelangganStatuses } from '@/lib/data/pelangganStatus'

type Props = { params: { id: string } }

const STATUS_MAP = {
  aktif: { label: 'Aktif', cls: 'bg-green-100 text-green-700 border-green-200' },
  ditangguhkan: { label: 'Ditangguhkan', cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  proses_instalasi: { label: 'Proses Instalasi', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  pending: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  nonaktif: { label: 'Nonaktif', cls: 'bg-red-100 text-red-500 border-red-200' },
}

const TAGIHAN_STATUS = {
  belum_bayar: { label: 'Belum Bayar', cls: 'bg-red-100 text-red-700' },
  menunggu_verifikasi: { label: 'Menunggu Verifikasi', cls: 'bg-yellow-100 text-yellow-700' },
  lunas: { label: 'Lunas', cls: 'bg-green-100 text-green-700' },
  overdue: { label: 'Overdue', cls: 'bg-gray-200 text-gray-700' },
}

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
const fmtNullableDate = (d: string | null) => d ? fmtDate(d) : 'Belum aktif'

export default async function DetailPelangganPage({ params }: Props) {
  await syncSuspendedPelangganStatuses([params.id])
  const admin = createAdminClient()

  const { data: pelanggan } = await admin
    .from('pelanggan')
    .select('*, paket_internet(*)')
    .eq('id', params.id)
    .single()

  if (!pelanggan) notFound()

  const { data: tagihan } = await admin
    .from('tagihan')
    .select('*')
    .eq('pelanggan_id', params.id)
    .order('tahun', { ascending: false })
    .order('bulan', { ascending: false })
    .limit(12)

  const status = STATUS_MAP[pelanggan.status_langganan as keyof typeof STATUS_MAP]
  const initials = pelanggan.nama_lengkap
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const paket = pelanggan.paket_internet as { nama_paket: string; kecepatan_mbps: number; harga: number } | null
  const tagihanRows = (tagihan ?? []) as Array<{ id: string; bulan: number; tahun: number; jumlah_tagihan: number; status_tagihan: string }>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/admin/pelanggan"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Kembali ke Daftar Pelanggan
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/pelanggan/${params.id}/updatePelanggan`}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Edit Data
          </Link>
          <DeletePelangganButton pelangganId={params.id} userId={pelanggan.user_id} namaLengkap={pelanggan.nama_lengkap} />
        </div>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl bg-white p-6 shadow-card md:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-purple/10 font-display text-2xl font-bold text-brand-purple">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-gray-900">{pelanggan.nama_lengkap}</h1>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${status?.cls}`}>
                {status?.label}
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-gray-400">ID: {pelanggan.id}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem icon={<Mail size={14} />} label="Email" value={pelanggan.email} />
              <InfoItem icon={<Phone size={14} />} label="No. HP" value={pelanggan.no_hp} />
              <InfoItem
                icon={<Calendar size={14} />}
                label="Bergabung"
                value={fmtNullableDate(pelanggan.tanggal_bergabung)}
              />
              <InfoItem
                icon={<MapPin size={14} />}
                label="Alamat"
                value={pelanggan.alamat_pemasangan}
                colSpan
              />
              {pelanggan.latitude !== null && pelanggan.latitude !== undefined && pelanggan.longitude !== null && pelanggan.longitude !== undefined ? (
                <div className="sm:col-span-2 lg:col-span-1">
                  <a
                    href={`https://www.google.com/maps?q=${pelanggan.latitude},${pelanggan.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brand-purple/30 px-3 py-1.5 text-xs font-semibold text-brand-purple transition hover:bg-brand-purple/5"
                  >
                    <MapPin size={12} />
                    Lihat di Google Maps
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Paket Info */}
      <div className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="mb-4 font-display font-semibold text-gray-900">Paket Internet</h2>
        {paket ? (
          <div className="flex flex-wrap items-center gap-4 rounded-xl bg-purple-50 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-purple/10">
              <Wifi size={20} className="text-brand-purple" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{paket.nama_paket}</p>
              <p className="text-sm text-gray-500">{paket.kecepatan_mbps} Mbps · {fmt(paket.harga)}/bulan</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Paket tidak ditemukan.</p>
        )}
      </div>

      {/* Tagihan */}
      <div className="rounded-2xl bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display font-semibold text-gray-900">Riwayat Tagihan</h2>
          <Link
            href={`/admin/tagihan?pelanggan=${params.id}`}
            className="text-xs font-semibold text-brand-pink hover:underline"
          >
            Lihat Semua →
          </Link>
        </div>

        {tagihanRows.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">Belum ada tagihan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="pb-3">Periode</th>
                  <th className="pb-3">Jumlah</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {tagihanRows.map((t) => {
                  const st = TAGIHAN_STATUS[t.status_tagihan as keyof typeof TAGIHAN_STATUS]
                  return (
                    <tr key={t.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 font-medium text-gray-700">
                        {BULAN[t.bulan - 1]} {t.tahun}
                      </td>
                      <td className="py-3 text-gray-700">{fmt(t.jumlah_tagihan)}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st?.cls ?? 'bg-gray-100 text-gray-600'}`}>
                          {st?.label ?? t.status_tagihan}
                        </span>
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/admin/tagihan/${t.id}`}
                          className="text-xs font-semibold text-brand-purple hover:underline"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoItem({
  icon,
  label,
  value,
  colSpan,
}: {
  icon: React.ReactNode
  label: string
  value: string
  colSpan?: boolean
}) {
  return (
    <div className={colSpan ? 'sm:col-span-2 lg:col-span-2' : ''}>
      <p className="mb-0.5 flex items-center gap-1 text-xs text-gray-400">
        {icon}
        {label}
      </p>
      <p className="text-sm font-medium text-gray-700">{value}</p>
    </div>
  )
}
