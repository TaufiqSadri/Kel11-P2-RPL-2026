import SidebarAdmin from '@/components/SidebarAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { unstable_cache } from 'next/cache'

// Cache badge counts for 30 seconds — these don't need to be real-time
const getBadgeCounts = unstable_cache(
  async () => {
    const admin = createAdminClient()
    // Single query instead of two separate queries
    const [komplainResult, pembayaranResult] = await Promise.all([
      admin
        .from('komplain')
        .select('*', { count: 'exact', head: true })
        .eq('status', false),
      admin
        .from('pembayaran')
        .select('*', { count: 'exact', head: true })
        .eq('status_verifikasi', 'menunggu'),
    ])
    return {
      pendingCount: komplainResult.count ?? 0,
      paymentPendingCount: pembayaranResult.count ?? 0,
    }
  },
  ['admin-badge-counts'],
  { revalidate: 30 },
)

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') redirect('/login')

  const { pendingCount, paymentPendingCount } = await getBadgeCounts()

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      <SidebarAdmin pendingCount={pendingCount} paymentPendingCount={paymentPendingCount} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
    </div>
  )
}