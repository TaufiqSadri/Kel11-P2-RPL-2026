import SidebarAdmin from '@/components/SidebarAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') redirect('/login')

  const admin = createAdminClient()
  const { count: pendingCount } = await admin
    .from('pelanggan')
    .select('*', { count: 'exact', head: true })
    .eq('status_langganan', 'pending')
  const { count: paymentPendingCount } = await admin
    .from('pembayaran')
    .select('*', { count: 'exact', head: true })
    .eq('status_verifikasi', 'menunggu')

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      <SidebarAdmin pendingCount={pendingCount ?? 0} paymentPendingCount={paymentPendingCount ?? 0} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
    </div>
  )
}
