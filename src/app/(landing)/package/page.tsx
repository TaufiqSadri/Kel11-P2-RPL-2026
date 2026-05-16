import type { Metadata } from 'next'
import { getLandingPackages } from '@/lib/data/landing'
import PackageCard from '@/components/PackageCard'

export const metadata: Metadata = {
  title: 'Package | District_Net',
  description: 'Pilihan paket internet Distric Net untuk rumah dan keluarga.',
}

export const revalidate = 3600

export default async function PackagePage() {
  const paket = await getLandingPackages()

  return (
    <main className="bg-white">
      <section className="border-b border-gray-100 px-5 py-14 sm:px-8 md:py-20">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm font-extrabold uppercase tracking-wide text-[#68247B]">
            Internet Broadband Unlimited
          </p>
          <h1 className="mt-3 text-4xl font-black text-[#111111] sm:text-5xl">Package</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-relaxed text-gray-600">
            Pilih paket internet sesuai kebutuhan rumah, mulai dari aktivitas harian sampai
            streaming dan kerja online.
          </p>
        </div>
      </section>

      <section className="bg-[radial-gradient(circle_at_20%_0%,#f2dce9_0,#ffffff_28%,#e8efff_58%,#ffffff_100%)] px-5 py-14 sm:px-8 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
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
      </section>
    </main>
  )
}
