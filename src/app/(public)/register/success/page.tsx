import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import Navbar from '@/components/Navbar'

export default function RegisterSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100">
            <MailCheck className="h-10 w-10 text-brand-purple" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Cek Email Kamu</h1>
          <p className="mt-3 text-sm text-gray-500">
            Kami sudah mengirim link verifikasi ke email yang kamu daftarkan. Klik link tersebut
            untuk mengaktifkan akun Distric Net.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-brand-purple">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-purple" />
            Menunggu Konfirmasi Email
          </div>
          <p className="mt-6 text-xs text-gray-400">
            Setelah email dikonfirmasi, data pendaftaran kamu akan masuk ke admin dan menunggu
            persetujuan pemasangan. Butuh bantuan?{' '}
            <a
              href="https://wa.me/6282170821291"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-purple hover:underline"
            >
              WhatsApp +62 821-7082-1291
            </a>
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-brand-pink py-3 font-display font-semibold text-white transition hover:bg-brand-pink-dark"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </main>
    </div>
  )
}
