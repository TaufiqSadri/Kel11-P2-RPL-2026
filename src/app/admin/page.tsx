import { approvePelanggan, approvePembayaran, rejectPembayaran } from '@/app/admin/actions'
import StatCard from '@/components/StatCard'
import ConfirmActionForm from '@/components/ConfirmActionForm'
import { createAdminClient } from '@/lib/supabase/admin'
import { Clock, CreditCard, UserCheck, Users, LayoutDashboard, PauseCircle, Wrench } from 'lucide-react'
import Link from 'next/link'
import { syncSuspendedPelangganStatuses } from '@/lib/data/pelangganStatus'

type PelangganBaru = {
  id: string
  nama_lengkap: string
  status_langganan: string
  paket_internet: { nama_paket: string; kecepatan_mbps: number } | null
}

type PembayaranVerifikasi = {
  id: string
  tagihan_id: string | null
  tagihan_instalasi_id?: string | null
  jumlah_bayar: number
  tagihan: {
    id: string
    bulan: number
    tahun: number
    pelanggan: { nama_lengkap: string } | null
  } | null
  tagihan_instalasi: {
    id: string
    jumlah_tagihan: number
    pelanggan: { nama_lengkap: string } | null
  } | null
}

export default async function AdminDashboardPage() {
  await syncSuspendedPelangganStatuses()
  const admin = createAdminClient()

  const [
    r1,
    r2,
    r3,
    r4,
    r5,
    r6,
    { data: pelangganBaru },
    { data: pembayaranPerluVerifikasi }
  ] = await Promise.all([
    admin.from('pelanggan').select('*', { count: 'exact', head: true }),
    admin.from('pelanggan').select('*', { count: 'exact', head: true }).eq('status_langganan', 'aktif'),
    admin.from('pelanggan').select('*', { count: 'exact', head: true }).eq('status_langganan', 'pending'),
    admin.from('pembayaran').select('*', { count: 'exact', head: true }).eq('status_verifikasi', 'menunggu'),
    admin.from('pelanggan').select('*', { count: 'exact', head: true }).eq('status_langganan', 'ditangguhkan'),
    admin.from('pelanggan').select('*', { count: 'exact', head: true }).eq('status_langganan', 'proses_instalasi'),
    admin.from('pelanggan')
      .select('*, paket_internet(nama_paket, kecepatan_mbps)')
      .order('created_at', { ascending: false })
      .limit(5),
    admin
      .from('pembayaran')
      .select(
        `
        *,
        tagihan(id, bulan, tahun, pelanggan(nama_lengkap)),
        tagihan_instalasi(id, jumlah_tagihan, pelanggan(nama_lengkap))
      `,
      )
      .eq('status_verifikasi', 'menunggu')
      .order('created_at', { ascending: false })
      .limit(5)
  ])

  const totalPelanggan = r1.count ?? 0
  const pelangganAktif = r2.count ?? 0
  const pelangganPending = r3.count ?? 0
  const pembayaranPending = r4.count ?? 0
  const pelangganDitangguhkan = r5.count ?? 0
  const pelangganProsesInstalasi = r6.count ?? 0

  const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`
  const bulanNama = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']

  const rowsPelanggan = (pelangganBaru ?? []) as PelangganBaru[]
  const rowsPembayaran = (pembayaranPerluVerifikasi ?? []) as PembayaranVerifikasi[]

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
          <LayoutDashboard size={20} className="text-brand-purple"/>
          Dashboard Admin
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard
          label="Total Pelanggan"
          value={totalPelanggan}
          sub="Semua terdaftar"
          icon={<Users size={16} className="text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <StatCard
          label="Pelanggan Aktif"
          value={pelangganAktif}
          sub="Layanan berjalan"
          icon={<UserCheck size={16} className="text-green-600" />}
          iconBg="bg-green-100"
          valueColor="text-green-600"
        />
        <StatCard
          label="Pending Approval"
          value={pelangganPending}
          sub="Perlu disetujui"
          icon={<Clock size={16} className="text-yellow-600" />}
          iconBg="bg-yellow-100"
          valueColor="text-yellow-600"
        />
        <StatCard
          label="Ditangguhkan"
          value={pelangganDitangguhkan}
          sub="Ada tunggakan"
          icon={<PauseCircle size={16} className="text-orange-600" />}
          iconBg="bg-orange-100"
          valueColor="text-orange-600"
        />
        <StatCard
          label="Proses Instalasi"
          value={pelangganProsesInstalasi}
          sub="Menunggu pemasangan"
          icon={<Wrench size={16} className="text-blue-600" />}
          iconBg="bg-blue-100"
          valueColor="text-blue-600"
        />
        <StatCard
          label="Pembayaran Pending"
          value={pembayaranPending}
          sub="Perlu verifikasi"
          icon={<CreditCard size={16} className="text-red-600" />}
          iconBg="bg-red-100"
          valueColor="text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display font-semibold text-gray-900">Pendaftaran Baru</h2>
            <Link href="/admin/pelanggan" className="text-xs font-semibold text-brand-pink hover:underline">
              Lihat Semua →
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="pb-3">Nama</th>
                <th className="pb-3">Paket</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rowsPelanggan.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3">
                    <div className="flex max-w-[140px] items-center gap-2">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-brand-purple">
                        {p.nama_lengkap
                          .split(' ')
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <span className="truncate font-medium text-gray-700">{p.nama_lengkap}</span>
                    </div>
                  </td>
                  <td className="py-3 text-xs text-gray-500">{p.paket_internet?.kecepatan_mbps} Mbps</td>
                  <td className="py-3">
                    {p.status_langganan === 'pending' ? (
                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">
                        Pending
                      </span>
                    ) : p.status_langganan === 'ditangguhkan' ? (
                      <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">
                        Ditangguhkan
                      </span>
                    ) : p.status_langganan === 'proses_instalasi' ? (
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                        Proses Instalasi
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                        Aktif
                      </span>
                    )}
                  </td>
                  <td className="py-3">
                    {p.status_langganan === 'pending' ? (
                      <form action={approvePelanggan.bind(null, p.id)}>
                        <button
                          type="submit"
                          className="rounded-lg bg-brand-pink px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-pink-dark"
                        >
                          Approve
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
              {rowsPelanggan.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-gray-400">
                    Tidak ada data
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display font-semibold text-gray-900">Verifikasi Pembayaran</h2>
            <Link href="/admin/verifikasi" className="text-xs font-semibold text-brand-pink hover:underline">
              Lihat Semua →
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="pb-3">Pelanggan</th>
                <th className="pb-3">Periode</th>
                <th className="pb-3">Jumlah</th>
                <th className="pb-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rowsPembayaran.map((p) => {
                const nama = p.tagihan?.pelanggan?.nama_lengkap ?? p.tagihan_instalasi?.pelanggan?.nama_lengkap
                const periode = p.tagihan
                  ? `${bulanNama[(p.tagihan.bulan ?? 1) - 1]} ${p.tagihan.tahun}`
                  : 'Instalasi'
                return (
                <tr key={p.id} className="border-b border-gray-50 last:border-0">
                  <td className="max-w-[100px] truncate py-3 font-medium text-gray-700">
                    {nama?.split(' ')[0]}
                  </td>
                  <td className="py-3 text-xs text-gray-500">{periode}</td>
                  <td className="py-3 text-xs font-medium text-gray-700">{fmt(p.jumlah_bayar)}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      <form action={approvePembayaran.bind(null, p.id, p.tagihan_id)}>
                        <button
                          type="submit"
                          className="rounded-lg bg-green-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700"
                        >
                          Terima
                        </button>
                      </form>
                      <ConfirmActionForm
                        action={rejectPembayaran.bind(null, p.id, '')}
                        itemName={nama ?? 'Pelanggan'}
                        title="Konfirmasi Tolak Pembayaran"
                        message="Pembayaran ini akan ditolak dan tagihan terkait kembali berstatus belum bayar."
                        confirmLabel="Ya, Tolak"
                      >
                        <button
                          type="submit"
                          className="rounded-lg border border-red-200 px-2 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Tolak
                        </button>
                      </ConfirmActionForm>
                    </div>
                  </td>
                </tr>
                )
              })}
              {rowsPembayaran.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-gray-400">
                    Tidak ada pembayaran pending
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
