import { Instagram, MapPin, Phone, ShieldCheck, Wifi } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | District_Net",
  description: "Tentang Distric Net dan layanan internet broadband unlimited.",
};

export default function AboutPage() {
  return (
    <main className="bg-white">
      <section className="px-5 py-14 sm:px-8 md:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wide text-[#68247B]">About us</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-[#111111] sm:text-5xl">Distric Net menghadirkan internet cepat untuk rumah dan komunitas</h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-gray-600">
              Distric Net adalah layanan internet broadband unlimited yang berfokus pada koneksi stabil, proses berlangganan sederhana, dan dukungan pelanggan yang mudah diakses.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-lg border border-purple-100 bg-[#fbf8ff] p-5">
              <Wifi className="h-8 w-8 text-[#68247B]" aria-hidden="true" />
              <strong className="mt-5 block text-3xl font-black text-black">24/7</strong>
              <span className="text-sm font-bold text-gray-600">Akses portal pelanggan</span>
            </article>
            <article className="rounded-lg border border-purple-100 bg-[#fbf8ff] p-5">
              <ShieldCheck className="h-8 w-8 text-[#68247B]" aria-hidden="true" />
              <strong className="mt-5 block text-3xl font-black text-black">100%</strong>
              <span className="text-sm font-bold text-gray-600">Data pelanggan aman</span>
            </article>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-[#fbf8ff] px-5 py-14 sm:px-8 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          <article className="rounded-lg border border-purple-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-[#111111]">Misi</h2>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-gray-600">
              Membantu pelanggan mendapatkan internet rumah yang cepat, jelas paketnya, dan mudah dikelola secara digital.
            </p>
          </article>
          <article className="rounded-lg border border-purple-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-[#111111]">Layanan</h2>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-gray-600">
              Paket unlimited untuk rumah, pengecekan area layanan, pendaftaran pelanggan, dan dukungan admin.
            </p>
          </article>
          <article className="rounded-lg border border-purple-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-[#111111]">Kontak</h2>
            <ul className="mt-4 space-y-3 text-sm font-bold leading-relaxed text-gray-700">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#68247B]" aria-hidden="true" />
                <span>Jl Raya Padang-Bukittinggi, Padang Pariaman Regency, West Sumatera</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-[#68247B]" aria-hidden="true" />
                <span>+62 812 5600 2100</span>
              </li>
              <li className="flex items-center gap-3">
                <Instagram className="h-4 w-4 text-[#68247B]" aria-hidden="true" />
                <span>@distric_net</span>
              </li>
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
