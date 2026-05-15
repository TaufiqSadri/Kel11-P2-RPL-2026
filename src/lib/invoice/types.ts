export type InvoiceType = 'monthly' | 'installation'

export interface Invoice {
      id             : string
      pembayaran_id  : string
      invoice_number : string
      invoice_type   : InvoiceType
      generated_at   : string
      pdf_url        : string | null
      created_at     : string
}

// Data lengkap yang dipakai untuk render PDF
export interface InvoiceDetail {
      invoice: Invoice
      pelanggan: {
            nama_lengkap      : string
            email             : string
            no_hp             : string
            alamat_pemasangan : string
      }
      pembayaran: {
            tanggal_pembayaran : string
            jumlah_bayar       : number
            status_verifikasi  : string
      }
      tagihan?: {
            bulan          : number
            tahun          : number
            jumlah_tagihan : number
      } | null
      tagihan_instalasi?: {
            jumlah_tagihan : number
            jatuh_tempo    : string
      } | null
}