'use client'

import { deletePelangganByAdmin } from '@/app/admin/actions'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Loader2, Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'

type Props = {
  pelangganId: string
  userId: string
  namaLengkap: string
}

export default function DeletePelangganButton({ pelangganId, userId, namaLengkap }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)

  function handleDelete() {
    startTransition(async () => {
      await deletePelangganByAdmin(pelangganId, userId)
      setShowConfirm(false)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
      >
        {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        Hapus
      </button>
      <ConfirmDialog
        open={showConfirm}
        title="Konfirmasi Hapus Pelanggan"
        itemName={namaLengkap}
        message="Pelanggan ini akan dihapus permanen beserta akun login terkait."
        confirmLabel="Ya, Hapus"
        pending={isPending}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleDelete}
      />
    </>
  )
}
