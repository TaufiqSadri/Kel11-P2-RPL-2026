"use client";

import { useState } from "react";

export default function Navbar() {
      const [open, setOpen] = useState<boolean>(false);
      const links = ["Package", "Promo", "FAQ", "About us"] as const;

      return (
            <nav className="sticky top-0 pt-1.5 z-50 bg-purple-950 border-b border-gray-100 shadow-sm">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                        {/* Logo */}
                        <a href="#" className="shrink-0 text-2xl font-extrabold tracking-tight">
                              <img className="h-14" src="/image.png" alt="Distric" />
                        </a>

                        {/* Desktop links */}
                        <ul className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
                              {links.map((l) => (
                                    <li key={l}>
                                          <a href="#" className="hover:text-purple-700 transition-colors">{l}</a>
                                    </li>
                              ))}
                              <li>
                                    <a href="#" className="px-4 py-1.5 bg-purple-500 text-white rounded-2xl text-sm hover:bg-purple-800 transition-colors">
                                          Login
                                    </a>
                              </li>
                        </ul>

                        {/* Right CTA group */}
                        <div className="hidden md:flex items-center gap-2">
                              <button className="flex items-center gap-1.5 border border-gray-500 rounded-sm px-3 py-[7.5px] text-sm text-gray-400 hover:border-purple-400 transition-colors whitespace-nowrap">
                                    <svg className="w-3.5 h-3.5 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    Check your location here
                              </button>
                              <a href="#" className="px-4 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-sm text-sm hover:bg-yellow-600 transition-colors whitespace-nowrap" >
                                    Subscribe Now
                              </a>
                        </div>

                        {/* Mobile hamburger */}
                        <button className="md:hidden p-2 rounded-md text-gray-600" onClick={() => setOpen((currentOpen) => !currentOpen)} aria-label="Toggle menu">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {open ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                              </svg>
                        </button>
                  </div>

                  {/* Mobile menu */}
                  {open && (
                        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-3 text-sm font-medium text-gray-700">
                              {links.map((l) => <a key={l} href="#" className="hover:text-purple-700">{l}</a>)}
                              <a href="#" className="inline-block px-4 py-1.5 bg-purple-700 text-white rounded-full w-fit">Login</a>
                              <a href="#" className="inline-block px-4 py-1.5 bg-yellow-400 text-gray-900 font-semibold rounded-full w-fit">Subscribe Now</a>
                        </div>
                  )}
            </nav>
      );
}
