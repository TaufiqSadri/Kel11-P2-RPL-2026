import SidebarPelanggan from '@/components/SidebarPelanggan'
import { getCurrentPelanggan } from '@/lib/data/pelanggan'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pelanggan = await getCurrentPelanggan()
  if (!pelanggan) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      <SidebarPelanggan namaLengkap={pelanggan.nama_lengkap} email={pelanggan.email} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
    </div>
  )
}
