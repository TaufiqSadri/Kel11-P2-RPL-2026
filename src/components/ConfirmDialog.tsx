'use client'

import { Loader2 } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title?: string
  itemName: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  pending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title = 'Konfirmasi Aksi',
  itemName,
  message,
  confirmLabel = 'Ya, Hapus',
  cancelLabel = 'Batal',
  destructive = true,
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4 text-left">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
        <h3 className="font-display text-lg font-bold text-gray-900">{title}</h3>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-600">
          {message ?? 'Aksi ini akan memproses item berikut:'}
        </p>
        <div className="mt-4 break-words rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900">
          {itemName}
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="min-w-24 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`inline-flex min-w-28 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${
              destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-purple hover:bg-brand-purple/90'
            }`}
          >
            {pending ? <Loader2 size={14} className="animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
