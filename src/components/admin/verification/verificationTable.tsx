'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import type { PembayaranWithRelations } from '@/lib/data/pembayaran'
import { getPembayaranPelanggan } from '@/lib/pembayaranPelanggan'
import VerificationActions from './verificationActions'
import PaymentProofModal from './paymentProofModal'
import InvoiceButton from '@/components/InvoiceButton'

interface Props {
  rows      : PembayaranWithRelations[]
  total     : number
  page      : number
  pageSize  : number
  totalPages: number
  invoiceMap: Record<string, { id: string; pdf_url: string | null }>
}

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des']
const fmt     = (n: number) => `Rp ${n.toLocaleString('id-ID')}`
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = [
    'bg-purple-100 text-purple-700','bg-pink-100 text-pink-700',
    'bg-blue-100 text-blue-700','bg-teal-100 text-teal-700','bg-orange-100 text-orange-700',
  ]
  const idx = name.charCodeAt(0) % colors.length
  return (
    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-display text-sm font-bold ${colors[idx]}`}>
      {initials}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; dot: string }> = {
    menunggu : { label: 'Menunggu', className: 'border-yellow-200 bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
    diterima : { label: 'Diterima', className: 'border-green-200 bg-green-100 text-green-700',  dot: 'bg-green-500'  },
    ditolak  : { label: 'Ditolak',  className: 'border-red-200 bg-red-100 text-red-700',        dot: 'bg-red-500'    },
  }
  const cfg = map[status] ?? { label: status, className: 'border-gray-200 bg-gray-100 text-gray-600', dot: 'bg-gray-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

export default function VerificationTable({ rows, total, page, pageSize, totalPages, invoiceMap }: Props) {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams= useSearchParams()
  const [proofModal, setProofModal] = useState<{ url: string | null; name: string } | null>(null)

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`${pathname}?${params.toString()}`)
  }

  if (rows.length === 0 && total === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 shadow-card">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <span className="text-3xl">📄</span>
        </div>
        <p className="font-display font-semibold text-gray-600">Belum ada data pembayaran</p>
        <p className="mt-1 text-sm text-gray-400">Pembayaran pelanggan akan muncul di sini.</p>
      </div>
    )
  }

  return (
    <>
      {proofModal ? (
        <PaymentProofModal url={proofModal.url} pelangganName={proofModal.name} onClose={() => setProofModal(null)} />
      ) : null}

      <div className="rounded-2xl bg-white shadow-card">
        {/* Desktop */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Pelanggan','Periode','Nominal','Tanggal Upload','Bukti','Status','Invoice','Aksi'].map((h) => (
                  <th key={h} className="px-5 pb-3 pt-5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const pl          = getPembayaranPelanggan(p)
                const periode     = p.tagihan
                  ? `${BULAN[p.tagihan.bulan - 1]} ${p.tagihan.tahun}`
                  : p.tagihan_instalasi ? 'Instalasi' : '—'
                const nominal     = p.tagihan?.jumlah_tagihan ?? p.tagihan_instalasi?.jumlah_tagihan ?? null
                const inv         = invoiceMap[p.id]

                return (
                  <tr key={p.id} className="border-b border-gray-50 transition hover:bg-gray-50/50 last:border-0">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={pl?.nama_lengkap ?? '?'} />
                        <div>
                          <p className="font-medium text-gray-900">{pl?.nama_lengkap ?? '—'}</p>
                          <p className="text-xs text-gray-400">{pl?.no_hp ?? ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><span className="font-medium text-gray-700">{periode}</span></td>
                    <td className="px-5 py-4"><span className="font-semibold text-gray-800">{nominal != null ? fmt(nominal) : '—'}</span></td>
                    <td className="px-5 py-4 text-gray-500">{fmtDate(p.tanggal_pembayaran)}</td>
                    <td className="px-5 py-4">
                      {p.bukti_pembayaran ? (
                        <button
                          type="button"
                          onClick={() => setProofModal({ url: p.bukti_pembayaran, name: pl?.nama_lengkap ?? '' })}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-purple/30 px-2.5 py-1 text-xs font-semibold text-brand-purple transition hover:bg-brand-purple/5"
                        >
                          <ImageIcon size={11} />
                          Lihat
                        </button>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={p.status_verifikasi} /></td>
                    {/* ── Kolom Invoice ── */}
                    <td className="px-5 py-4">
                      {p.status_verifikasi === 'diterima' ? (
                        <InvoiceButton
                          pembayaranId={p.id}
                          invoiceId={inv?.id ?? null}
                          invoicePdfUrl={inv?.pdf_url ?? null}
                          variant="admin"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <VerificationActions
                        pembayaran={p}
                        onViewProof={(url, name) => setProofModal({ url, name })}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="divide-y divide-gray-100 lg:hidden">
          {rows.map((p) => {
            const pl     = getPembayaranPelanggan(p)
            const periode= p.tagihan ? `${BULAN[p.tagihan.bulan - 1]} ${p.tagihan.tahun}` : p.tagihan_instalasi ? 'Instalasi' : '—'
            const nominal= p.tagihan?.jumlah_tagihan ?? p.tagihan_instalasi?.jumlah_tagihan
            const inv    = invoiceMap[p.id]
            return (
              <div key={p.id} className="flex items-start gap-3 px-4 py-4">
                <Avatar name={pl?.nama_lengkap ?? '?'} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="truncate font-medium text-gray-900">{pl?.nama_lengkap ?? '—'}</p>
                      <p className="text-xs text-gray-400">{pl?.no_hp ?? ''}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {periode}{nominal != null ? ` · ${fmt(nominal)}` : ''}
                      </p>
                    </div>
                    <VerificationActions pembayaran={p} onViewProof={(url, name) => setProofModal({ url, name })} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={p.status_verifikasi} />
                    {p.status_verifikasi === 'diterima' ? (
                      <InvoiceButton
                        pembayaranId={p.id}
                        invoiceId={inv?.id ?? null}
                        invoicePdfUrl={inv?.pdf_url ?? null}
                        variant="admin"
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
            <p className="text-xs text-gray-500">
              Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} dari {total} pembayaran
            </p>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => goToPage(page - 1)} disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`dots-${i}`} className="px-1 text-xs text-gray-400">…</span>
                  ) : (
                    <button key={p} type="button" onClick={() => goToPage(p as number)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition ${p === page ? 'bg-brand-purple text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {p}
                    </button>
                  ),
                )}
              <button type="button" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:opacity-40">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-gray-100 px-6 py-3">
            <p className="text-xs text-gray-400">Total {total} pembayaran</p>
          </div>
        )}
      </div>
    </>
  )
}