'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, MapPin } from 'lucide-react'
import Image from "next/image";
import { useState } from 'react'

const navLinks = [
  { href: '/package', label: 'Package' },
  { href: '/promo', label: 'Promo' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About us' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky mt-2 top-0 z-50 border-2 border-gray-100 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
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

        <nav className="hidden items-center gap-6 text-sm font-extrabold text-black md:flex">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className={`text-sm font-extrabold transition ${ pathname === l.href ? 'text-brand-pink' : 'text-gray-600 hover:text-brand-pink' }`}>
              {l.label}
            </Link>
          ))}
          <Link href="/login" className="rounded-full bg-[#68247B] px-4 py-1.5 text-xs font-bold text-white hover:bg-purple-950">
            Login
          </Link>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button className="flex items-center gap-2 rounded border border-gray-300 px-3 py-[7px] text-sm font-bold text-black hover:bg-gray-200">
            <MapPin className="h-3.5 w-3.5" />
            Check your location here
          </button>
          
          <Link href="/register" className="rounded bg-brand-yellow px-4 py-2 text-sm font-extrabold text-black hover:bg-yellow-500">
            Subscribe Now
          </Link>
        </div>

        <button type="button" className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-3 border-t border-gray-100 bg-white px-4 py-4 md:hidden">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-2 text-sm font-medium text-gray-700">
              {l.label}
            </Link>
          ))}
          <Link href="/login" className="grid h-10 place-items-center rounded-xl bg-[#68247B] text-sm font-bold text-white" onClick={() => setOpen(false)}>
            Login
          </Link>
          <Link href="/register" className="rounded-xl bg-brand-yellow px-4 py-2 text-center text-sm font-semibold text-gray-900" onClick={() => setOpen(false)}>
            Subscribe Now
          </Link>
        </div>
      )}
    </header>
  )
}
