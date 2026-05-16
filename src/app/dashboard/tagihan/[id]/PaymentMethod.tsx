'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronDown, QrCode } from 'lucide-react'

const PAYMENT_METHODS = [{ value: 'qris', label: 'QRIS' }]

export default function PaymentMethod() {
  const [selected, setSelected] = useState('qris')
  const [showQR, setShowQR] = useState(false)

  return (
    <div className="mt-6 border-t border-gray-100 pt-6">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
        <QrCode size={15} className="text-brand-purple" />
        Metode Pembayaran
      </p>

      <div className="flex items-center gap-2">
        {/* Dropdown */}
        <div className="relative flex-1">
          <select
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value)
              setShowQR(false)
            }}
            className="h-10 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 pl-3 pr-8 text-sm font-medium text-gray-700 transition focus:border-brand-purple focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>

        {/* Tombol Pilih */}
        <button
          type="button"
          onClick={() => setShowQR(true)}
          className="h-10 rounded-xl bg-pink-500 px-4 text-sm font-semibold text-white transition hover:bg-pink-900 active:scale-95"
        >
          Pilih
        </button>
      </div>

      {/* QR Code Card */}
      {showQR && selected === 'qris' ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {/* Header strip */}
          <div className="bg-[#68247b] px-4 py-2 text-center">
            <span className="text-xs font-extrabold tracking-wide text-gray-100">
              QRIS · Scan untuk Bayar
            </span>
          </div>

          <div className="flex flex-col items-center px-6 py-6">
            {/* QR Image */}
            <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-inner">
              <Image
                src="/qris.png"
                alt="QR Code QRIS"
                width={180}
                height={180}
                className="block"
                priority
              />
            </div>

            <p className="mt-4 text-center text-xs font-semibold text-gray-500">
              Scan QRIS untuk pembayaran
            </p>

            {/* Hint */}
            <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-center text-xs text-yellow-800">
              Setelah pembayaran, tetap kirim bukti pembayaran untuk verifikasi admin.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}