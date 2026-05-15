'use client'

import { useState } from 'react'
import { Download, FileText, Loader2 } from 'lucide-react'

interface InvoiceButtonProps {
  pembayaranId  : string
  invoicePdfUrl : string | null
  /** Jika sudah ada invoice record tapi pdf belum ada */
  invoiceId     : string | null
  variant       : 'customer' | 'admin'
}

export default function InvoiceButton({
  pembayaranId,
  invoicePdfUrl,
  invoiceId,
  variant,
}: InvoiceButtonProps) {
  const [loading, setLoading] = useState(false)
  const [pdfUrl,  setPdfUrl]  = useState(invoicePdfUrl)
  const [error,   setError]   = useState('')

  async function handleGenerate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/invoice/generate', {
        method  : 'POST',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify({ pembayaran_id: pembayaranId }),
      })
      const data = await res.json() as { invoice?: { pdf_url?: string }; error?: string }
      if (!res.ok || data.error) throw new Error(data.error ?? 'Gagal generate invoice.')
      if (data.invoice?.pdf_url) {
        setPdfUrl(data.invoice.pdf_url)
        window.open(data.invoice.pdf_url, '_blank', 'noopener,noreferrer')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  // ── Jika PDF sudah ada ──────────────────────────────────────────────────────
  if (pdfUrl) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition
            ${variant === 'admin'
              ? 'border-brand-purple/30 text-brand-purple hover:bg-brand-purple/5'
              : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
            }`}
        >
          <FileText size={12} />
          Lihat Invoice
        </a>
        <a
          href={pdfUrl}
          download
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
        >
          <Download size={12} />
          Unduh
        </a>
      </div>
    )
  }

  // ── Belum ada PDF ───────────────────────────────────────────────────────────
  if (variant === 'admin') {
    return (
      <div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-purple/30 px-3 py-1.5 text-xs font-semibold text-brand-purple transition hover:bg-brand-purple/5 disabled:opacity-50"
        >
          {loading
            ? <Loader2 size={12} className="animate-spin" />
            : <FileText size={12} />}
          {loading ? 'Membuat...' : 'Generate Invoice'}
        </button>
        {error ? (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        ) : null}
      </div>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-400">
      <FileText size={11} />
      Invoice belum tersedia
    </span>
  )
}