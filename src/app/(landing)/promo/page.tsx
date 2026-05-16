import { BadgePercent, CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getLandingPromos } from "@/lib/data/landing";

export const metadata: Metadata = {
  title: "Promo | District_Net",
  description: "Promo layanan internet Distric Net untuk pelanggan baru dan pelanggan aktif.",
};

export const revalidate = 3600

export default async function PromoPage() {
  const promos = await getLandingPromos()

  return (
    <main className="bg-white">
      <section className="px-5 py-14 sm:px-8 md:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wide text-[#68247B]">Promo Distric Net</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-[#111111] sm:text-5xl">Penawaran internet lebih hemat untuk rumah Anda</h1>
            <p className="mt-4 max-w-xl text-base font-semibold leading-relaxed text-gray-600">
              Nikmati promo pemasangan dan benefit pelanggan baru. Promo dapat berubah sesuai area layanan dan periode aktivasi.
            </p>
            <Link href="/register" className="mt-7 inline-grid h-12 place-items-center rounded bg-[#68247B] px-6 text-sm font-black text-white transition hover:bg-purple-950">
              Daftar Sekarang
            </Link>
          </div>
          <div className="rounded-lg bg-[#ffd66f] p-8 text-black">
            <BadgePercent className="h-14 w-14 text-[#68247B]" aria-hidden="true" />
            <p className="mt-8 text-5xl font-black">Promo Aktif</p>
            <p className="mt-3 max-w-md text-base font-bold leading-relaxed">
              Cek promo yang tersedia sebelum memilih paket internet terbaik untuk kebutuhan Anda.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-[#fbf8ff] px-5 py-14 sm:px-8 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {promos.map((promo) => (
            <article key={promo.id} className="rounded-lg border border-purple-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-full bg-[#f4ecfb] px-3 py-1 text-xs font-black text-[#68247B]">{promo.tag}</span>
                <CalendarDays className="h-5 w-5 text-[#68247B]" aria-hidden="true" />
              </div>
              <h2 className="mt-6 text-2xl font-black text-[#111111]">{promo.title}</h2>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-gray-600">{promo.description}</p>
              <Link href="/register" className="mt-6 inline-flex text-sm font-black text-[#68247B] transition hover:text-purple-950">
                Ambil Promo
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
