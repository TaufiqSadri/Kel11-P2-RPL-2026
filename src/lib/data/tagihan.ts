import { createAdminClient } from '@/lib/supabase/admin'

export type TagihanStatus = 'belum_bayar' | 'menunggu_verifikasi' | 'lunas' | 'overdue'

export interface TagihanWithRelations {
  id: string
  pelanggan_id: string
  bulan: number
  tahun: number
  jumlah_tagihan: number
  status_tagihan: TagihanStatus
  jatuh_tempo: string
  created_at: string
  pelanggan: {
    id: string
    nama_lengkap: string
    email: string
    no_hp: string
    paket_id: string | null
  } | null
  pembayaran: Array<{
    id: string
    tagihan_id: string
    bukti_pembayaran: string | null
    status_verifikasi: string
    tanggal_pembayaran: string | null
    created_at: string
  }>
}

export interface TagihanStats {
  total: number
  belum_bayar: number
  menunggu_verifikasi: number
  lunas: number
  overdue: number
}

export interface TagihanListResult {
  data: TagihanWithRelations[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface TagihanInstalasiWithRelations {
  id: string
  pelanggan_id: string
  jumlah_tagihan: number
  status_tagihan: TagihanStatus
  jatuh_tempo: string
  created_at: string
  pelanggan: {
    id: string
    nama_lengkap: string
    email: string
    no_hp: string
    paket_id: string | null
  } | null
  pembayaran: Array<{
    id: string
    bukti_pembayaran: string | null
    status_verifikasi: string
    tanggal_pembayaran: string | null
    created_at: string
  }>
}

export interface TagihanInstalasiListResult {
  data: TagihanInstalasiWithRelations[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function isOverdue(tagihan: {
  jatuh_tempo: string | null
  status_tagihan: string
}) {
  if (!tagihan.jatuh_tempo) return false
  const dueDate = new Date(tagihan.jatuh_tempo)
  dueDate.setHours(23, 59, 59, 999)
  return tagihan.status_tagihan !== 'lunas' && dueDate.getTime() < Date.now()
}

function normalizeStatus(tagihan: {
  jatuh_tempo: string | null
  status_tagihan: string
}): TagihanStatus {
  if (isOverdue(tagihan)) return 'overdue'
  if (tagihan.status_tagihan === 'belum_bayar') return 'belum_bayar'
  if (tagihan.status_tagihan === 'menunggu_verifikasi') return 'menunggu_verifikasi'
  return 'lunas'
}

export async function getTagihanStats(): Promise<TagihanStats> {
  const admin = createAdminClient()
  const now = new Date().toISOString()

  // Semua count-only paralel — tidak fetch rows sama sekali, jauh lebih ringan
  const [total, belumBayar, menunggu, lunas, overdue] = await Promise.all([
    admin
      .from('tagihan')
      .select('*', { count: 'exact', head: true }),
    // Belum bayar = status belum_bayar DAN belum melewati jatuh tempo
    admin
      .from('tagihan')
      .select('*', { count: 'exact', head: true })
      .eq('status_tagihan', 'belum_bayar')
      .gt('jatuh_tempo', now),
    admin
      .from('tagihan')
      .select('*', { count: 'exact', head: true })
      .eq('status_tagihan', 'menunggu_verifikasi'),
    admin
      .from('tagihan')
      .select('*', { count: 'exact', head: true })
      .eq('status_tagihan', 'lunas'),
    // Overdue = belum lunas DAN sudah melewati jatuh tempo
    admin
      .from('tagihan')
      .select('*', { count: 'exact', head: true })
      .neq('status_tagihan', 'lunas')
      .lt('jatuh_tempo', now),
  ])

  return {
    total: total.count ?? 0,
    belum_bayar: belumBayar.count ?? 0,
    menunggu_verifikasi: menunggu.count ?? 0,
    lunas: lunas.count ?? 0,
    overdue: overdue.count ?? 0,
  }
}

export async function getTagihanInstalasiStats(): Promise<TagihanStats> {
  const admin = createAdminClient()
  const now = new Date().toISOString()

  const [total, belumBayar, menunggu, lunas, overdue] = await Promise.all([
    admin.from('tagihan_instalasi').select('*', { count: 'exact', head: true }),
    admin
      .from('tagihan_instalasi')
      .select('*', { count: 'exact', head: true })
      .eq('status_tagihan', 'belum_bayar')
      .gt('jatuh_tempo', now),
    admin
      .from('tagihan_instalasi')
      .select('*', { count: 'exact', head: true })
      .eq('status_tagihan', 'menunggu_verifikasi'),
    admin.from('tagihan_instalasi').select('*', { count: 'exact', head: true }).eq('status_tagihan', 'lunas'),
    admin
      .from('tagihan_instalasi')
      .select('*', { count: 'exact', head: true })
      .neq('status_tagihan', 'lunas')
      .lt('jatuh_tempo', now),
  ])

  return {
    total: total.count ?? 0,
    belum_bayar: belumBayar.count ?? 0,
    menunggu_verifikasi: menunggu.count ?? 0,
    lunas: lunas.count ?? 0,
    overdue: overdue.count ?? 0,
  }
}

export async function getAllTagihan({
  search = '',
  pelangganId,
  bulan = 'semua',
  tahun = 'semua',
  status = 'semua',
  sort = 'terbaru',
  page = 1,
  pageSize = 10,
}: {
  search?: string
  pelangganId?: string
  bulan?: string
  tahun?: string
  status?: TagihanStatus | 'semua'
  sort?: 'terbaru' | 'terlama'
  page?: number
  pageSize?: number
} = {}): Promise<TagihanListResult> {
  const admin = createAdminClient()
  const empty = { data: [], total: 0, page, pageSize, totalPages: 0 }

  // Resolve filter pelanggan
  let pelangganIds: string[] | null = null
  if (pelangganId) {
    pelangganIds = [pelangganId]
  } else if (search.trim()) {
    const { data: matched, error: searchErr } = await admin
      .from('pelanggan')
      .select('id')
      .ilike('nama_lengkap', `%${search}%`)

    if (searchErr) {
      console.error('getAllTagihan search error:', searchErr)
      return empty
    }

    pelangganIds = (matched ?? []).map((p) => p.id)
    if (pelangganIds.length === 0) return empty
  }

  // Satu query dengan JOIN ke pelanggan dan pembayaran sekaligus
  let baseQuery = admin.from('tagihan').select(
    `
    *,
    pelanggan:pelanggan_id (
      id,
      nama_lengkap,
      email,
      no_hp,
      paket_id
    ),
    pembayaran (
      id,
      tagihan_id,
      bukti_pembayaran,
      status_verifikasi,
      tanggal_pembayaran,
      created_at
    )
  `,
    { count: 'exact' },
  )

  if (pelangganIds) baseQuery = baseQuery.in('pelanggan_id', pelangganIds)
  if (bulan !== 'semua') baseQuery = baseQuery.eq('bulan', Number(bulan))
  if (tahun !== 'semua') baseQuery = baseQuery.eq('tahun', Number(tahun))

  // Filter status di DB kalau bukan overdue (overdue butuh kalkulasi tanggal)
  if (status === 'belum_bayar') {
    baseQuery = baseQuery.eq('status_tagihan', 'belum_bayar')
  } else if (status === 'menunggu_verifikasi') {
    baseQuery = baseQuery.eq('status_tagihan', 'menunggu_verifikasi')
  } else if (status === 'lunas') {
    baseQuery = baseQuery.eq('status_tagihan', 'lunas')
  }

  baseQuery = baseQuery
    .order('tahun', { ascending: sort === 'terlama' })
    .order('bulan', { ascending: sort === 'terlama' })
    .order('created_at', { ascending: sort === 'terlama' })

  // Untuk filter overdue, tidak bisa paginate di DB, harus ambil semua dulu
  // Untuk status lain, paginate langsung di DB
  if (status !== 'overdue') {
    baseQuery = baseQuery.range((page - 1) * pageSize, page * pageSize - 1)
  }

  const { data: allRows, count, error: tagihanErr } = await baseQuery

  if (tagihanErr) {
    console.error('getAllTagihan tagihan error:', tagihanErr)
    return empty
  }

  let rows = (allRows ?? []).map((row) => ({
    ...row,
    status_tagihan: normalizeStatus(row),
    pelanggan: (row as any).pelanggan ?? null,
    pembayaran: (row as any).pembayaran ?? [],
  })) as TagihanWithRelations[]

  // Filter overdue dilakukan setelah normalize status
  if (status === 'overdue') {
    rows = rows.filter((row) => row.status_tagihan === 'overdue')
    const total = rows.length
    const paginatedRows = rows.slice((page - 1) * pageSize, page * pageSize)
    return {
      data: paginatedRows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  return {
    data: rows,
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getAllTagihanInstalasi({
  search = '',
  pelangganId,
  status = 'semua',
  sort = 'terbaru',
  page = 1,
  pageSize = 10,
}: {
  search?: string
  pelangganId?: string
  status?: TagihanStatus | 'semua'
  sort?: 'terbaru' | 'terlama'
  page?: number
  pageSize?: number
} = {}): Promise<TagihanInstalasiListResult> {
  const admin = createAdminClient()
  const empty: TagihanInstalasiListResult = { data: [], total: 0, page, pageSize, totalPages: 0 }

  let pelangganIds: string[] | null = null
  if (pelangganId) {
    pelangganIds = [pelangganId]
  } else if (search.trim()) {
    const { data: matched, error: searchErr } = await admin
      .from('pelanggan')
      .select('id')
      .ilike('nama_lengkap', `%${search}%`)

    if (searchErr) {
      console.error('getAllTagihanInstalasi search error:', searchErr)
      return empty
    }

    pelangganIds = (matched ?? []).map((p) => p.id)
    if (pelangganIds.length === 0) return empty
  }

  let baseQuery = admin.from('tagihan_instalasi').select(
    `
    *,
    pelanggan:pelanggan_id (
      id,
      nama_lengkap,
      email,
      no_hp,
      paket_id
    ),
    pembayaran (
      id,
      bukti_pembayaran,
      status_verifikasi,
      tanggal_pembayaran,
      created_at
    )
  `,
    { count: 'exact' },
  )

  if (pelangganIds) baseQuery = baseQuery.in('pelanggan_id', pelangganIds)

  if (status === 'belum_bayar') {
    baseQuery = baseQuery.eq('status_tagihan', 'belum_bayar')
  } else if (status === 'menunggu_verifikasi') {
    baseQuery = baseQuery.eq('status_tagihan', 'menunggu_verifikasi')
  } else if (status === 'lunas') {
    baseQuery = baseQuery.eq('status_tagihan', 'lunas')
  }

  baseQuery = baseQuery.order('created_at', { ascending: sort === 'terlama' })

  if (status !== 'overdue') {
    baseQuery = baseQuery.range((page - 1) * pageSize, page * pageSize - 1)
  }

  const { data: allRows, count, error } = await baseQuery

  if (error) {
    console.error('getAllTagihanInstalasi error:', error)
    return empty
  }

  let rows = (allRows ?? []).map((row) => ({
    ...row,
    status_tagihan: normalizeStatus(row),
    pelanggan: (row as any).pelanggan ?? null,
    pembayaran: (row as any).pembayaran ?? [],
  })) as TagihanInstalasiWithRelations[]

  if (status === 'overdue') {
    rows = rows.filter((row) => row.status_tagihan === 'overdue')
    const total = rows.length
    const paginatedRows = rows.slice((page - 1) * pageSize, page * pageSize)
    return {
      data: paginatedRows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  return {
    data: rows,
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getTagihanById(tagihanId: string): Promise<TagihanWithRelations | null> {
  const admin = createAdminClient()

  // Satu query dengan JOIN
  const { data: row, error } = await admin
    .from('tagihan')
    .select(
      `
      *,
      pelanggan:pelanggan_id (
        id,
        nama_lengkap,
        email,
        no_hp,
        paket_id
      ),
      pembayaran (
        id,
        tagihan_id,
        bukti_pembayaran,
        status_verifikasi,
        tanggal_pembayaran,
        created_at
      )
    `,
    )
    .eq('id', tagihanId)
    .order('created_at', { ascending: false, referencedTable: 'pembayaran' })
    .single()

  if (error || !row) return null

  return {
    ...row,
    status_tagihan: normalizeStatus(row),
    pelanggan: (row as any).pelanggan ?? null,
    pembayaran: (row as any).pembayaran ?? [],
  } as TagihanWithRelations
}

export async function searchTagihan(query: string): Promise<TagihanWithRelations[]> {
  const result = await getAllTagihan({ search: query, pageSize: 20 })
  return result.data
}

export async function markAsPaid(tagihanId: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('tagihan')
    .update({ status_tagihan: 'lunas' })
    .eq('id', tagihanId)
  if (error) throw new Error(error.message)
}

export async function markAsPaidInstalasi(instalasiId: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('tagihan_instalasi')
    .update({ status_tagihan: 'lunas' })
    .eq('id', instalasiId)
  if (error) throw new Error(error.message)
}

export async function deleteTagihanInstalasi(instalasiId: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('tagihan_instalasi').delete().eq('id', instalasiId)
  if (error) throw new Error(error.message)
}

export async function updateTagihanByAdmin({
  tagihanId,
  jumlahTagihan,
  jatuhTempo,
  statusTagihan,
}: {
  tagihanId: string
  jumlahTagihan: number
  jatuhTempo: string | null
  statusTagihan: 'belum_bayar' | 'menunggu_verifikasi' | 'lunas'
}) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('tagihan')
    .update({
      jumlah_tagihan: jumlahTagihan,
      jatuh_tempo: jatuhTempo,
      status_tagihan: statusTagihan,
    })
    .eq('id', tagihanId)

  if (error) throw new Error(error.message)
}

export async function deleteTagihan(tagihanId: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('tagihan').delete().eq('id', tagihanId)
  if (error) throw new Error(error.message)
}