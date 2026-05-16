import Link from 'next/link'
import StatCard from '@/components/StatCard'
import {
  getDashboardPelangganData,
  formatPeriode,
  formatRupiah,
  getStatusTagihanMeta,
} from '@/lib/data/dashboardPelanggan'
import { createClient } from '@/lib/supabase/server'
import { getCurrentPelanggan } from '@/lib/data/pelanggan'
import type { TagihanInstalasi, TagihanRow } from '@/types/database'
import { AlertCircle, CheckCircle2, Receipt, Wrench } from 'lucide-react'
import { redirect } from 'next/navigation'

type UnifiedTagihan =
  | { type: 'bulanan'; data: TagihanRow }
  | { type: 'instalasi'; data: TagihanInstalasi }

export default async function TagihanPage() {
  const pelanggan = await getCurrentPelanggan()
  if (!pelanggan) redirect('/login')

  const supabase = await createClient()

  const [{ tagihan }, { data: instalasiRaw }] = await Promise.all([
    getDashboardPelangganData().then((d) => ({ tagihan: d.tagihan })),
    supabase
      .from('tagihan_instalasi')
      .select('*')
      .eq('pelanggan_id', pelanggan.id)
      .order('created_at', { ascending: false }),
  ])

  const tagihanInstalasi = (instalasiRaw ?? []) as TagihanInstalasi[]
  const tagihanInstalasiAktif = tagihanInstalasi.find((item) => item.status_tagihan !== 'lunas') ?? null
  const instalasiNotice = tagihanInstalasiAktif?.status_tagihan === 'menunggu_verifikasi'
    ? {
        title: 'Pembayaran Instalasi Sedang Diverifikasi',
        message:
          'Bukti pembayaran instalasi Anda sudah dikirim. Admin akan memeriksa pembayaran terlebih dahulu, lalu tim Distric Net akan menghubungi Anda untuk konfirmasi jadwal pemasangan.',
        action: 'Lihat Detail Instalasi',
      }
    : {
        title: 'Menunggu Pembayaran Instalasi',
        message:
          'Pendaftaran Anda sudah disetujui. Selesaikan pembayaran instalasi agar tim Distric Net dapat memproses jadwal pemasangan di alamat pemasangan Anda.',
        action: 'Bayar Instalasi',
      }

  // Gabungkan dan urutkan berdasarkan created_at terbaru
  const unified: UnifiedTagihan[] = [
    ...tagihan.map((d) => ({ type: 'bulanan' as const, data: d })),
    ...tagihanInstalasi.map((d) => ({ type: 'instalasi' as const, data: d })),
  ].sort(
    (a, b) =>
      new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime(),
  )

  // Stats — ikut menghitung tagihan instalasi
  const totalTagihan = tagihan.length + tagihanInstalasi.length

  const belumBayarBulanan = tagihan.filter((t) => t.status_tagihan === 'belum_bayar')
  const belumBayarInstalasi = tagihanInstalasi.filter((t) => t.status_tagihan === 'belum_bayar')
  const totalBelumBayar = belumBayarBulanan.length + belumBayarInstalasi.length
  const totalTunggakan =
    belumBayarBulanan.reduce((sum, t) => sum + t.jumlah_tagihan, 0) +
    belumBayarInstalasi.reduce((sum, t) => sum + t.jumlah_tagihan, 0)

  const menungguBulanan = tagihan.filter((t) => t.status_tagihan === 'menunggu_verifikasi')
  const menungguInstalasi = tagihanInstalasi.filter(
    (t) => t.status_tagihan === 'menunggu_verifikasi',
  )
  const totalMenunggu = menungguBulanan.length + menungguInstalasi.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Tagihan</h1>
        <p className="mt-1 text-sm text-gray-500">
          Lihat semua tagihan, jatuh tempo, dan status pembayaran Anda.
        </p>
      </div>

      {pelanggan.status_langganan === 'ditangguhkan' ? (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 text-sm text-orange-800">
          <p className="font-semibold">
            {tagihanInstalasiAktif ? instalasiNotice.title : 'Layanan Ditangguhkan Sementara'}
          </p>
          <p className="mt-1">
            {tagihanInstalasiAktif
              ? instalasiNotice.message
              : 'Selesaikan tagihan bulanan yang melewati jatuh tempo, lalu status akan kembali aktif setelah pembayaran lunas.'}
          </p>
        </div>
      ) : null}

      {tagihanInstalasiAktif ? (
        <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-600">
                <Wrench size={18} />
              </span>
              <div>
                <p className="font-display font-semibold text-gray-900">{instalasiNotice.title}</p>
                <p className="mt-1 text-sm text-gray-600">{instalasiNotice.message}</p>
              </div>
            </div>
            <Link
              href={`/dashboard/tagihan-instalasi/${tagihanInstalasiAktif.id}`}
              className="inline-flex justify-center rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
            >
              {instalasiNotice.action}
            </Link>
          </div>
        </div>
      ) : null}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Total Tagihan"
          value={totalTagihan}
          sub="Tagihan bulanan & instalasi"
          icon={<Receipt size={16} className="text-brand-purple" />}
          iconBg="bg-purple-100"
        />
        <StatCard
          label="Belum Dibayar"
          value={totalBelumBayar}
          sub={formatRupiah(totalTunggakan)}
          icon={<AlertCircle size={16} className="text-red-600" />}
          iconBg="bg-red-100"
          valueColor="text-red-600"
        />
        <StatCard
          label="Menunggu Verifikasi"
          value={totalMenunggu}
          sub="Sedang dicek admin"
          icon={<CheckCircle2 size={16} className="text-yellow-600" />}
          iconBg="bg-yellow-100"
          valueColor="text-yellow-600"
        />
      </div>

      {/* Tabel Gabungan */}
      <div className="rounded-2xl bg-white shadow-card">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="font-display text-lg font-semibold text-gray-900">Daftar Tagihan</h2>
          <p className="mt-1 text-sm text-gray-500">
            Klik detail untuk mengirim bukti pembayaran pada tagihan yang belum dibayar.
          </p>
        </div>

        {unified.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            Belum ada tagihan untuk akun Anda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-6 pb-3 pt-5">Periode</th>
                  <th className="px-6 pb-3 pt-5">Jatuh Tempo</th>
                  <th className="px-6 pb-3 pt-5">Jumlah</th>
                  <th className="px-6 pb-3 pt-5">Status</th>
                  <th className="px-6 pb-3 pt-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {unified.map((item) => {
                  const badge = getStatusTagihanMeta(item.data.status_tagihan)

                  if (item.type === 'instalasi') {
                    return (
                      <tr
                        key={`instalasi-${item.data.id}`}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                            <Wrench size={11} />
                            Biaya Instalasi
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {item.data.jatuh_tempo
                            ? new Date(item.data.jatuh_tempo).toLocaleDateString('id-ID')
                            : '-'}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-700">
                          {formatRupiah(item.data.jumlah_tagihan)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/dashboard/tagihan-instalasi/${item.data.id}`}
                            className="inline-flex rounded-lg border border-brand-purple/20 px-3 py-1.5 text-xs font-semibold text-brand-purple transition hover:bg-brand-purple/5"
                          >
                            {item.data.status_tagihan === 'belum_bayar'
                              ? 'Bayar Sekarang'
                              : 'Lihat Detail'}
                          </Link>
                        </td>
                      </tr>
                    )
                  }

                  const t = item.data as TagihanRow
                  return (
                    <tr
                      key={`bulanan-${t.id}`}
                      className="border-b border-gray-50 last:border-0"
                    >
                      <td className="px-6 py-4 font-medium text-gray-700">
                        {formatPeriode(t.bulan, t.tahun)}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {t.jatuh_tempo
                          ? new Date(t.jatuh_tempo).toLocaleDateString('id-ID')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-700">
                        {formatRupiah(t.jumlah_tagihan)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/tagihan/${t.id}`}
                          className="inline-flex rounded-lg border border-brand-purple/20 px-3 py-1.5 text-xs font-semibold text-brand-purple transition hover:bg-brand-purple/5"
                        >
                          {t.status_tagihan === 'belum_bayar' ? 'Bayar Sekarang' : 'Lihat Detail'}
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
