'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { generateInvoiceNumber }  from './generateInvoiceNumber'
import type { Invoice, InvoiceDetail, InvoiceType } from './types'

// ── Fetch InvoiceDetail (join lengkap) ────────────────────────────────────────

export async function getInvoiceDetail(
  invoiceId: string,
): Promise<InvoiceDetail | null> {
  const admin = createAdminClient()

  const { data: inv, error } = await admin
    .from('invoice')
    .select(`
      *,
      pembayaran:pembayaran_id (
        tanggal_pembayaran,
        jumlah_bayar,
        status_verifikasi,
        tagihan:tagihan_id (
          bulan,
          tahun,
          jumlah_tagihan,
          pelanggan:pelanggan_id (
            nama_lengkap, email, no_hp, alamat_pemasangan
          )
        ),
        tagihan_instalasi:tagihan_instalasi_id (
          jumlah_tagihan,
          jatuh_tempo,
          pelanggan:pelanggan_id (
            nama_lengkap, email, no_hp, alamat_pemasangan
          )
        )
      )
    `)
    .eq('id', invoiceId)
    .single()

  if (error || !inv) return null

  const p   = (inv as any).pembayaran
  const t   = p?.tagihan
  const ti  = p?.tagihan_instalasi
  const pl  = t?.pelanggan ?? ti?.pelanggan

  if (!pl) return null

  return {
    invoice   : inv as unknown as Invoice,
    pelanggan : pl,
    pembayaran: {
      tanggal_pembayaran : p.tanggal_pembayaran,
      jumlah_bayar       : p.jumlah_bayar,
      status_verifikasi  : p.status_verifikasi,
    },
    tagihan            : t  ?? null,
    tagihan_instalasi  : ti ?? null,
  }
}

// ── Fetch by pembayaran_id ────────────────────────────────────────────────────

export async function getInvoiceByPembayaran(
  pembayaranId: string,
): Promise<Invoice | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('invoice')
    .select('*')
    .eq('pembayaran_id', pembayaranId)
    .maybeSingle()
  return (data as Invoice | null) ?? null
}

// ── Generate / upsert invoice ─────────────────────────────────────────────────

export async function generateInvoice(pembayaranId: string): Promise<{
  invoice?: Invoice
  error?: string
}> {
  const admin = createAdminClient()

  const { data: pembayaran, error: pErr } = await admin
    .from('pembayaran')
    .select('id, tagihan_id, tagihan_instalasi_id, status_verifikasi')
    .eq('id', pembayaranId)
    .single()

  if (pErr || !pembayaran) {
    return { error: 'Pembayaran tidak ditemukan.' }
  }

  if (pembayaran.status_verifikasi !== 'diterima') {
    return { error: 'Invoice hanya dapat dibuat untuk pembayaran yang sudah diterima.' }
  }

  const existing = await getInvoiceByPembayaran(pembayaranId)
  if (existing) return { invoice: existing }

  const invoiceType: InvoiceType =
    pembayaran.tagihan_instalasi_id ? 'installation' : 'monthly'

  const invoiceNumber = await generateInvoiceNumber()

  const { data: newInvoice, error: insertErr } = await admin
    .from('invoice')
    .insert({
      pembayaran_id  : pembayaranId,
      invoice_number : invoiceNumber,
      invoice_type   : invoiceType,
    })
    .select()
    .single()

  if (insertErr || !newInvoice) {
    return { error: insertErr?.message ?? 'Gagal membuat invoice.' }
  }

  return { invoice: newInvoice as Invoice }
}

// ── Update pdf_url setelah upload ─────────────────────────────────────────────

export async function updateInvoicePdfUrl(
  invoiceId: string,
  pdfUrl: string,
): Promise<void> {
  const admin = createAdminClient()
  await admin
    .from('invoice')
    .update({ pdf_url: pdfUrl })
    .eq('id', invoiceId)
}