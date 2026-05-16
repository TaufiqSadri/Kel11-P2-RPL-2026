import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { JadwalInstalasi, StatusJadwalInstalasi } from '@/types/database'

type AdminClient = ReturnType<typeof createAdminClient>

export type JadwalInstalasiWithRelations = JadwalInstalasi & {
  pelanggan: {
    id: string
    nama_lengkap: string
    email: string
    no_hp: string
    alamat_pemasangan: string
    status_langganan: string
    paket_internet: {
      nama_paket: string
      kecepatan_mbps: number
    } | null
  } | null
  tagihan_instalasi: {
    id: string
    jumlah_tagihan: number
    status_tagihan: string
  } | null
}

const jadwalSelect = `
  *,
  pelanggan:pelanggan_id (
    id,
    nama_lengkap,
    email,
    no_hp,
    alamat_pemasangan,
    status_langganan,
    paket_internet (
      nama_paket,
      kecepatan_mbps
    )
  ),
  tagihan_instalasi:tagihan_instalasi_id (
    id,
    jumlah_tagihan,
    status_tagihan
  )
`

export async function ensureJadwalInstalasi({
  admin,
  pelangganId,
  tagihanInstalasiId,
}: {
  admin: AdminClient
  pelangganId: string
  tagihanInstalasiId: string | null
}) {
  const { data: existing } = await admin
    .from('jadwal_instalasi')
    .select('id')
    .eq('pelanggan_id', pelangganId)
    .neq('status', 'selesai')
    .neq('status', 'dibatalkan')
    .limit(1)
    .maybeSingle()

  if (existing?.id) return existing.id

  const { data, error } = await admin
    .from('jadwal_instalasi')
    .insert({
      pelanggan_id: pelangganId,
      tagihan_instalasi_id: tagihanInstalasiId,
      status: 'menunggu_jadwal',
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data.id as string
}

export async function getJadwalInstalasiList({
  status = 'semua',
  page = 1,
  pageSize = 20,
}: {
  status?: StatusJadwalInstalasi | 'semua'
  page?: number
  pageSize?: number
} = {}) {
  const admin = createAdminClient()
  let query = admin
    .from('jadwal_instalasi')
    .select(jadwalSelect, { count: 'exact' })

  if (status !== 'semua') {
    query = query.eq('status', status)
  }

  query = query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('getJadwalInstalasiList error:', error)
    return { data: [] as JadwalInstalasiWithRelations[], total: 0, page, pageSize, totalPages: 0 }
  }

  return {
    data: (data ?? []) as JadwalInstalasiWithRelations[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getLatestJadwalInstalasiForPelanggan(pelangganId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('jadwal_instalasi')
    .select('*')
    .eq('pelanggan_id', pelangganId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('getLatestJadwalInstalasiForPelanggan error:', error)
    return null
  }

  return data as JadwalInstalasi | null
}

export async function updateJadwalInstalasiByAdmin(jadwalId: string, formData: FormData) {
  const admin = createAdminClient()

  const tanggalRaw = String(formData.get('tanggal_pemasangan') ?? '').trim()
  const jamRaw = String(formData.get('jam_pemasangan') ?? '').trim()
  const teknisi = String(formData.get('teknisi') ?? '').trim()
  const noHpTeknisi = String(formData.get('no_hp_teknisi') ?? '').trim()
  const status = String(formData.get('status') ?? 'menunggu_jadwal') as StatusJadwalInstalasi
  const catatan = String(formData.get('catatan') ?? '').trim()

  const tanggalPemasangan = tanggalRaw
    ? new Date(`${tanggalRaw}T${jamRaw || '09:00'}:00+07:00`).toISOString()
    : null

  const { data, error } = await admin
    .from('jadwal_instalasi')
    .update({
      tanggal_pemasangan: tanggalPemasangan,
      teknisi: teknisi || null,
      no_hp_teknisi: noHpTeknisi || null,
      status,
      catatan: catatan || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jadwalId)
    .select('pelanggan_id')
    .single()

  if (error) throw new Error(error.message)

  if (data?.pelanggan_id) {
    if (status === 'selesai') {
      await admin
        .from('pelanggan')
        .update({
          status_langganan: 'aktif',
          tanggal_bergabung: new Date().toISOString(),
        })
        .eq('id', data.pelanggan_id)
    } else if (status !== 'dibatalkan') {
      await admin
        .from('pelanggan')
        .update({ status_langganan: 'proses_instalasi' })
        .eq('id', data.pelanggan_id)
        .neq('status_langganan', 'nonaktif')
    }
  }

  revalidatePath('/admin/jadwal-instalasi')
  revalidatePath('/admin/pelanggan')
  revalidatePath('/dashboard')
}
