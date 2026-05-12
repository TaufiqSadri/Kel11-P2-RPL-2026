'use client'

import type { PaketInternet } from '@/types/database'
import PackageCard from '@/components/PackageCard'

export default function PackageSection({ paket }: { paket: PaketInternet[] }) {
  return (
    <section
      id="package"
      className="border-t border-gray-300 bg-[radial-gradient(circle_at_20%_0%,#f2dce9_0,#ffffff_28%,#e8efff_58%,#ffffff_100%)] px-5 py-14 sm:px-8 md:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-4xl font-black text-black">Paket Internet</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm font-regular leading-relaxed text-gray-600">
          Pilih paket internet sesuai kebutuhan rumah, mulai dari aktivitas harian sampai streaming dan kerja online.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {paket.map((item) => (
            <PackageCard
              key={item.id}
              id={item.id}
              nama_paket={item.nama_paket}
              kecepatan_mbps={item.kecepatan_mbps}
              harga={item.harga}
              deskripsi={item.deskripsi}
              image_url={item.image_url}
              benefits={item.benefits}
            />
          ))}
        </div>
      </div>
    </section>
  )
}