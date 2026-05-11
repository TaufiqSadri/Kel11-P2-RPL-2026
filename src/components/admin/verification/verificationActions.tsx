'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, ImageIcon, CheckCircle2, XCircle, Eye } from 'lucide-react'

// Import types and functions separately to avoid 'use server' in client component
import type { PembayaranWithRelations } from '@/lib/data/pembayaran'
import { getPembayaranPelanggan } from '@/lib/pembayaranPelanggan'

interface Props {
  pembayaran: PembayaranWithRelations
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onViewProof?: (url: string | null, name: string) => void
}

export default function VerificationActions({ pembayaran, onApprove, onReject, onViewProof }: Props) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, right: 0 })
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  function openMenu() {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setCoords({ top: rect.bottom + window.scrollY + 4, right: window.innerWidth - rect.right })
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (menuRef.current?.contains(e.target as Node) || btnRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    function handleScroll() { setOpen(false) }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [open])

  const pelangganNama = getPembayaranPelanggan(pembayaran)?.nama_lengkap ?? 'pelanggan'

  function handleApprove() {
    if (pembayaran.status_verifikasi !== 'menunggu') return
    setOpen(false)
    if (!confirm(`Approve pembayaran dari ${pelangganNama}?`)) return
    startTransition(async () => {
      const { approvePayment } = await import('@/lib/data/pembayaran')
      await approvePayment(pembayaran.id)
      onApprove?.(pembayaran.id)
      router.refresh()
    })
  }

  function handleReject() {
    if (pembayaran.status_verifikasi !== 'menunggu') return
    setOpen(false)
    if (!confirm(`Tolak pembayaran dari ${pelangganNama}?`)) return
    startTransition(async () => {
      const { rejectPayment } = await import('@/lib/data/pembayaran')
      await rejectPayment(pembayaran.id)
      onReject?.(pembayaran.id)
      router.refresh()
    })
  }

  const dropdown = (
    <div
      ref={menuRef}
      style={{ position: 'fixed', top: coords.top, right: coords.right, zIndex: 9999 }}
      className="w-52 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl"
    >
      <button
        type="button"
        onClick={() => {
          setOpen(false)
          onViewProof?.(pembayaran.bukti_pembayaran, pelangganNama)
        }}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        <ImageIcon size={14} />
        Lihat Bukti Pembayaran
      </button>

      {pembayaran.tagihan_id ? (
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            router.push(`/admin/tagihan/${pembayaran.tagihan_id}`)
          }}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <Eye size={14} />
          Lihat Detail Tagihan
        </button>
      ) : getPembayaranPelanggan(pembayaran)?.id ? (
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            router.push(`/admin/pelanggan/${getPembayaranPelanggan(pembayaran)!.id}`)
          }}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <Eye size={14} />
          Lihat Pelanggan
        </button>
      ) : null}

      <div className="my-1 border-t border-gray-100" />

      {pembayaran.status_verifikasi === 'menunggu' ? (
        <>
          <button
            type="button"
            onClick={handleApprove}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-green-600 transition hover:bg-green-50"
          >
            <CheckCircle2 size={14} />
            Approve Pembayaran
          </button>

          <button
            type="button"
            onClick={handleReject}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <XCircle size={14} />
            Reject Pembayaran
          </button>
        </>
      ) : null}
    </div>
  )

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={openMenu}
        disabled={isPending}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        aria-label="Aksi verifikasi"
      >
        {isPending ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-purple border-t-transparent" />
        ) : (
          <MoreHorizontal size={15} />
        )}
      </button>
      {mounted && open ? createPortal(dropdown, document.body) : null}
    </>
  )
}
