import { History, Link2, Wrench } from 'lucide-react'
import {
  formatPeriode,
  formatRupiah,
  getDashboardPelangganData,
  getStatusVerifikasiMeta,
} from '@/lib/data/dashboardPelanggan'
import { createAdminClient } from '@/lib/supabase/admin'
import InvoiceButton from '@/components/InvoiceButton'

export default async function RiwayatPage() {
  const { pembayaran } = await getDashboardPelangganData()

  // Fetch invoice yang terkait dengan pembayaran-pembayaran ini
  const admin = createAdminClient()
  const pembayaranIds = pembayaran.map((p) => p.id)
  const invoiceMap: Record<string, { id: string; pdf_url: string | null }> = {}

  if (pembayaranIds.length > 0) {
    const { data: invoices } = await admin
      .from('invoice')
      .select('id, pembayaran_id, pdf_url')
      .in('pembayaran_id', pembayaranIds)

    for (const inv of invoices ?? []) {
      invoiceMap[inv.pembayaran_id] = { id: inv.id, pdf_url: inv.pdf_url }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Riwayat Bayar</h1>
        <p className="mt-1 text-sm text-gray-500">
          Lihat daftar pembayaran yang sudah pernah Anda kirim.
        </p>
      </div>

      <div className="rounded-2xl bg-white shadow-card">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="font-display text-lg font-semibold text-gray-900">Riwayat Pembayaran</h2>
        </div>

        {pembayaran.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            Belum ada riwayat pembayaran.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-6 pb-3 pt-5">Periode</th>
                  <th className="px-6 pb-3 pt-5">Tanggal Bayar</th>
                  <th className="px-6 pb-3 pt-5">Jumlah</th>
                  <th className="px-6 pb-3 pt-5">Bukti</th>
                  <th className="px-6 pb-3 pt-5">Status</th>
                  <th className="px-6 pb-3 pt-5">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {pembayaran.map((item) => {
                  const badge        = getStatusVerifikasiMeta(item.status_verifikasi)
                  const isInstallasi = item.tagihan_instalasi != null && item.tagihan == null
                  const inv          = invoiceMap[item.id]

                  return (
                    <tr key={item.id} className="border-b border-gray-50 last:border-0">
                      {/* Kolom Periode */}
                      <td className="px-6 py-4">
                        {isInstallasi ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                            <Wrench size={11} />
                            Instalasi
                          </span>
                        ) : item.tagihan ? (
                          <span className="font-medium text-gray-700">
                            {formatPeriode(item.tagihan.bulan, item.tagihan.tahun)}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Tanggal Bayar */}
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(item.tanggal_pembayaran).toLocaleString('id-ID')}
                      </td>

                      {/* Jumlah */}
                      <td className="px-6 py-4 font-medium text-gray-700">
                        {formatRupiah(item.jumlah_bayar)}
                      </td>

                      {/* Bukti */}
                      <td className="px-6 py-4">
                        {item.bukti_pembayaran ? (
                          <a
                            href={item.bukti_pembayaran}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-brand-purple hover:underline"
                          >
                            <Link2 size={14} />
                            Lihat Bukti
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
                            {badge.label}
                          </span>
                          {item.catatan_admin ? (
                            <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                              <History size={14} className="mt-0.5 flex-shrink-0" />
                              <span>{item.catatan_admin}</span>
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* Invoice */}
                      <td className="px-6 py-4">
                        {item.status_verifikasi === 'diterima' ? (
                          <InvoiceButton
                            pembayaranId={item.id}
                            invoiceId={inv?.id ?? null}
                            invoicePdfUrl={inv?.pdf_url ?? null}
                            variant="customer"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
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