import { HelpCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getLandingFaqs } from "@/lib/data/landing";

export const metadata: Metadata = {
  title: "FAQ | Distric Internet",
  description: "Pertanyaan umum tentang layanan internet Distric Net.",
};

export const revalidate = 3600

export default async function FaqPage() {
  const faqs = await getLandingFaqs()

  return (
    <main className="bg-white">
      <section className="px-5 py-14 sm:px-8 md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <HelpCircle className="mx-auto h-14 w-14 text-[#68247B]" aria-hidden="true" />
          <h1 className="mt-5 text-4xl font-black text-[#111111] sm:text-5xl">FAQ</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-relaxed text-gray-600">
            Jawaban cepat untuk pertanyaan yang paling sering ditanyakan sebelum berlangganan Distric Net.
          </p>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-[#fbf8ff] px-5 py-12 sm:px-8 md:py-16">
        <div className="mx-auto max-w-3xl space-y-4">
          {faqs.map((item) => (
            <details key={item.id} className="group rounded-lg border border-purple-100 bg-white p-5 shadow-sm" open>
              <summary className="cursor-pointer list-none text-lg font-black text-[#111111]">
                <span className="flex items-center justify-between gap-4">
                  {item.question}
                  <span className="text-2xl leading-none text-[#68247B] group-open:hidden">+</span>
                  <span className="hidden text-2xl leading-none text-[#68247B] group-open:inline">-</span>
                </span>
              </summary>
              <p className="mt-4 text-sm font-semibold leading-relaxed text-gray-600">{item.answer}</p>
            </details>
          ))}
        </div>
        <div className="mx-auto mt-10 max-w-3xl rounded-lg bg-[#68247B] p-6 text-center text-white">
          <h2 className="text-2xl font-black">Masih ada pertanyaan?</h2>
          <p className="mt-2 text-sm font-semibold text-white/85">Hubungi tim kami atau mulai pendaftaran agar admin dapat membantu mengecek kebutuhan Anda.</p>
          <Link href="/register" className="mt-5 inline-grid h-11 place-items-center rounded bg-brand-yellow px-5 text-sm font-black text-black transition hover:bg-yellow-500">
            Daftar Sekarang
          </Link>
        </div>
      </section>
    </main>
  );
}
