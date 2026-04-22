"use client";

import { MapPin, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { href: "#package", label: "Package" },
  { href: "#promo", label: "Promo" },
  { href: "#faq", label: "FAQ" },
  { href: "#about", label: "About us" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur">
      <nav className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link href="/" className="flex items-center" aria-label="District Net home">
          <Image
            src="/district_net.svg"
            alt="District Net"
            width={136}
            height={40}
            priority
            className="h-10 w-auto"
          />
        </Link>

        <ul className="hidden items-center gap-8 text-sm font-extrabold text-black md:flex">
          {navLinks.map((item) => (
            <li key={item.label}>
              <Link className="transition hover:text-[#68247B]" href={item.href}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <button className="rounded-full bg-[#68247B] px-4 py-1.5 text-xs font-bold text-white">
            Login
          </button>
          <button className="flex items-center gap-2 rounded border border-gray-300 px-4 py-1.5 text-xs font-bold text-black">
            <MapPin className="h-3.5 w-3.5" />
            Check your location here
          </button>
          <button className="rounded bg-brand-yellow px-4 py-1.5 text-xs font-extrabold text-black">
            Subscribe Now
          </button>
        </div>

        <button
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
          className="grid h-10 w-10 place-items-center rounded border border-gray-200 md:hidden"
          onClick={() => setIsOpen((value) => !value)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {isOpen ? (
        <div className="border-t border-gray-100 bg-white px-5 pb-5 md:hidden">
          <ul className="grid gap-3 py-4 text-sm font-extrabold text-black">
            {navLinks.map((item) => (
              <li key={item.label}>
                <Link className="block py-1" href={item.href} onClick={() => setIsOpen(false)}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="grid gap-2">
            <button className="h-10 rounded-full bg-[#68247B] text-sm font-bold text-white">
              Login
            </button>
            <button className="flex h-10 items-center justify-center gap-2 rounded border border-gray-300 text-sm font-bold text-black">
              <MapPin className="h-4 w-4" />
              Check your location here
            </button>
            <button className="h-10 rounded bg-brand-yellow text-sm font-extrabold text-black">
              Subscribe Now
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
