import StatCard from '@/components/StatCard'
import { createClient } from '@/lib/supabase/server'
import { getCurrentPelanggan } from '@/lib/data/pelanggan'
import type { PembayaranRow, TagihanInstalasi, TagihanRow } from '@/types/database'
import { AlertTriangle, CheckCircle, PauseCircle, Receipt, Wifi, Wrench } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

type PembayaranWithTagihan = PembayaranRow & {
  tagihan: { bulan: number; tahun: number } | null
}

const bulanNama = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPelangganPage() {
  const pelanggan = await getCurrentPelanggan()
  if (!pelanggan) redirect('/login')
  if (pelanggan.status_langganan === 'pending') redirect('/dashboard/pending')
  if (pelanggan.status_langganan === 'nonaktif') redirect('/dashboard/nonaktif')

  const now = new Date()
  const supabase = await createClient()

  // Fetch semua data paralel
  const [tagihanBulanIni, tagihanRows, pembayaranRows, tagihanInstalasi] = await Promise.all([
    supabase
      .from('tagihan')
      .select('jumlah_tagihan, status_tagihan')
      .eq('pelanggan_id', pelanggan.id)
      .eq('bulan', now.getMonth() + 1)
      .eq('tahun', now.getFullYear())
      .maybeSingle()
      .then((r) => r.data),
    supabase
      .from('tagihan')
      .select('*')
      .eq('pelanggan_id', pelanggan.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .then((r) => (r.data ?? []) as TagihanRow[]),
    Promise.all([
      supabase
        .from('pembayaran')
        .select('*, tagihan!inner(bulan, tahun, pelanggan_id)')
        .eq('tagihan.pelanggan_id', pelanggan.id)
        .order('created_at', { ascending: false })
        .limit(5)
        .then((r) => (r.data ?? []) as PembayaranWithTagihan[]),
      supabase
        .from('pembayaran')
        .select('*, tagihan_instalasi!inner(id, pelanggan_id)')
        .eq('tagihan_instalasi.pelanggan_id', pelanggan.id)
        .order('created_at', { ascending: false })
        .limit(5)
        .then((r) => (r.data ?? []) as PembayaranWithTagihan[]),
    ]).then(([bulanan, instalasi]) => {
      const merged = [...bulanan, ...instalasi]
      merged.sort((a, b) => new Date(b.tanggal_pembayaran).getTime() - new Date(a.tanggal_pembayaran).getTime())
      return merged.slice(0, 5)
    }),
    supabase
      .from('tagihan_instalasi')
      .select('*')
      .eq('pelanggan_id', pelanggan.id)
      .maybeSingle()
      .then((r) => r.data as TagihanInstalasi | null),
  ])

  const paket = pelanggan.paket_internet
  const isDitangguhkan = pelanggan.status_langganan === 'ditangguhkan'
  const statusLanggananMeta = isDitangguhkan
    ? {
        label: 'Ditangguhkan',
        sub: 'Ada tagihan yang perlu dibayar',
        icon: <PauseCircle size={16} className="text-orange-600" />,
        iconBg: 'bg-orange-100',
        valueColor: 'text-orange-600',
      }
    : {
        label: 'Aktif',
        sub: `Bergabung ${new Date(pelanggan.tanggal_bergabung).toLocaleDateString('id-ID', {
          month: 'long',
          year: 'numeric',
        })}`,
        icon: <CheckCircle size={16} className="text-green-600" />,
        iconBg: 'bg-green-100',
        valueColor: 'text-green-600',
      }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      belum_bayar: 'bg-red-100 text-red-700',
      menunggu_verifikasi: 'bg-yellow-100 text-yellow-700',
      lunas: 'bg-green-100 text-green-700',
    }
    const label: Record<string, string> = {
      belum_bayar: 'Belum Bayar',
      menunggu_verifikasi: 'Menunggu Verifikasi',
      lunas: 'Lunas',
    }
    return (
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[s] ?? 'bg-gray-100 text-gray-600'}`}>
        {label[s] ?? s}
      </span>
    )
  }

  const verifikasiBadge = (s: string) => {
    const map: Record<string, string> = {
      menunggu: 'bg-yellow-100 text-yellow-700',
      diterima: 'bg-green-100 text-green-700',
      ditolak: 'bg-red-100 text-red-700',
    }
    return (
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[s] ?? 'bg-gray-100 text-gray-600'}`}>
        {s.charAt(0).toUpperCase() + s.slice(1)}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">
          Selamat datang, {pelanggan.nama_lengkap.split(' ')[0]}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {now.toLocaleDateString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
          {' · '}
          <span className="font-medium text-brand-purple">
            {pelanggan.paket_internet?.nama_paket ?? 'Paket tidak ditemukan'}
          </span>
        </p>
      </div>

      {isDitangguhkan ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
            <p>
              Layanan Anda sedang ditangguhkan karena ada tagihan instalasi belum lunas atau tagihan bulanan yang melewati jatuh tempo.
            </p>
          </div>
          <Link
            href="/dashboard/tagihan"
            className="inline-flex justify-center rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-700"
          >
            Bayar Tagihan
          </Link>
        </div>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Paket Aktif"
          value={`${paket?.kecepatan_mbps ?? '-'} Mbps`}
          sub={`${paket?.nama_paket ?? '-'} · ${fmt(paket?.harga ?? 0)}/bln`}
          icon={<Wifi size={16} className="text-brand-purple" />}
          iconBg="bg-purple-100"
        />
        <StatCard
          label={`Tagihan ${bulanNama[now.getMonth()]} ${now.getFullYear()}`}
          value={tagihanBulanIni ? fmt(tagihanBulanIni.jumlah_tagihan) : 'Gratis (Bulan Pertama)'}
          sub={tagihanBulanIni?.status_tagihan ?? ''}
          icon={<Receipt size={16} className="text-brand-pink" />}
          iconBg="bg-pink-100"
          valueColor={tagihanBulanIni?.status_tagihan === 'lunas' ? 'text-green-600' : 'text-gray-900'}
        />
        <StatCard
          label="Status Langganan"
          value={statusLanggananMeta.label}
          sub={statusLanggananMeta.sub}
          icon={statusLanggananMeta.icon}
          iconBg={statusLanggananMeta.iconBg}
          valueColor={statusLanggananMeta.valueColor}
        />
      </div>

      {/* ── Tagihan Instalasi ──────────────────────────────────────────── */}
      {tagihanInstalasi && (
        <div className="rounded-2xl bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-100">
              <Wrench size={15} className="text-orange-600" />
            </span>
            <h2 className="font-display font-semibold text-gray-900">Tagihan Instalasi</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="pb-3">Keterangan</th>
                  <th className="pb-3">Jumlah</th>
                  <th className="pb-3">Jatuh Tempo</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 text-gray-700 font-medium">Biaya Instalasi Perangkat</td>
                  <td className="py-3 font-semibold text-gray-900">{fmt(tagihanInstalasi.jumlah_tagihan)}</td>
                  <td className="py-3 text-gray-500">
                    {new Date(tagihanInstalasi.jatuh_tempo).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </td>
                  <td className="py-3">{statusBadge(tagihanInstalasi.status_tagihan)}</td>
                  <td className="py-3">
                    {tagihanInstalasi.status_tagihan === 'belum_bayar' ? (
                      <Link
                        href={`/dashboard/tagihan-instalasi/${tagihanInstalasi.id}`}
                        className="rounded-lg bg-brand-pink px-3 py-1 text-xs font-semibold text-white transition hover:bg-brand-pink-dark"
                      >
                        Upload
                      </Link>
                    ) : null}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tagihan Bulanan + Riwayat Pembayaran ──────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tagihan Bulanan */}
        <div className="rounded-2xl bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display font-semibold text-gray-900">Tagihan Bulanan</h2>
            <Link href="/dashboard/tagihan" className="text-xs font-semibold text-brand-pink hover:underline">
              Lihat Semua →
            </Link>
          </div>
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
              {tagihanRows.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 text-gray-700">
                    {bulanNama[t.bulan - 1]} {t.tahun}
                  </td>
                  <td className="py-3 font-medium text-gray-700">{fmt(t.jumlah_tagihan)}</td>
                  <td className="py-3">{statusBadge(t.status_tagihan)}</td>
                  <td className="py-3">
                    {t.status_tagihan === 'belum_bayar' ? (
                      <Link
                        href={`/dashboard/tagihan/${t.id}`}
                        className="rounded-lg bg-brand-pink px-3 py-1 text-xs font-semibold text-white transition hover:bg-brand-pink-dark"
                      >
                        Upload
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
              {tagihanRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-gray-400">
                    Belum ada tagihan bulanan
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Riwayat Pembayaran */}
        <div className="rounded-2xl bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display font-semibold text-gray-900">Riwayat Pembayaran</h2>
            <Link href="/dashboard/riwayat" className="text-xs font-semibold text-brand-pink hover:underline">
              Lihat Semua →
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="pb-3">Tanggal</th>
                <th className="pb-3">Jumlah</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {pembayaranRows.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 text-gray-700">
                    {new Date(p.tanggal_pembayaran).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="py-3 font-medium text-gray-700">{fmt(p.jumlah_bayar)}</td>
                  <td className="py-3">{verifikasiBadge(p.status_verifikasi)}</td>
                </tr>
              ))}
              {pembayaranRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-sm text-gray-400">
                    Belum ada pembayaran
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
