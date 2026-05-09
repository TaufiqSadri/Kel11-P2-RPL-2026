import { Check, MessageCircle, Wifi } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getLandingPackages } from "@/lib/data/landing";

export const metadata: Metadata = {
  title: "Package | Distric Internet",
  description: "Pilihan paket internet Distric Net untuk rumah dan keluarga.",
};

export const revalidate = 3600

export default async function PackagePage() {
  const paket = await getLandingPackages()
  const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`

  return (
    <main className="bg-white">
      <section className="border-b border-gray-100 px-5 py-14 sm:px-8 md:py-20">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm font-extrabold uppercase tracking-wide text-[#68247B]">Internet Broadband Unlimited</p>
          <h1 className="mt-3 text-4xl font-black text-[#111111] sm:text-5xl">Package</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-relaxed text-gray-600">
            Pilih paket internet sesuai kebutuhan rumah, mulai dari aktivitas harian sampai streaming dan kerja online.
          </p>
        </div>
      </section>

      <section className="bg-[radial-gradient(circle_at_20%_0%,#f2dce9_0,#ffffff_28%,#e8efff_58%,#ffffff_100%)] px-5 py-14 sm:px-8 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {paket.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="grid h-36 place-items-center bg-[#f4ecfb]">
                <Wifi className="h-16 w-16 text-[#68247B]" aria-hidden="true" />
              </div>
              <div className="p-5">
                <p className="text-sm font-black text-[#68247B]">{item.nama_paket}</p>
                <div className="mt-3 text-center">
                  <strong className="block text-6xl font-black leading-none text-[#68247B]">{item.kecepatan_mbps}</strong>
                  <span className="text-xl font-black text-[#68247B]">Mbps</span>
                </div>
                <p className="mt-5 text-center text-sm font-black text-black">
                  {fmt(item.harga)}
                  <span className="text-xs text-[#68247B]">/ month</span>
                </p>
                <ul className="mt-5 space-y-3 text-sm font-bold leading-snug text-black">
                  {item.benefits.map((benefit) => (
                    <li key={benefit} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#68247B]" aria-hidden="true" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 grid gap-2">
                  <Link href="/register" className="grid h-11 place-items-center rounded bg-[#68247B] text-sm font-black text-white transition hover:bg-purple-950">
                    Subscribe Now
                  </Link>
                  <Link href="#" className="flex h-11 items-center justify-center gap-2 rounded border border-[#68247B] bg-white text-sm font-black text-[#68247B] transition hover:bg-[#68247B] hover:text-white">
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    Chat Sales
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
