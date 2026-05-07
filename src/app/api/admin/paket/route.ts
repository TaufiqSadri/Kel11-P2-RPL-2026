import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { unstable_cache } from 'next/cache'

// Cache paket list for 60 seconds — paket data changes rarely
const getPaketAktifCached = unstable_cache(
  async () => {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('paket_internet')
      .select('id, nama_paket, kecepatan_mbps, harga')
      .eq('is_active', true)
      .order('harga')

    if (error) throw new Error(error.message)
    return data ?? []
  },
  ['admin-paket-list'],
  { revalidate: 60 },
)

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await getPaketAktifCached()
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}