'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface PembayaranWithRelations {
  id: string
  tagihan_id: string
  bukti_pembayaran: string | null
  status_verifikasi: string
  tanggal_pembayaran: string | null
  jumlah_bayar: number
  catatan_admin: string | null
  created_at: string
  tagihan: {
    id: string
    bulan: number
    tahun: number
    jumlah_tagihan: number
    status_tagihan: string
    pelanggan: {
      id: string
      nama_lengkap: string
      email: string
      no_hp: string
    } | null
  } | null
}

export interface VerificationStats {
  menunggu: number
  approvedCount: number
  rejectedCount: number
}

export async function getPembayaranList({
  search = '',
  pelangganId,
  status = 'semua',
  sort = 'terbaru',
  page = 1,
  pageSize = 10,
}: {
  search?: string
  pelangganId?: string
  status?: 'semua' | 'menunggu' | 'diterima' | 'ditolak'
  sort?: 'terbaru' | 'terlama'
  page?: number
  pageSize?: number
} = {}): Promise<{ data: PembayaranWithRelations[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const admin = createAdminClient()
  const empty = { data: [], total: 0, page, pageSize, totalPages: 0 }

  // Resolve pelanggan filter — hanya butuh 1 query tambahan kalau ada filter
  let pelangganIds: string[] | null = null
  if (pelangganId) {
    pelangganIds = [pelangganId]
  } else if (search.trim()) {
    const { data: matched } = await admin
      .from('pelanggan')
      .select('id')
      .ilike('nama_lengkap', `%${search}%`)
    pelangganIds = (matched ?? []).map((p) => p.id)
    if (pelangganIds.length === 0) return empty
  }

  // Satu query dengan nested JOIN — tidak perlu 3 round trips lagi
  let query = admin
    .from('pembayaran')
    .select(
      `
      *,
      tagihan:tagihan_id (
        id,
        bulan,
        tahun,
        jumlah_tagihan,
        status_tagihan,
        pelanggan:pelanggan_id (
          id,
          nama_lengkap,
          email,
          no_hp
        )
      )
    `,
      { count: 'exact' },
    )

  // Filter by pelanggan via relasi tagihan
  if (pelangganIds) {
    // Supabase tidak support filter nested langsung di select, jadi ambil tagihan IDs dulu
    const { data: tagihanMatched } = await admin
      .from('tagihan')
      .select('id')
      .in('pelanggan_id', pelangganIds)

    const tagihanIds = (tagihanMatched ?? []).map((t) => t.id)
    if (tagihanIds.length === 0) return empty

    query = query.in('tagihan_id', tagihanIds)
  }

  if (status !== 'semua') {
    query = query.eq('status_verifikasi', status)
  }

  query = query
    .order('tanggal_pembayaran', { ascending: sort === 'terlama' })
    .order('created_at', { ascending: sort === 'terlama' })
    .range((page - 1) * pageSize, page * pageSize - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('getPembayaranList error:', error)
    return empty
  }

  return {
    data: (data ?? []) as unknown as PembayaranWithRelations[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getPendingPembayaran(args: {
  search?: string
  sort?: 'terbaru' | 'terlama'
  page?: number
  pageSize?: number
} = {}) {
  return getPembayaranList({ ...args, status: 'menunggu' })
}

export async function getVerificationStats(): Promise<VerificationStats> {
  const admin = createAdminClient()

  // Semua count-only query paralel — tidak fetch data sama sekali
  const [menunggu, approved, rejected] = await Promise.all([
    admin
      .from('pembayaran')
      .select('*', { count: 'exact', head: true })
      .eq('status_verifikasi', 'menunggu'),
    admin
      .from('pembayaran')
      .select('*', { count: 'exact', head: true })
      .eq('status_verifikasi', 'diterima'),
    admin
      .from('pembayaran')
      .select('*', { count: 'exact', head: true })
      .eq('status_verifikasi', 'ditolak'),
  ])

  return {
    menunggu: menunggu.count ?? 0,
    approvedCount: approved.count ?? 0,
    rejectedCount: rejected.count ?? 0,
  }
}

export async function approvePayment(pembayaranId: string, tagihanId: string): Promise<void> {
  const admin = createAdminClient()
  await Promise.all([
    admin.from('pembayaran').update({ status_verifikasi: 'diterima' }).eq('id', pembayaranId),
    admin.from('tagihan').update({ status_tagihan: 'lunas' }).eq('id', tagihanId),
  ])
  revalidatePath('/admin/verifikasi')
  revalidatePath('/admin')
}

export async function rejectPayment(pembayaranId: string, tagihanId: string): Promise<void> {
  const admin = createAdminClient()
  await Promise.all([
    admin.from('pembayaran').update({ status_verifikasi: 'ditolak' }).eq('id', pembayaranId),
    admin.from('tagihan').update({ status_tagihan: 'belum_bayar' }).eq('id', tagihanId),
  ])
  revalidatePath('/admin/verifikasi')
  revalidatePath('/admin')
}

export async function getPaymentDetail(pembayaranId: string): Promise<PembayaranWithRelations | null> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('pembayaran')
    .select(
      `
      *,
      tagihan:tagihan_id (
        id,
        bulan,
        tahun,
        jumlah_tagihan,
        status_tagihan,
        pelanggan:pelanggan_id (
          id,
          nama_lengkap,
          email,
          no_hp
        )
      )
    `,
    )
    .eq('id', pembayaranId)
    .single()

  if (error || !data) return null

  return data as unknown as PembayaranWithRelations
}