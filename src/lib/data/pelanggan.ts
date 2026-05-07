import { createClient } from '@/lib/supabase/server'
import type {
  PelangganWithPaket,
  PelangganStats,
  PelangganListResult,
  StatusLangganan,
} from '@/types/database'
import { createAdminClient } from '@/lib/supabase/admin'
import { unstable_cache } from 'next/cache'

export async function getCurrentPelanggan(): Promise<PelangganWithPaket | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('pelanggan')
    .select('*, paket_internet(*)')
    .eq('user_id', user.id)
    .single()

  if (error) return null
  return data as PelangganWithPaket
}

// Cache stats for 30 seconds — stats shown on the listing page header
export const getPelangganStats = unstable_cache(
  async (): Promise<PelangganStats> => {
    const admin = createAdminClient()

    const [total, aktif, pending, nonaktif] = await Promise.all([
      admin.from('pelanggan').select('*', { count: 'exact', head: true }),
      admin.from('pelanggan').select('*', { count: 'exact', head: true }).eq('status_langganan', 'aktif'),
      admin.from('pelanggan').select('*', { count: 'exact', head: true }).eq('status_langganan', 'pending'),
      admin.from('pelanggan').select('*', { count: 'exact', head: true }).eq('status_langganan', 'nonaktif'),
    ])

    return {
      total: total.count ?? 0,
      aktif: aktif.count ?? 0,
      pending: pending.count ?? 0,
      nonaktif: nonaktif.count ?? 0,
    }
  },
  ['pelanggan-stats'],
  { revalidate: 30 },
)

export async function getPelangganList({
  search = '',
  status = 'semua',
  paket_id = 'semua',
  sort = 'terbaru',
  page = 1,
  pageSize = 10,
}: {
  search?: string
  status?: StatusLangganan | 'semua'
  paket_id?: string | 'semua'
  sort?: 'terbaru' | 'terlama'
  page?: number
  pageSize?: number
}): Promise<PelangganListResult> {
  const admin = createAdminClient()

  let query = admin
    .from('pelanggan')
    .select('*, paket_internet(*)', { count: 'exact' })

  if (search.trim()) {
    query = query.or(
      `nama_lengkap.ilike.%${search}%,email.ilike.%${search}%,no_hp.ilike.%${search}%`,
    )
  }

  if (status !== 'semua') {
    query = query.eq('status_langganan', status)
  }

  if (paket_id !== 'semua') {
    query = query.eq('paket_id', paket_id)
  }

  query = query
    .order('tanggal_bergabung', { ascending: sort === 'terlama' })
    .order('created_at', { ascending: sort === 'terlama' })

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('getPelangganList error:', error)
    return { data: [], total: 0, page, pageSize, totalPages: 0 }
  }

  const total = count ?? 0
  const totalPages = Math.ceil(total / pageSize)

  return {
    data: (data ?? []) as PelangganWithPaket[],
    total,
    page,
    pageSize,
    totalPages,
  }
}

export async function getPaketList() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('paket_internet')
    .select('id, nama_paket, kecepatan_mbps')
    .order('harga')
  return data ?? []
}