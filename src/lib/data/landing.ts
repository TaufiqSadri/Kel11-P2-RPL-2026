import { createAdminClient } from '@/lib/supabase/admin'
import { unstable_cache } from 'next/cache'
import type { PaketInternet, Promo, Faq, AreaLayanan } from '@/types/database'

// Cache 1 jam — data jarang berubah, tapi bisa revalidate manual lewat admin
const REVALIDATE = 3600

export const getLandingPackages = unstable_cache(
  async (): Promise<PaketInternet[]> => {
    const admin = createAdminClient()
    const { data } = await admin
      .from('paket_internet')
      .select('*')
      .eq('is_active', true)
      .order('harga', { ascending: true })
    return (data ?? []) as PaketInternet[]
  },
  ['landing-packages'],
  { revalidate: REVALIDATE },
)

export const getLandingPromos = unstable_cache(
  async (): Promise<Promo[]> => {
    const admin = createAdminClient()
    const { data } = await admin
      .from('promo')
      .select('*')
      .eq('is_active', true)
      .order('urutan', { ascending: true })
    return (data ?? []) as Promo[]
  },
  ['landing-promos'],
  { revalidate: REVALIDATE },
)

export const getLandingFaqs = unstable_cache(
  async (): Promise<Faq[]> => {
    const admin = createAdminClient()
    const { data } = await admin
      .from('faq')
      .select('*')
      .order('urutan', { ascending: true })
    return (data ?? []) as Faq[]
  },
  ['landing-faqs'],
  { revalidate: REVALIDATE },
)

export const getLandingAreas = unstable_cache(
  async (): Promise<AreaLayanan[]> => {
    const admin = createAdminClient()
    const { data } = await admin
      .from('area_layanan')
      .select('kecamatan, nagari')
      .order('kecamatan', { ascending: true })
      .order('nagari', { ascending: true })
    return (data ?? []) as AreaLayanan[]
  },
  ['landing-areas'],
  { revalidate: REVALIDATE },
)
