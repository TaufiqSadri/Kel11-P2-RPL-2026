import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { syncSuspendedPelangganStatuses } from '@/lib/data/pelangganStatus'

export const runtime = 'nodejs'

const bulanNama = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
const TAGIHAN_STATUSES = ['belum_bayar', 'menunggu_verifikasi', 'lunas']
const PELANGGAN_STATUSES = ['aktif', 'ditangguhkan', 'pending', 'nonaktif']
const PEMBAYARAN_STATUSES = ['menunggu', 'diterima', 'ditolak']

type ExcelValue = string | number | boolean | null | undefined

function parseMonth(value: string | null) {
  const month = Number(value)
  return Number.isInteger(month) && month >= 1 && month <= 12 ? month : null
}

function parseYear(value: string | null) {
  const year = Number(value)
  return Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : null
}

function isTagihanStatus(status: string | null) {
  return !!status && TAGIHAN_STATUSES.includes(status)
}

function getDateRange(month: number | null, year: number | null) {
  if (!year) return null

  const startMonth = month ? month - 1 : 0
  const start = new Date(Date.UTC(year, startMonth, 1))
  const end = month
    ? new Date(Date.UTC(year, startMonth + 1, 1))
    : new Date(Date.UTC(year + 1, 0, 1))

  return {
    from: start.toISOString(),
    to: end.toISOString(),
  }
}

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

function formatDate(value: string | null | undefined) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('id-ID')
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('id-ID')
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function colName(index: number) {
  let name = ''
  let n = index + 1
  while (n > 0) {
    const rem = (n - 1) % 26
    name = String.fromCharCode(65 + rem) + name
    n = Math.floor((n - 1) / 26)
  }
  return name
}

function sheetXml(headers: string[], rows: Record<string, ExcelValue>[]) {
  const allRows: ExcelValue[][] = [
    headers,
    ...rows.map((row) => headers.map((header) => row[header] ?? '')),
  ]
  const lastCell = `${colName(Math.max(headers.length - 1, 0))}${Math.max(allRows.length, 1)}`

  const body = allRows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, colIndex) => {
          const ref = `${colName(colIndex)}${rowIndex + 1}`
          if (typeof value === 'number' && Number.isFinite(value)) {
            return `<c r="${ref}"><v>${value}</v></c>`
          }
          return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(String(value ?? ''))}</t></is></c>`
        })
        .join('')
      return `<row r="${rowIndex + 1}">${cells}</row>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastCell}"/>
  <sheetData>${body}</sheetData>
</worksheet>`
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let c = index
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  return c >>> 0
})

function crc32(buffer: Buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function zip(files: { path: string; content: string }[]) {
  const localParts: Buffer[] = []
  const centralParts: Buffer[] = []
  let offset = 0

  for (const file of files) {
    const name = Buffer.from(file.path)
    const data = Buffer.from(file.content, 'utf8')
    const crc = crc32(data)

    const localHeader = Buffer.alloc(30)
    localHeader.writeUInt32LE(0x04034b50, 0)
    localHeader.writeUInt16LE(20, 4)
    localHeader.writeUInt16LE(0, 6)
    localHeader.writeUInt16LE(0, 8)
    localHeader.writeUInt16LE(0, 10)
    localHeader.writeUInt16LE(0, 12)
    localHeader.writeUInt32LE(crc, 14)
    localHeader.writeUInt32LE(data.length, 18)
    localHeader.writeUInt32LE(data.length, 22)
    localHeader.writeUInt16LE(name.length, 26)
    localHeader.writeUInt16LE(0, 28)

    localParts.push(localHeader, name, data)

    const centralHeader = Buffer.alloc(46)
    centralHeader.writeUInt32LE(0x02014b50, 0)
    centralHeader.writeUInt16LE(20, 4)
    centralHeader.writeUInt16LE(20, 6)
    centralHeader.writeUInt16LE(0, 8)
    centralHeader.writeUInt16LE(0, 10)
    centralHeader.writeUInt16LE(0, 12)
    centralHeader.writeUInt16LE(0, 14)
    centralHeader.writeUInt32LE(crc, 16)
    centralHeader.writeUInt32LE(data.length, 20)
    centralHeader.writeUInt32LE(data.length, 24)
    centralHeader.writeUInt16LE(name.length, 28)
    centralHeader.writeUInt16LE(0, 30)
    centralHeader.writeUInt16LE(0, 32)
    centralHeader.writeUInt16LE(0, 34)
    centralHeader.writeUInt16LE(0, 36)
    centralHeader.writeUInt32LE(0, 38)
    centralHeader.writeUInt32LE(offset, 42)
    centralParts.push(centralHeader, name)

    offset += localHeader.length + name.length + data.length
  }

  const centralDir = Buffer.concat(centralParts)
  const localDir = Buffer.concat(localParts)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(files.length, 8)
  end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(centralDir.length, 12)
  end.writeUInt32LE(localDir.length, 16)
  end.writeUInt16LE(0, 20)

  return Buffer.concat([localDir, centralDir, end])
}

function toXlsx(headers: string[], rows: Record<string, ExcelValue>[], sheetName: string) {
  const safeSheetName = escapeXml(sheetName.slice(0, 31) || 'Laporan')
  return zip([
    {
      path: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,
    },
    {
      path: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      path: 'xl/workbook.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="${safeSheetName}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
    },
    {
      path: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`,
    },
    {
      path: 'xl/worksheets/sheet1.xml',
      content: sheetXml(headers, rows),
    },
  ])
}

