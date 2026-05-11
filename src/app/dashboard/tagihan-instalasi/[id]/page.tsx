import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CircleAlert, FileText, ReceiptText, Wrench } from 'lucide-react'
import {
  formatRupiah,
  getStatusTagihanMeta,
  getStatusVerifikasiMeta,
  getTagihanInstalasiDetailForCurrentPelanggan,
} from '@/lib/data/dashboardPelanggan'
import type { TagihanInstalasi } from '@/types/database'
import PaymentUploadFormInstalasi from './PaymentUploadFormInstalasi'
import PaymentMethod from '../../tagihan/[id]/paymentMethod'

export default async function TagihanInstalasiDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { success?: string; error?: string }
}) {
  const detail = await getTagihanInstalasiDetailForCurrentPelanggan(params.id)

  if (!detail) notFound()

  const { instalasi, pembayaran, pelanggan } = detail
  const ti = instalasi as TagihanInstalasi
  const badge = getStatusTagihanMeta(ti.status_tagihan)
  const latestPayment = pembayaran[0]
  const canSubmitPayment = ti.status_tagihan === 'belum_bayar'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Kembali ke Dashboard
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

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl bg-white p-6 shadow-card">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-100">
                <Wrench size={18} className="text-orange-600" />
              </span>
              <div>
                <h1 className="font-display text-xl font-bold text-gray-900">Tagihan Instalasi</h1>
                <p className="mt-1 text-sm text-gray-500">Biaya instalasi perangkat</p>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-400">Nominal Tagihan</p>
              <p className="mt-2 font-display text-2xl font-bold text-gray-900">{formatRupiah(ti.jumlah_tagihan)}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-400">Jatuh Tempo</p>
              <p className="mt-2 text-base font-semibold text-gray-900">
                {ti.jatuh_tempo ? new Date(ti.jatuh_tempo).toLocaleDateString('id-ID') : 'Belum diatur'}
              </p>
            </div>
          </div>

          {latestPayment ? (
            <div className="mt-6 rounded-xl border border-gray-100 p-4">
              <div className="mb-3 flex items-center gap-2">
                <ReceiptText size={16} className="text-brand-purple" />
                <h2 className="font-semibold text-gray-900">Pembayaran Terakhir</h2>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-500">Tanggal Bayar</span>
                  <span className="font-medium text-gray-700">
                    {new Date(latestPayment.tanggal_pembayaran).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-500">Jumlah</span>
                  <span className="font-medium text-gray-700">{formatRupiah(latestPayment.jumlah_bayar)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-500">Status Verifikasi</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusVerifikasiMeta(latestPayment.status_verifikasi).className}`}
                  >
                    {getStatusVerifikasiMeta(latestPayment.status_verifikasi).label}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-500">Bukti</span>
                  {latestPayment.bukti_pembayaran ? (
                    <a
                      href={latestPayment.bukti_pembayaran}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-brand-purple hover:underline"
                    >
                      Buka Link
                    </a>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
                {latestPayment.catatan_admin ? (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    <span className="font-semibold">Catatan admin:</span> {latestPayment.catatan_admin}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
          <PaymentMethod />
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-card">
          <div className="mb-5">
            <h2 className="font-display text-lg font-semibold text-gray-900">Kirim Bukti Pembayaran</h2>
            <p className="mt-1 text-sm text-gray-500">
              Unggah bukti transfer (JPG, PNG, WEBP, atau PDF). Alur verifikasi sama dengan tagihan bulanan.
            </p>
          </div>

          {canSubmitPayment ? (
            <PaymentUploadFormInstalasi
              userId={pelanggan.user_id}
              instalasiId={ti.id}
              defaultAmount={ti.jumlah_tagihan}
            />
          ) : (
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4 text-sm text-gray-600">
              <div className="mb-2 flex items-center gap-2 font-semibold text-gray-800">
                <CircleAlert size={16} className="text-brand-purple" />
                Pembayaran tidak dapat dikirim ulang
              </div>
              <p>Tagihan instalasi ini sedang diproses atau sudah lunas. Jika ada kendala, silakan hubungi admin.</p>
            </div>
          )}

          {pembayaran.length > 1 ? (
            <div className="mt-6 rounded-xl border border-gray-100 p-4">
              <div className="mb-3 flex items-center gap-2">
                <FileText size={16} className="text-brand-purple" />
                <h3 className="font-semibold text-gray-900">Riwayat Pengiriman</h3>
              </div>
              <div className="space-y-3">
                {pembayaran.map((item) => (
                  <div key={item.id} className="rounded-xl bg-gray-50 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-gray-500">{new Date(item.tanggal_pembayaran).toLocaleString('id-ID')}</span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusVerifikasiMeta(item.status_verifikasi).className}`}
                      >
                        {getStatusVerifikasiMeta(item.status_verifikasi).label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
