'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { logoutAction } from '@/app/(public)/login/actions'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Wifi,
  Receipt,
  CheckCircle,
  MessageSquare,
  BarChart2,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

interface Props {
  pendingCount?: number
  paymentPendingCount?: number
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/pelanggan', label: 'Kelola Pelanggan', icon: Users },
  { href: '/admin/paket', label: 'Kelola Paket', icon: Wifi },
  { href: '/admin/tagihan', label: 'Kelola Tagihan', icon: Receipt },
  {
    href: '/admin/verifikasi',
    label: 'Verifikasi Pembayaran',
    icon: CheckCircle,
    badgeKey: 'payment' as const,
  },
  {
    href: '/admin/komplain',
    label: 'Kelola Komplain',
    icon: MessageSquare,
    badgeKey: 'pending' as const,
  },
  { href: '/admin/laporan', label: 'Laporan', icon: BarChart2 },
]

export default function SidebarAdmin({
  pendingCount = 0,
  paymentPendingCount = 0,
}: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const getBadge = (badgeKey?: 'payment' | 'pending') => {
    if (badgeKey === 'payment' && paymentPendingCount > 0) {
      return (
        <span className="ml-auto rounded-full bg-brand-yellow px-2 py-0.5 text-xs font-bold text-gray-900">
          {paymentPendingCount}
        </span>
      )
    }
    if (badgeKey === 'pending' && pendingCount > 0) {
      return (
        <span className="ml-auto rounded-full bg-white/30 px-2 py-0.5 text-xs font-bold text-white">
          {pendingCount}
        </span>
      )
    }
    return null
  }

  const renderNavItems = (onNavigate?: () => void) =>
    navItems.map(({ href, label, icon: Icon, badgeKey }) => {
      const active =
        pathname === href || (href !== '/admin' && pathname.startsWith(href))
      return (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            active
              ? 'bg-[#FDC700] shadow-[0_10px_15px_-3px_rgba(253,199,0,0.5),0_4px_6px_-4px_rgba(253,199,0,0.5)] text-black '
              : 'text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Icon size={16} />
          {label}
          {getBadge(badgeKey)}
        </Link>
      )
    })

  const renderLogo = () => (
    <Link href="/" className="flex items-center" aria-label="District Net home">
      <Image
        src="/district_net.svg"
        alt="District Net"
        width={136}
        height={40}
        priority
        className="h-12 w-auto"
      />
    </Link>
  )

  const renderLogoutButton = () => (
    <form action={logoutAction}>
      <button
        type="submit"
        className="mt-4 flex w-full items-center gap-3 rounded-xl border-t border-white/20 px-3 py-4 text-sm font-medium text-white/50 transition hover:bg-white/10 hover:text-white"
      >
        <LogOut size={16} />
        Logout
      </button>
    </form>
  )

  return (
    <>
      <div className="sticky top-0 z-[60] flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
        {renderLogo()}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative z-[61] inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition hover:bg-gray-50"
          aria-label="Buka menu admin"
        >
          <Menu size={22} />
        </button>
      </div>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-[65] bg-black/40 md:hidden"
          aria-label="Tutup menu admin"
          onClick={() => setOpen(false)}
        />
      ) : null}

      {open ? (
        <aside className="fixed inset-y-0 left-0 z-[70] flex w-[min(20rem,calc(100vw-3rem))] flex-col overflow-y-auto bg-[#68247b] px-4 py-5 shadow-2xl md:hidden">
          <div className="mb-5 flex items-center justify-between px-3">
            {renderLogo()}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Tutup menu admin"
            >
              <X size={20} />
            </button>
          </div>
          <div className="mb-6 px-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-white/60">
              Admin Panel
            </span>
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {renderNavItems(() => setOpen(false))}
          </nav>
          {renderLogoutButton()}
        </aside>
      ) : null}

      <aside className="hidden min-h-screen w-64 flex-shrink-0 flex-col bg-[#68247b] px-4 py-6 md:flex">
        <div className="mb-2 px-3">{renderLogo()}</div>
        <div className="mb-6 px-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/60">
            Admin Panel
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">{renderNavItems()}</nav>

        {renderLogoutButton()}
      </aside>
    </>
  )
}