function applyDateRange<T extends {
  gte: (column: string, value: unknown) => T
  lt: (column: string, value: unknown) => T
}>(query: T, column: string, month: number | null, year: number | null) {
  const range = getDateRange(month, year)
  if (!range) return query
  return query.gte(column, range.from).lt(column, range.to)
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'tagihan'
  const month = parseMonth(searchParams.get('bulan'))
  const year = parseYear(searchParams.get('tahun'))
  const status = searchParams.get('status')
  const admin = createAdminClient()
  await syncSuspendedPelangganStatuses()

  let headers: string[] = []
  let rows: Record<string, ExcelValue>[] = []
  let sheetName = 'Laporan'

  if (type === 'pelanggan') {
    headers = ['Nama', 'Email', 'No HP', 'Paket', 'Kecepatan Mbps', 'Status', 'Tanggal Bergabung', 'Alamat']
    sheetName = 'Pelanggan'
    let query = admin
      .from('pelanggan')
      .select('*, paket_internet(nama_paket, kecepatan_mbps, harga)')
      .order('created_at', { ascending: false })

    if (status && PELANGGAN_STATUSES.includes(status)) query = query.eq('status_langganan', status)
    query = applyDateRange(query, 'tanggal_bergabung', month, year)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    rows = (data ?? []).map((item: any) => {
      const paket = first(item.paket_internet)
      return {
        Nama: item.nama_lengkap,
        Email: item.email,
        'No HP': item.no_hp,
        Paket: paket?.nama_paket ?? '',
        'Kecepatan Mbps': paket?.kecepatan_mbps ?? '',
        Status: item.status_langganan,
        'Tanggal Bergabung': formatDate(item.tanggal_bergabung),
        Alamat: item.alamat_pemasangan,
      }
    })
  } else if (type === 'pembayaran') {
    headers = ['Tanggal Bayar', 'Nama Pelanggan', 'Email', 'Periode', 'Jumlah Bayar', 'Status Verifikasi', 'Status Tagihan', 'Bukti Pembayaran', 'Catatan Admin']
    sheetName = 'Pembayaran'
    const hasTagihanFilter = !!month || !!year || isTagihanStatus(status)
    let query = hasTagihanFilter
      ? admin
          .from('pembayaran')
          .select(`
            *,
            tagihan:tagihan_id!inner (
              bulan,
              tahun,
              status_tagihan,
              pelanggan:pelanggan_id ( nama_lengkap, email, no_hp )
            )
          `)
      : admin
          .from('pembayaran')
          .select(`
            *,
            tagihan:tagihan_id (
              bulan,
              tahun,
              status_tagihan,
              pelanggan:pelanggan_id ( nama_lengkap, email, no_hp )
            ),
            tagihan_instalasi:tagihan_instalasi_id (
              status_tagihan,
              pelanggan:pelanggan_id ( nama_lengkap, email, no_hp )
            )
          `)

    if (month) query = query.eq('tagihan.bulan', month)
    if (year) query = query.eq('tagihan.tahun', year)
    if (isTagihanStatus(status)) query = query.eq('tagihan.status_tagihan', status)
    if (status && PEMBAYARAN_STATUSES.includes(status)) query = query.eq('status_verifikasi', status)
    query = query.order('tanggal_pembayaran', { ascending: false })

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    rows = (data ?? []).map((item: any) => {
      const tagihan = first(item.tagihan)
      const instalasi = first(item.tagihan_instalasi)
      const pelanggan = first(tagihan?.pelanggan) ?? first(instalasi?.pelanggan)
      const periode = tagihan ? `${bulanNama[tagihan.bulan - 1]} ${tagihan.tahun}` : 'Instalasi'
      return {
        'Tanggal Bayar': formatDateTime(item.tanggal_pembayaran),
        'Nama Pelanggan': pelanggan?.nama_lengkap ?? '',
        Email: pelanggan?.email ?? '',
        Periode: periode,
        'Jumlah Bayar': Number(item.jumlah_bayar ?? 0),
        'Status Verifikasi': item.status_verifikasi,
        'Status Tagihan': tagihan?.status_tagihan ?? instalasi?.status_tagihan ?? '',
        'Bukti Pembayaran': item.bukti_pembayaran ?? '',
        'Catatan Admin': item.catatan_admin ?? '',
      }
    })
  } else if (type === 'komplain') {
    headers = ['Tanggal', 'Nama Pelanggan', 'Email', 'Isi Komplain', 'Status', 'Respon Admin']
    sheetName = 'Komplain'
    let query = admin
      .from('komplain')
      .select('*, pelanggan(nama_lengkap, email)')
      .order('tanggal', { ascending: false })

    if (status === 'menunggu') query = query.eq('status', false)
    if (status === 'selesai') query = query.eq('status', true)
    query = applyDateRange(query, 'tanggal', month, year)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    rows = (data ?? []).map((item: any) => {
      const pelanggan = first(item.pelanggan)
      return {
        Tanggal: formatDateTime(item.tanggal ?? item.created_at),
        'Nama Pelanggan': pelanggan?.nama_lengkap ?? '',
        Email: pelanggan?.email ?? '',
        'Isi Komplain': item.isi_komplain,
        Status: item.status ? 'Selesai' : 'Menunggu',
        'Respon Admin': item.respon_admin ?? '',
      }
    })
  } else {
    headers = ['Periode', 'Nama Pelanggan', 'Email', 'No HP', 'Jumlah Tagihan', 'Status', 'Jatuh Tempo', 'Tanggal Dibuat']
    sheetName = 'Tagihan'
    let query = admin
      .from('tagihan')
      .select('*, pelanggan(nama_lengkap, email, no_hp)')
      .order('tahun', { ascending: false })
      .order('bulan', { ascending: false })

    if (month) query = query.eq('bulan', month)
    if (year) query = query.eq('tahun', year)
    if (isTagihanStatus(status)) query = query.eq('status_tagihan', status)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    rows = (data ?? []).map((item: any) => {
      const pelanggan = first(item.pelanggan)
      return {
        Periode: `${bulanNama[item.bulan - 1]} ${item.tahun}`,
        'Nama Pelanggan': pelanggan?.nama_lengkap ?? '',
        Email: pelanggan?.email ?? '',
        'No HP': pelanggan?.no_hp ?? '',
        'Jumlah Tagihan': Number(item.jumlah_tagihan ?? 0),
        Status: item.status_tagihan,
        'Jatuh Tempo': formatDate(item.jatuh_tempo),
        'Tanggal Dibuat': formatDateTime(item.created_at),
      }
    })
  }

  const file = toXlsx(headers, rows, sheetName)
  const suffix = [
    year ? String(year) : null,
    month ? String(month).padStart(2, '0') : null,
    status && status !== 'semua' ? status : null,
  ].filter(Boolean).join('-')
  const filename = `laporan-${type}${suffix ? `-${suffix}` : ''}.xlsx`

  return new NextResponse(file, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
