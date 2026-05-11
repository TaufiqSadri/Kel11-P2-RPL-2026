'use client'

import FadeUp from '@/components/FadeUp'

const steps = [
  {
    title: "Pilih Paket",
    body: "Pilih paket internet yang sesuai dengan kebutuhan Anda.",
  },
  {
    title: "Isi Formulir",
    body: "Lengkapi data diri dan informasi lokasi pemasangan.",
  },
  {
    title: "Persetujuan Admin",
    body: "Tim kami memproses dan memverifikasi pendaftaran Anda.",
  },
  {
    title: "Proses Instalasi",
    body: "Teknisi kami datang ke lokasi untuk memasang perangkat internet.",
  },
  {
    title: "Akses Portal",
    body: "Masuk dan kelola layanan Anda secara mandiri.",
  },
]

export default function SubscribeSteps() {
  return (
    <section className="bg-white px-5 py-8 sm:px-8 md:py-14">
      <div className="mx-auto max-w-6xl rounded-lg bg-[#ffd66f] px-6 py-10 text-center sm:px-10">
        <FadeUp>
          <h2 className="text-3xl font-black text-black sm:text-4xl">Cara Berlangganan</h2>
          <p className="mt-1 text-sm text-black sm:text-base">Proses yang mudah, cepat, dan sepenuhnya digital.</p>
        </FadeUp>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, index) => (
            <FadeUp key={step.title} delay={index * 100}>
              <article>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#68247B] text-xl font-black text-white">
                  {index + 1}
                </div>
                <h3 className="mt-4 text-xl font-black text-black">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-44 text-sm font-semibold leading-snug text-black">{step.body}</p>
              </article>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}
