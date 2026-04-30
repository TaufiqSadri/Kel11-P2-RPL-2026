import { LocateFixed, MapPin, Search } from "lucide-react";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="overflow-hidden bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-10 sm:px-8 md:grid-cols-[1.1fr_0.9fr] md:py-14">
        <div>
          <p className="text-sm font-extrabold text-black">Internet Broadband Unlimited</p>
          <h1 className="mt-1 max-w-2xl text-3xl font-black leading-tight text-[#111111] sm:text-4xl md:text-5xl">
            Pasang <span className="text-[#68247B]">Wi-Fi</span> di Rumah, Nikmati Internet Tanpa Batas!!
          </h1>

          <div className="mt-9 grid max-w-2xl grid-cols-3 gap-4 text-center">
            <div>
              <strong className="block text-3xl font-black sm:text-4xl">90+</strong>
              <span className="text-[11px] text-gray-600 sm:text-xs">Pelanggan Aktif</span>
            </div>
            <div className="border-x-2">
              <strong className="block text-3xl font-black sm:text-4xl">24/7</strong>
              <span className="text-[11px] text-gray-600 sm:text-xs">Akses Portal</span>
            </div>
            <div>
              <strong className="block text-3xl font-black sm:text-4xl">100%</strong>
              <span className="text-[11px] text-gray-600 sm:text-xs">Data Aman</span>
            </div>
          </div>

          <form className="mt-7 max-w-2xl rounded-xl border border-gray-200 bg-white p-4 shadow-[0_12px_28px_rgba(17,17,17,0.08)]">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-50">
                <MapPin className="h-4 w-4 fill-purple-0 text-purple-900" />
              </span>
              <label className="text-sm font-extrabold text-black">Check Location</label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="location-city" className="mb-1 block text-xs font-bold text-gray-500">
                  Kota
                </label>
                <input
                  id="location-city"
                  className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#68247B] focus:ring-2 focus:ring-[#68247B]/20"
                  placeholder="Contoh: Padang"
                  aria-label="Kota"
                />
              </div>

              <div>
                <label htmlFor="location-address" className="mb-1 block text-xs font-bold text-gray-500">
                  Alamat
                </label>
                <input
                  id="location-address"
                  className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#68247B] focus:ring-2 focus:ring-[#68247B]/20"
                  placeholder="Nama jalan / komplek"
                  aria-label="Alamat"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 md:col-span-2">
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#68247B] px-4 text-sm font-bold text-white transition hover:bg-purple-950"
                  type="button"
                >
                  <Search size={16} />
                  Search
                </button>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#68247B] bg-white px-4 text-sm font-bold text-[#68247B] transition hover:bg-purple-50"
                  type="button"
                >
                  <LocateFixed size={16} />
                  My Location
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="mx-auto w-full max-w-sm md:max-w-md">
          <Image
            src="/hero.svg"
            alt="Ilustrasi jangkauan internet Distric"
            width={362}
            height={333}
            priority
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
