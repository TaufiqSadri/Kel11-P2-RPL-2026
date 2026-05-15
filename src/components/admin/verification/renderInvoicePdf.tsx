import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
} from '@react-pdf/renderer'
import type { InvoiceDetail } from '../../../lib/invoice/types'

const BULAN = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
]

const fmt = (n: number) =>
  'Rp ' + n.toLocaleString('id-ID')

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

const fmtTime = (d: string) => {
  const date = new Date(d)

  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')

  return `${hh}:${mm}:${ss} WIB`
}
  
// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page          : { fontFamily: 'Helvetica', backgroundColor: '#ffffff', padding: 40 },
  header        : { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  brand         : { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#68247B' },
  brandSub      : { fontSize: 9, color: '#888', marginTop: 3 },
  invLabel      : { fontSize: 9, color: '#888', textAlign: 'right' },
  invNumber     : { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#1a0a2e', textAlign: 'right', marginTop: 2 },
  invDate       : { fontSize: 9, color: '#555', textAlign: 'right', marginTop: 2 },
  divider       : { height: 1.5, backgroundColor: '#68247B', marginBottom: 20 },
  dividerThin   : { height: 0.5, backgroundColor: '#e5e7eb', marginVertical: 10 },
  sectionTitle  : { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#68247B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  row           : { flexDirection: 'row', marginBottom: 4 },
  label         : { fontSize: 10, color: '#6b7280', width: 130 },
  value         : { fontSize: 10, color: '#1a0a2e', flex: 1 },
  valueBold     : { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1a0a2e', flex: 1 },
  tableHeader   : { flexDirection: 'row', backgroundColor: '#f3f0f9', padding: '8 10', borderRadius: 4, marginBottom: 4 },
  tableHeaderTxt: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#68247B' },
  tableRow      : { flexDirection: 'row', padding: '7 10', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  tableCell     : { fontSize: 10, color: '#374151' },
  totalRow      : { flexDirection: 'row', padding: '10 10', backgroundColor: '#f9f7ff', borderRadius: 4, marginTop: 6 },
  totalLabel    : { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1a0a2e', flex: 1 },
  totalValue    : { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#68247B' },
  badge         : { backgroundColor: '#d1fae5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 18 },
  badgeTxt      : { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#065f46' },
  footer        : { borderTopWidth: 0.5, borderTopColor: '#e5e7eb', marginTop: 30, paddingTop: 14 },
  footerTxt     : { fontSize: 8, color: '#9ca3af', textAlign: 'center' },
})

// ── Komponen PDF ───────────────────────────────────────────────────────────────
function InvoiceDocument({ detail }: { detail: InvoiceDetail }) {
  const { invoice, pelanggan, pembayaran, tagihan, tagihan_instalasi } = detail
  const isInstallation = invoice.invoice_type === 'installation'

  const periodeLabel = isInstallation
    ? 'Biaya Instalasi Perangkat'
    : tagihan
      ? `${BULAN[tagihan.bulan - 1]} ${tagihan.tahun}`
      : '-'

  const nominal = isInstallation
    ? tagihan_instalasi?.jumlah_tagihan ?? pembayaran.jumlah_bayar
    : tagihan?.jumlah_tagihan ?? pembayaran.jumlah_bayar

  return (
    <Document
      title={`Invoice ${invoice.invoice_number}`}
      author="Distric Net"
      subject="Invoice Pembayaran"
    >
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.brand}>Distric Net</Text>
            <Text style={s.brandSub}>Penyedia Internet Broadband Unlimited</Text>
            <Text style={s.brandSub}>Kab. Padang Pariaman, Sumatera Barat</Text>
            <Text style={s.brandSub}>+62 812 5600 2100  ·  @distric_net</Text>
          </View>
          <View>
            <Text style={s.invLabel}>INVOICE</Text>
            <Text style={s.invNumber}>{invoice.invoice_number}</Text>
            <Text style={s.invDate}>Tanggal: {fmtDate(invoice.generated_at)}</Text>
            <Text style={s.invDate}>Waktu: {fmtTime(invoice.generated_at)}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* ── Badge Lunas ── */}
        <View style={s.badge}>
          <Text style={s.badgeTxt}>✓  LUNAS / TERBAYAR</Text>
        </View>

        {/* ── Informasi Pelanggan ── */}
        <Text style={s.sectionTitle}>Informasi Pelanggan</Text>
        <View style={s.row}>
          <Text style={s.label}>Nama</Text>
          <Text style={s.valueBold}>{pelanggan.nama_lengkap}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Email</Text>
          <Text style={s.value}>{pelanggan.email}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>No. HP</Text>
          <Text style={s.value}>{pelanggan.no_hp}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Alamat Pemasangan</Text>
          <Text style={s.value}>{pelanggan.alamat_pemasangan}</Text>
        </View>

        <View style={s.dividerThin} />

        {/* ── Detail Pembayaran ── */}
        <Text style={[s.sectionTitle, { marginTop: 8 }]}>Detail Pembayaran</Text>

        {/* Table header */}
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderTxt, { flex: 2 }]}>Keterangan</Text>
          <Text style={[s.tableHeaderTxt, { flex: 1, textAlign: 'right' }]}>Jumlah</Text>
        </View>

        {/* Table row */}
        <View style={s.tableRow}>
          <View style={{ flex: 2 }}>
            <Text style={s.tableCell}>
              {isInstallation ? 'Biaya Instalasi Perangkat' : `Tagihan Bulanan — ${periodeLabel}`}
            </Text>
            <Text style={{ fontSize: 8, color: '#9ca3af', marginTop: 2 }}>
              {isInstallation ? 'Biaya pemasangan perangkat internet' : 'Layanan internet rumah'}
            </Text>
          </View>
          <Text style={[s.tableCell, { flex: 1, textAlign: 'right' }]}>
            {fmt(nominal)}
          </Text>
        </View>

        {/* Total */}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Total Dibayar</Text>
          <Text style={s.totalValue}>{fmt(pembayaran.jumlah_bayar)}</Text>
        </View>

        <View style={s.dividerThin} />

        {/* ── Informasi Transaksi ── */}
        <Text style={[s.sectionTitle, { marginTop: 10 }]}>Informasi Transaksi</Text>
        <View style={s.row}>
          <Text style={s.label}>Tanggal Bayar</Text>
          <Text style={s.value}>{fmtDate(pembayaran.tanggal_pembayaran)}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Metode Pembayaran</Text>
          <Text style={s.value}>QRIS / Transfer</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Status</Text>
          <Text style={[s.valueBold, { color: '#059669' }]}>Diterima / Lunas</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>No. Referensi</Text>
          <Text style={s.value}>{invoice.invoice_number}</Text>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Text style={s.footerTxt}>
            Terima kasih telah menggunakan layanan Distric Net.
          </Text>
          <Text style={[s.footerTxt, { marginTop: 3 }]}>
            Dokumen ini digenerate secara otomatis dan sah tanpa tanda tangan.
          </Text>
          <Text style={[s.footerTxt, { marginTop: 3 }]}>
            Pertanyaan? Hubungi kami di +62 812 5600 2100 atau @distric_net
          </Text>
        </View>
      </Page>
    </Document>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────
export async function renderInvoicePdf(detail: InvoiceDetail): Promise<Buffer> {
  const element = React.createElement(InvoiceDocument, { detail })
  return await renderToBuffer(element as any)
}