'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/app/(public)/login/actions'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Wifi,
  Receipt,
  History,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/paket', label: 'Paket Internet', icon: Wifi },
  { href: '/dashboard/tagihan', label: 'Tagihan', icon: Receipt },
  { href: '/dashboard/riwayat', label: 'Riwayat Bayar', icon: History },
  { href: '/dashboard/komplain', label: 'Komplain', icon: MessageSquare },
  { href: '/dashboard/profil', label: 'Profil Akun', icon: User },
]

interface Props {
  namaLengkap: string
  email: string
}

export default function SidebarPelanggan({ namaLengkap, email }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const initials = namaLengkap
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const renderNavItems = (onNavigate?: () => void) =>
    navItems.map(({ href, label, icon: Icon }) => {
      const active =
        pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
      return (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            active
              ? 'bg-[#FDC700] shadow-[0_10px_15px_-3px_rgba(253,199,0,0.5),0_4px_6px_-4px_rgba(253,199,0,0.5)] text-black '
              : 'text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Icon size={16} />
          {label}
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

  const renderProfileCard = () => (
    <div className="mb-6 flex items-center gap-3 rounded-xl bg-white/10 px-3 py-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-yellow font-display text-sm font-bold text-gray-900">
        {initials}
      </div>
      <div className="min-w-0 overflow-hidden">
        <p className="truncate text-sm font-semibold text-white">{namaLengkap}</p>
        <p className="truncate text-xs text-white/50">{email}</p>
      </div>
    </div>
  )

  const renderLogoutButton = () => (
    <form action={logoutAction}>
      <button
        type="submit"
        className="mt-4 flex w-full items-center gap-3 rounded-xl border-t border-white/10 px-3 py-4 text-sm font-medium text-white/50 transition hover:bg-white/10 hover:text-white"
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
          aria-label="Buka menu pelanggan"
        >
          <Menu size={22} />
        </button>
      </div>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-[65] bg-black/40 md:hidden"
          aria-label="Tutup menu pelanggan"
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
              aria-label="Tutup menu pelanggan"
            >
              <X size={20} />
            </button>
          </div>
          {renderProfileCard()}
          <nav className="flex flex-1 flex-col gap-1">
            {renderNavItems(() => setOpen(false))}
          </nav>
          {renderLogoutButton()}
        </aside>
      ) : null}

      <aside className="hidden min-h-screen w-64 flex-shrink-0 flex-col bg-[#68247b] px-4 py-6 md:flex">
        <div className="mb-6 px-3">{renderLogo()}</div>

        {renderProfileCard()}

        <nav className="flex flex-1 flex-col gap-1">{renderNavItems()}</nav>

        {renderLogoutButton()}
      </aside>
    </>
  )
}
