import { MapPin } from "lucide-react";
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

          <div className="mt-9 grid max-w-2xl grid-cols-3 gap-5 text-center">
            <div>
              <strong className="block text-3xl font-black sm:text-4xl">90+</strong>
              <span className="text-[11px] text-gray-600 sm:text-xs">Pelanggan Aktif</span>
            </div>
            <div>
              <strong className="block text-3xl font-black sm:text-4xl">24/7</strong>
              <span className="text-[11px] text-gray-600 sm:text-xs">Akses Portal</span>
            </div>
            <div>
              <strong className="block text-3xl font-black sm:text-4xl">100%</strong>
              <span className="text-[11px] text-gray-600 sm:text-xs">Data Aman</span>
            </div>
          </div>

          <form className="mt-6 max-w-xl rounded border border-gray-200 bg-white p-3 shadow-sm">
            <label className="mb-2 flex items-center gap-1 text-xs font-extrabold text-black">
              <MapPin className="h-3.5 w-3.5 fill-red-500 text-red-500" />
              Check Location
            </label>
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
              <input className="h-8 rounded border border-gray-300 px-3 text-sm outline-[#68247B]" aria-label="City" />
              <input className="h-8 rounded border border-gray-300 px-3 text-sm outline-[#68247B]" aria-label="Address" />
              <button className="h-8 rounded bg-[#68247B] px-4 text-xs font-bold text-white" type="button">
                Search
              </button>
              <button className="h-8 rounded bg-[#68247B] px-4 text-xs font-bold text-white" type="button">
                My Location
              </button>
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
