"use client";
import { useState } from "react";
import type { PaketInternet } from "@/types/database";

export default function PackageSection({ paket }: { paket: PaketInternet[] }) {
  const [openStates, setOpenStates] = useState(paket.map(() => true));

  const toggle = (index: number) => {
    setOpenStates((prev) => prev.map((item, i) => (i === index ? !item : item)));
  };

  const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  return (
    <section id="package" className="border-t border-gray-300 bg-[radial-gradient(circle_at_20%_0%,#f2dce9_0,#ffffff_28%,#e8efff_58%,#ffffff_100%)] px-5 py-14 sm:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-4xl font-black text-black">Package</h2>

        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {paket.map((item, index) => (
            <article key={item.id} className="overflow-hidden rounded-lg border border-gray-400 bg-white shadow-sm">
              <div className="h-48 bg-[#d9d9d9]" />
              <div className="p-4">
                <div className="text-center">
                  <strong className="block text-6xl font-black leading-none text-[#68247B]">{item.kecepatan_mbps}</strong>
                  <span className="text-xl font-black text-[#68247B]">Mbps</span>
                </div>

                <p className="mt-4 text-center text-sm font-black text-black">
                  Rp <span className="text-2xl">{fmt(item.harga).replace("Rp ", "")}</span>
                  <span className="text-xs text-[#68247B]">/ month</span>
                </p>

                <div className="mt-4 grid gap-2">
                  <button className="h-11 rounded bg-[#68247B] text-sm font-black text-white transition-all duration-200 hover:bg-white hover:text-[#68247B] hover:border hover:border-[#68247B]">Subscribe Now</button>
                  <button className="h-11 rounded border border-[#68247B] bg-white text-sm font-black text-[#68247B] transition-all duration-200 hover:text-white hover:bg-[#68247B]">
                    Chat Sales
                  </button>
                </div>

                <div className="mt-6 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between text-base font-black text-black">
                    <span>Benefits</span>
                    <button onClick={() => toggle(index)}>
                      {openStates[index] ? "-" : "+"}
                    </button>
                  </div>

                  {openStates[index] && (
                    <ul className="mt-4 space-y-1 text-sm font-bold leading-snug text-black">
                      {item.benefits.map((benefit) => (
                        <li key={benefit}>- {benefit}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
