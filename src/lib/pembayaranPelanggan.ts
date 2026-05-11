/** Helper UI — jangan taruh di file `use server` agar bisa dipakai dari Client Components. */

export type PembayaranPelangganMini = {
  id: string
  nama_lengkap: string
  email: string
  no_hp: string
}

export type PembayaranRowForPelanggan = {
  tagihan?: { pelanggan?: PembayaranPelangganMini | null } | null
  tagihan_instalasi?: { pelanggan?: PembayaranPelangganMini | null } | null
}

export function getPembayaranPelanggan(p: PembayaranRowForPelanggan): PembayaranPelangganMini | null {
  return p.tagihan?.pelanggan ?? p.tagihan_instalasi?.pelanggan ?? null
}
