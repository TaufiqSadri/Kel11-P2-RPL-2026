import { Suspense } from 'react'
import StatCard from '@/components/StatCard'
import { createClient } from '@/lib/supabase/server'
import { getCurrentPelanggan } from '@/lib/data/pelanggan'
import type { PembayaranRow, TagihanRow } from '@/types/database'
import { CheckCircle, Receipt, Wifi } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

type PembayaranWithTagihan = PembayaranRow & {
  tagihan: { bulan: number; tahun: number } | null
}

const bulanNama = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

// ── Stats section (fast — only pelanggan data needed) ─────────────────────────
async function StatsSection() {
  const pelanggan = await getCurrentPelanggan()
  if (!pelanggan) redirect('/login')

  const now = new Date()
  const supabase = await createClient()

  const { data: tagihanBulanIni } = await supabase
    .from('tagihan')
    .select('jumlah_tagihan, status_tagihan')
    .eq('pelanggan_id', pelanggan.id)
    .eq('bulan', now.getMonth() + 1)
    .eq('tahun', now.getFullYear())
    .maybeSingle()

  const paket = pelanggan.paket_internet

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
      <StatCard
        label="Paket Aktif"
        value={`${paket?.kecepatan_mbps ?? '-'} Mbps`}
        sub={`${paket?.nama_paket ?? '-'} · ${fmt(paket?.harga ?? 0)}/bln`}
        icon={<Wifi size={16} className="text-brand-purple" />}
        iconBg="bg-purple-100"
      />
      <StatCard
        label={`Tagihan ${bulanNama[now.getMonth()]} ${now.getFullYear()}`}
        value={tagihanBulanIni ? fmt(tagihanBulanIni.jumlah_tagihan) : 'Belum ada'}
        sub={tagihanBulanIni?.status_tagihan ?? ''}
        icon={<Receipt size={16} className="text-brand-pink" />}
        iconBg="bg-pink-100"
        valueColor={tagihanBulanIni?.status_tagihan === 'lunas' ? 'text-green-600' : 'text-gray-900'}
      />
      <StatCard
        label="Status Langganan"
        value="Aktif"
        sub={`Bergabung ${new Date(pelanggan.tanggal_bergabung).toLocaleDateString('id-ID', {
          month: 'long',
          year: 'numeric',
        })}`}
        icon={<CheckCircle size={16} className="text-green-600" />}
        iconBg="bg-green-100"
        valueColor="text-green-600"
      />
    </div>
  )
}

// ── Tagihan table section ──────────────────────────────────────────────────────
async function TagihanSection() {
  const pelanggan = await getCurrentPelanggan()
  if (!pelanggan) return null

  const supabase = await createClient()
  const { data: tagihan } = await supabase
    .from('tagihan')
    .select('*')
    .eq('pelanggan_id', pelanggan.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const tagihanRows = (tagihan ?? []) as TagihanRow[]

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

  return (
    <div className="rounded-2xl bg-white p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display font-semibold text-gray-900">Tagihan Terbaru</h2>
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
                Belum ada tagihan
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}

// ── Pembayaran section ────────────────────────────────────────────────────────
async function PembayaranSection() {
  const pelanggan = await getCurrentPelanggan()
  if (!pelanggan) return null

  const supabase = await createClient()
  const { data: tagihanList } = await supabase
    .from('tagihan')
    .select('id')
    .eq('pelanggan_id', pelanggan.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const tagihanIds = (tagihanList ?? []).map((t) => t.id)

  const { data: pembayaran } =
    tagihanIds.length > 0
      ? await supabase
          .from('pembayaran')
          .select('*, tagihan(bulan, tahun)')
          .in('tagihan_id', tagihanIds)
          .order('created_at', { ascending: false })
          .limit(5)
      : { data: [] as PembayaranWithTagihan[] }

  const pembayaranRows = (pembayaran ?? []) as PembayaranWithTagihan[]

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
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
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
  )
}

// ── Skeleton components ───────────────────────────────────────────────────────
function StatsSkeleton() {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white p-5 shadow-card">
          <div className="mb-3 flex items-start justify-between">
            <div className="h-2.5 w-24 animate-pulse rounded-md bg-gray-100" />
            <div className="h-9 w-9 animate-pulse rounded-xl bg-gray-100" />
          </div>
          <div className="h-8 w-20 animate-pulse rounded-md bg-gray-100" />
          <div className="mt-1 h-2.5 w-32 animate-pulse rounded-md bg-gray-100" />
        </div>
      ))}
    </div>
  )
}

function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card">
      <div className="mb-4 h-5 w-36 animate-pulse rounded-md bg-gray-100" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 w-16 animate-pulse rounded-md bg-gray-100" />
            <div className="h-4 w-24 animate-pulse rounded-md bg-gray-100" />
            <div className="h-4 w-20 animate-pulse rounded-md bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function DashboardPelangganPage() {
  const pelanggan = await getCurrentPelanggan()
  if (!pelanggan) redirect('/login')
  if (pelanggan.status_langganan === 'pending') redirect('/dashboard/pending')
  if (pelanggan.status_langganan === 'nonaktif') redirect('/dashboard/nonaktif')

  const now = new Date()

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">
          Selamat datang, {pelanggan.nama_lengkap.split(' ')[0]}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {now.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          {' · '}
          <span className="font-medium text-brand-purple">
            {pelanggan.paket_internet?.nama_paket ?? 'Paket tidak ditemukan'}
          </span>
        </p>
      </div>

      {/* Stats render first — only needs single pelanggan query */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />
      </Suspense>

      {/* Tables stream in independently */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<TableSkeleton rows={4} />}>
          <TagihanSection />
        </Suspense>

        <Suspense fallback={<TableSkeleton rows={4} />}>
          <PembayaranSection />
        </Suspense>
      </div>
    </div>
  )
}