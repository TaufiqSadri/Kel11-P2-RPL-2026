'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, ImageIcon, CheckCircle2, XCircle, Eye } from 'lucide-react'

import type { PembayaranWithRelations } from '@/lib/data/pembayaran'
import { getPembayaranPelanggan } from '@/lib/pembayaranPelanggan'
import ConfirmDialog from '@/components/ConfirmDialog'

interface Props {
  pembayaran: PembayaranWithRelations
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onViewProof?: (url: string | null, name: string) => void
}

const DROPDOWN_HEIGHT = 200
const DROPDOWN_WIDTH = 208

interface DropdownCoords {
  top: number
  left?: number
  right?: number
}

function getDropdownCoords(btn: HTMLButtonElement): DropdownCoords {
  const rect = btn.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const spaceBelow = vh - rect.bottom
  const openUpward = spaceBelow < DROPDOWN_HEIGHT && rect.top > DROPDOWN_HEIGHT

  const rightEdge = vw - rect.right

  let left: number | undefined
  let right: number | undefined

  if (rect.right >= DROPDOWN_WIDTH) {
    right = rightEdge
  } else {
    left = Math.max(8, rect.left)
  }

  const top = openUpward
    ? rect.top + window.scrollY - DROPDOWN_HEIGHT - 4
    : rect.bottom + window.scrollY + 4

  return { top, left, right }
}

export default function VerificationActions({ pembayaran, onApprove, onReject, onViewProof }: Props) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<DropdownCoords>({ top: 0, right: 0 })
  const [confirmAction, setConfirmAction] = useState<{
    title: string
    message: string
    confirmLabel: string
    destructive: boolean
    onConfirm: () => void
  } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  function openMenu() {
    if (!btnRef.current) return
    setCoords(getDropdownCoords(btnRef.current))
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
    setConfirmAction({
      title: 'Konfirmasi Approve Pembayaran',
      message: 'Pembayaran ini akan disetujui dan tagihan terkait ditandai lunas.',
      confirmLabel: 'Ya, Approve',
      destructive: false,
      onConfirm: () => {
        startTransition(async () => {
          const { approvePayment } = await import('@/lib/data/pembayaran')
          await approvePayment(pembayaran.id)
          onApprove?.(pembayaran.id)
          setConfirmAction(null)
          router.refresh()
        })
      },
    })
  }

  function handleReject() {
    if (pembayaran.status_verifikasi !== 'menunggu') return
    setOpen(false)
    setConfirmAction({
      title: 'Konfirmasi Tolak Pembayaran',
      message: 'Pembayaran ini akan ditolak dan tagihan kembali berstatus belum bayar.',
      confirmLabel: 'Ya, Tolak',
      destructive: true,
      onConfirm: () => {
        startTransition(async () => {
          const { rejectPayment } = await import('@/lib/data/pembayaran')
          await rejectPayment(pembayaran.id)
          onReject?.(pembayaran.id)
          setConfirmAction(null)
          router.refresh()
        })
      },
    })
  }

  const dropdown = (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        top: coords.top,
        ...(coords.right !== undefined ? { right: coords.right } : { left: coords.left }),
        zIndex: 9999,
        width: DROPDOWN_WIDTH,
      }}
      className="overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl"
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
      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.title}
        itemName={pelangganNama}
        message={confirmAction?.message}
        confirmLabel={confirmAction?.confirmLabel}
        destructive={confirmAction?.destructive}
        pending={isPending}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => confirmAction?.onConfirm()}
      />
    </>
  )
}
