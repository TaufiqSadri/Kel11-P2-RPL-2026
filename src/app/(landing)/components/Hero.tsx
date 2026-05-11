import Image from "next/image";
import LocationChecker from "./LocationChecker";
import FadeUp from "@/components/FadeUp";
import type { AreaLayanan } from "@/types/database";

export default function Hero({ areas }: { areas: AreaLayanan[] }) {
  return (
    <section className="overflow-hidden bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-10 sm:px-8 md:grid-cols-[1.1fr_0.9fr] md:py-14">
        <FadeUp>
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

          <LocationChecker areas={areas} />
        </FadeUp>

        <FadeUp delay={150} className="mx-auto w-full max-w-sm md:max-w-md">
          <Image
            src="/hero.svg"
            alt="Ilustrasi jangkauan internet Distric"
            width={362}
            height={333}
            priority
            className="h-auto w-full"
          />
        </FadeUp>
      </div>
    </section>
  );
}
