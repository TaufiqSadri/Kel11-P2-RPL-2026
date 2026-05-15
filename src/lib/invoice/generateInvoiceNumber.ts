import { createAdminClient } from '@/lib/supabase/admin'

export async function generateInvoiceNumber(date: Date = new Date()): Promise<string> {
      const admin = createAdminClient()
      
      const year  = date.getUTCFullYear()
      const month = String(date.getUTCMonth() + 1).padStart(2, '0')
      const day   = String(date.getUTCDate()).padStart(2, '0')
      const prefix = `INV-${year}${month}${day}-`
      
      // Hitung berapa invoice sudah dibuat hari ini
      const { count, error } = await admin
            .from('invoice')
            .select('*', { count: 'exact', head: true })
            .like('invoice_number', `${prefix}%`)
      
      if (error) throw new Error(`Gagal query invoice: ${error.message}`)
      
      const seq    = (count ?? 0) + 1
      const seqStr = String(seq).padStart(3, '0')
      
      return `${prefix}${seqStr}`
}