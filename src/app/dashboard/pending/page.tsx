import { logoutAction } from '@/app/(public)/login/actions'
import { Clock } from 'lucide-react'

export default function PendingPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
          <Clock size={28} className="text-yellow-600" />
        </div>
        <h1 className="font-display text-xl font-bold text-gray-900">Akun Sedang Diverifikasi</h1>
        <p className="mb-5 mt-2 text-sm text-gray-500">
          Tim kami sedang memproses pendaftaran Anda. Estimasi 1×24 jam. Kami akan menghubungi Anda
          melalui email setelah disetujui.
        </p>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-semibold text-yellow-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
          Menunggu Persetujuan Admin
        </div>
        <p className="mb-6 text-xs text-gray-400">
          Butuh bantuan?{' '}
          <a
            href="https://wa.me/6281256002100"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-purple"
          >
            Hubungi WhatsApp Admin
          </a>
        </p>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50"
          >
            Keluar dari Akun
          </button>
        </form>
      </div>
    </div>
  )
}
