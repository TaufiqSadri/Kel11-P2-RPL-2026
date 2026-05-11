export type StatusLangganan = 'pending' | 'aktif' | 'nonaktif'
export type StatusTagihan = 'belum_bayar' | 'menunggu_verifikasi' | 'lunas'
export type StatusVerifikasi = 'menunggu' | 'diterima' | 'ditolak'

export interface PaketInternet {
  id: string
  nama_paket: string
  kecepatan_mbps: number
  harga: number
  deskripsi: string | null
  image_url: string | null
  is_active: boolean
  benefits: string[]
  created_at: string
}

export interface Promo {
  id: string
  title: string
  description: string
  tag: string
  is_active: boolean
  urutan: number
  created_at: string
}

export interface Faq {
  id: string
  question: string
  answer: string
  urutan: number
  created_at: string
}

export interface AreaLayanan {
  kecamatan: string
  nagari: string
}

export interface Iklan {
  id: string
  judul: string
  deskripsi: string | null
  image_url: string
  link_url: string | null
  is_active: boolean
  urutan: number
  created_at: string
}

export interface Pelanggan {
  id: string
  user_id: string
  nama_lengkap: string
  email: string
  no_hp: string
  alamat_pemasangan: string
  latitude: number | null
  longitude: number | null
  paket_id: string | null
  status_langganan: StatusLangganan
  tanggal_bergabung: string
  created_at: string
}

export interface RegisterFormData {
  nama_lengkap: string
  email: string
  no_hp: string
  alamat_pemasangan: string
  latitude: number | null
  longitude: number | null
  paket_id: string
}

export type PelangganWithPaket = Pelanggan & {
  paket_internet: PaketInternet | null
}

export interface TagihanRow {
  id: string
  pelanggan_id: string
  bulan: number
  tahun: number
  jumlah_tagihan: number
  status_tagihan: StatusTagihan
  jatuh_tempo?: string | null
  created_at: string
}

export interface PembayaranRow {
  id: string
  tagihan_id: string
  jumlah_bayar: number
  tanggal_pembayaran: string
  status_verifikasi: StatusVerifikasi
  created_at: string
  bukti_pembayaran?: string | null
  catatan_admin?: string | null
}

export interface KomplainRow {
  id: string
  pelanggan_id: string | null
  tanggal: string | null
  isi_komplain: string
  status: boolean | null
  respon_admin: string | null
  created_at: string | null
}

// ── New types for admin customer management ──────────────────────────────────
 
export interface PelangganStats {
  total: number
  aktif: number
  pending: number
  nonaktif: number
}
 
export interface PelangganFilter {
  search: string
  status: StatusLangganan | 'semua'
  paket_id: string | 'semua'
  sort: 'terbaru' | 'terlama'
}
 
export interface PelangganListResult {
  data: PelangganWithPaket[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
