import { createAdminClient } from '@/lib/supabase/admin'
import VerificationTable from './verificationTable'
import type { PembayaranWithRelations } from '@/lib/data/pembayaran'

interface Props {
  rows      : PembayaranWithRelations[]
  total     : number
  page      : number
  pageSize  : number
  totalPages: number
}

export default async function VerificationTableWithInvoice(props: Props) {
  // Ambil invoice untuk semua pembayaran yang ditampilkan
  const admin = createAdminClient()
  const ids   = props.rows.map((r) => r.id)

  const invoiceMap: Record<string, { id: string; pdf_url: string | null }> = {}

  if (ids.length > 0) {
    const { data } = await admin
      .from('invoice')
      .select('id, pembayaran_id, pdf_url')
      .in('pembayaran_id', ids)

    for (const inv of data ?? []) {
      invoiceMap[inv.pembayaran_id] = { id: inv.id, pdf_url: inv.pdf_url }
    }
  }

  // Pass invoiceMap ke VerificationTable sebagai prop tambahan
  // (VerificationTable perlu diupdate untuk menerima invoiceMap)
  return <VerificationTable {...props} invoiceMap={invoiceMap} />
}