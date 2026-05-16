'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { syncSuspendedPelangganStatuses } from '@/lib/data/pelangganStatus'

export interface PembayaranWithRelations {
  id: string
  tagihan_id: string | null
  tagihan_instalasi_id: string | null
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
  tagihan_instalasi: {
    id: string
    jumlah_tagihan: number
    status_tagihan: string
    jatuh_tempo: string
    pelanggan: {
      id: string
      nama_lengkap: string
      email: string
      no_hp: string
    } | null
  } | null
}

const pembayaranSelect = `
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
  ),
  tagihan_instalasi:tagihan_instalasi_id (
    id,
    jumlah_tagihan,
    status_tagihan,
    jatuh_tempo,
    pelanggan:pelanggan_id (
      id,
      nama_lengkap,
      email,
      no_hp
    )
  )
`

export interface VerificationStats {
  menunggu: number
  approvedCount: number
  rejectedCount: number
}

async function pembayaranOrFilterForPelangganIds(admin: ReturnType<typeof createAdminClient>, pelangganIds: string[]) {
  const [{ data: tagihanMatched }, { data: instalMatched }] = await Promise.all([
    admin.from('tagihan').select('id').in('pelanggan_id', pelangganIds),
    admin.from('tagihan_instalasi').select('id').in('pelanggan_id', pelangganIds),
  ])
  const tagihanIds = (tagihanMatched ?? []).map((t) => t.id)
  const instalasiIds = (instalMatched ?? []).map((t) => t.id)
  if (tagihanIds.length === 0 && instalasiIds.length === 0) return null

  const parts: string[] = []
  if (tagihanIds.length) parts.push(`tagihan_id.in.(${tagihanIds.join(',')})`)
  if (instalasiIds.length) parts.push(`tagihan_instalasi_id.in.(${instalasiIds.join(',')})`)
  return parts.join(',')
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

  let query = admin.from('pembayaran').select(pembayaranSelect, { count: 'exact' })

  if (pelangganIds) {
    const orFilter = await pembayaranOrFilterForPelangganIds(admin, pelangganIds)
    if (!orFilter) return empty
    query = query.or(orFilter)
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

export async function approvePayment(pembayaranId: string): Promise<void> {
  const admin = createAdminClient()
  const { data: row, error: fetchErr } = await admin
    .from('pembayaran')
    .select('tagihan_id, tagihan_instalasi_id')
    .eq('id', pembayaranId)
    .single()

  if (fetchErr || !row) throw new Error(fetchErr?.message ?? 'Pembayaran tidak ditemukan.')

  await admin.from('pembayaran').update({ status_verifikasi: 'diterima' }).eq('id', pembayaranId)

  let pelangganId: string | null = null
  if (row.tagihan_id) {
    const { data } = await admin
      .from('tagihan')
      .update({ status_tagihan: 'lunas' })
      .eq('id', row.tagihan_id)
      .select('pelanggan_id')
      .single()
    pelangganId = data?.pelanggan_id ?? null
  } else if (row.tagihan_instalasi_id) {
    const { data } = await admin
      .from('tagihan_instalasi')
      .update({ status_tagihan: 'lunas' })
      .eq('id', row.tagihan_instalasi_id)
      .select('pelanggan_id')
      .single()
    pelangganId = data?.pelanggan_id ?? null
  }

  if (pelangganId) {
    await syncSuspendedPelangganStatuses([pelangganId], { restoreCleared: true })
  }
  revalidatePath('/admin/verifikasi')
  revalidatePath('/admin')
  revalidatePath('/admin/pelanggan')
  revalidatePath('/admin/tagihan')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/riwayat')
}

export async function rejectPayment(pembayaranId: string): Promise<void> {
  const admin = createAdminClient()
  const { data: row, error: fetchErr } = await admin
    .from('pembayaran')
    .select('tagihan_id, tagihan_instalasi_id')
    .eq('id', pembayaranId)
    .single()

  if (fetchErr || !row) throw new Error(fetchErr?.message ?? 'Pembayaran tidak ditemukan.')

  await admin.from('pembayaran').update({ status_verifikasi: 'ditolak' }).eq('id', pembayaranId)

  let pelangganId: string | null = null
  if (row.tagihan_id) {
    const { data } = await admin
      .from('tagihan')
      .update({ status_tagihan: 'belum_bayar' })
      .eq('id', row.tagihan_id)
      .select('pelanggan_id')
      .single()
    pelangganId = data?.pelanggan_id ?? null
  } else if (row.tagihan_instalasi_id) {
    const { data } = await admin
      .from('tagihan_instalasi')
      .update({ status_tagihan: 'belum_bayar', bukti_pembayaran: null })
      .eq('id', row.tagihan_instalasi_id)
      .select('pelanggan_id')
      .single()
    pelangganId = data?.pelanggan_id ?? null
  }

  if (pelangganId) {
    await syncSuspendedPelangganStatuses([pelangganId])
  }
  revalidatePath('/admin/verifikasi')
  revalidatePath('/admin')
  revalidatePath('/admin/pelanggan')
  revalidatePath('/admin/tagihan')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/riwayat')
}

export async function getPaymentDetail(pembayaranId: string): Promise<PembayaranWithRelations | null> {
  const admin = createAdminClient()

  const { data, error } = await admin.from('pembayaran').select(pembayaranSelect).eq('id', pembayaranId).single()

  if (error || !data) return null

  return data as unknown as PembayaranWithRelations
}
