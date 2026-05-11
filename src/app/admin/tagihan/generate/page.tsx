import Link from 'next/link'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import { generateTagihanBulanan } from '@/app/admin/actions'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function GenerateTagihanPage({
  searchParams,
}: {
  searchParams?: { success?: string; error?: string }
}) {
  const admin = createAdminClient()
  const { count: pelangganAktif } = await admin
    .from('pelanggan')
    .select('*', { count: 'exact', head: true })
    .eq('status_langganan', 'aktif')

  const now = new Date()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/tagihan"
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
            <h1 className="font-display text-xl font-bold text-gray-900">Generate Tagihan Bulanan</h1>
            <p className="mt-1 text-sm text-gray-500">
              Sistem akan membuat tagihan untuk pelanggan aktif yang belum memiliki tagihan pada periode tersebut. Jatuh tempo otomatis sesuai tanggal bergabung masing-masing pelanggan.
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-1 max-w-xs">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-400">Pelanggan Aktif</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{pelangganAktif ?? 0}</p>
          </div>
        </div>

        <form action={generateTagihanBulanan} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Bulan</label>
              <select
                name="bulan"
                required
                defaultValue={now.getMonth() + 1}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
              >
                {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((nama, i) => (
                  <option key={i+1} value={i+1}>{nama}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tahun</label>
              <select
                name="tahun"
                required
                defaultValue={now.getFullYear()}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            Jika periode yang sama pernah digenerate sebelumnya, sistem hanya akan menambahkan tagihan yang belum ada.
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              className="rounded-xl bg-brand-pink px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-700"
            >
              Generate Tagihan
            </button>
            <Link
              href="/admin/tagihan"
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
