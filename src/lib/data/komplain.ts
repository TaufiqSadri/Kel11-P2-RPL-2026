import { createAdminClient } from '@/lib/supabase/admin'

export interface KomplainWithPelanggan {
  id: string
  pelanggan_id: string | null
  tanggal: string | null
  isi_komplain: string
  status: boolean | null
  respon_admin: string | null
  created_at: string | null
  pelanggan: {
    id: string
    nama_lengkap: string
    email: string
    no_hp: string
  } | null
}

export interface KomplainListResult {
  data: KomplainWithPelanggan[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface KomplainStats {
  total: number
  menunggu: number
  selesai: number
  belumDirespons: number
}

export async function getKomplainStats(): Promise<KomplainStats> {
  const admin = createAdminClient()

  // Semua count-only paralel — tidak fetch rows sama sekali
  const [total, menunggu, selesai, belumDirespons] = await Promise.all([
    admin
      .from('komplain')
      .select('*', { count: 'exact', head: true }),
    admin
      .from('komplain')
      .select('*', { count: 'exact', head: true })
      .eq('status', false),
    admin
      .from('komplain')
      .select('*', { count: 'exact', head: true })
      .eq('status', true),
    admin
      .from('komplain')
      .select('*', { count: 'exact', head: true })
      .is('respon_admin', null),
  ])

  return {
    total: total.count ?? 0,
    menunggu: menunggu.count ?? 0,
    selesai: selesai.count ?? 0,
    belumDirespons: belumDirespons.count ?? 0,
  }
}

export async function getAllKomplain({
  search = '',
  pelangganId,
  status = 'semua',
  sort = 'terbaru',
  page = 1,
  pageSize = 10,
}: {
  search?: string
  pelangganId?: string
  status?: 'semua' | 'menunggu' | 'selesai'
  sort?: 'terbaru' | 'terlama'
  page?: number
  pageSize?: number
} = {}): Promise<KomplainListResult> {
  const admin = createAdminClient()
  const empty = { data: [], total: 0, page, pageSize, totalPages: 0 }

  // Resolve filter pelanggan
  let pelangganIds: string[] | null = null
  if (pelangganId) {
    pelangganIds = [pelangganId]
  } else if (search.trim()) {
    const { data: pelanggan } = await admin
      .from('pelanggan')
      .select('id')
      .or(`nama_lengkap.ilike.%${search}%,email.ilike.%${search}%,no_hp.ilike.%${search}%`)

    pelangganIds = (pelanggan ?? []).map((item) => item.id)
    if (pelangganIds.length === 0) return empty
  }

  // Satu query dengan JOIN ke pelanggan
  let query = admin
    .from('komplain')
    .select(
      `
      *,
      pelanggan:pelanggan_id (
        id,
        nama_lengkap,
        email,
        no_hp
      )
    `,
      { count: 'exact' },
    )

  if (pelangganIds) query = query.in('pelanggan_id', pelangganIds)
  if (status === 'menunggu') query = query.eq('status', false)
  if (status === 'selesai') query = query.eq('status', true)

  query = query
    .order('tanggal', { ascending: sort === 'terlama' })
    .order('created_at', { ascending: sort === 'terlama' })
    .range((page - 1) * pageSize, page * pageSize - 1)

  const { data: komplainRows, count, error } = await query

  if (error) {
    console.error('getAllKomplain error:', error)
    return empty
  }

  return {
    data: (komplainRows ?? []) as unknown as KomplainWithPelanggan[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}