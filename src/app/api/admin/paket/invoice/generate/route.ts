import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateInvoice, getInvoiceDetail, updateInvoicePdfUrl } from '@/lib/invoice/invoiceService'
import { renderInvoicePdf } from '@/components/admin/verification/renderInvoicePdf'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  // ── Auth check ──────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  const body = await request.json().catch(() => null) as { pembayaran_id?: string } | null
  const pembayaranId = body?.pembayaran_id

  if (!pembayaranId) {
    return NextResponse.json({ error: 'pembayaran_id wajib diisi.' }, { status: 400 })
  }

  // ── Generate invoice record ─────────────────────────────────────────────────
  const { invoice, error } = await generateInvoice(pembayaranId)
  if (error || !invoice) {
    return NextResponse.json({ error: error ?? 'Gagal membuat invoice.' }, { status: 422 })
  }

  // ── Jika belum ada PDF, render dan upload ───────────────────────────────────
  if (!invoice.pdf_url) {
    const detail = await getInvoiceDetail(invoice.id)
    if (!detail) {
      return NextResponse.json({ error: 'Gagal mengambil detail invoice.' }, { status: 500 })
    }

    try {
      const pdfBuffer = await renderInvoicePdf(detail)
      const uploadedUrl = await uploadPdfToStorage(invoice.invoice_number, pdfBuffer)
      await updateInvoicePdfUrl(invoice.id, uploadedUrl)
      invoice.pdf_url = uploadedUrl
    } catch (e) {
      // Tetap return invoice meski PDF gagal
      console.error('PDF generation failed:', e)
    }
  }

  return NextResponse.json({ invoice })
}

// ── Helper: upload buffer ke Supabase Storage ─────────────────────────────────
async function uploadPdfToStorage(
  invoiceNumber: string,
  pdfBuffer: Buffer,
): Promise<string> {
  // Dynamic import agar kompatibel dengan Edge jika dibutuhkan di masa depan
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()

  const filePath = `invoice/${invoiceNumber}.pdf`

  const { error } = await admin.storage
    .from('invoices')
    .upload(filePath, pdfBuffer, {
      contentType : 'application/pdf',
      upsert      : true,
      cacheControl: '31536000', // 1 tahun
    })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = admin.storage.from('invoices').getPublicUrl(filePath)
  return data.publicUrl
}