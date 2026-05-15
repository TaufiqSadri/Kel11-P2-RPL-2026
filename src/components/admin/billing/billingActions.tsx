'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  MoreHorizontal,
  Eye,
  ImageIcon,
  CheckCircle2,
  Pencil,
  Trash2,
} from 'lucide-react'
import type { TagihanWithRelations } from '@/lib/data/tagihan'
import { markAsPaidAction, deleteTagihanAction } from '@/app/admin/actions'
import ConfirmDialog from '@/components/ConfirmDialog'

interface Props {
  tagihan: TagihanWithRelations
  onMarkPaid?: (id: string) => void
  onDelete?: (id: string) => void
}

const DROPDOWN_HEIGHT = 200 // approx max height of dropdown in px
const DROPDOWN_WIDTH = 208  // w-52 = 13rem = 208px

interface DropdownCoords {
  top: number
  left?: number
  right?: number
  openUpward: boolean
}

function getDropdownCoords(btn: HTMLButtonElement): DropdownCoords {
  const rect = btn.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const spaceBelow = vh - rect.bottom
  const openUpward = spaceBelow < DROPDOWN_HEIGHT && rect.top > DROPDOWN_HEIGHT

  // Prefer aligning to the right edge of the button; if that would overflow left, align to left edge
  const rightEdge = vw - rect.right
  const leftEdge = rect.left

  let left: number | undefined
  let right: number | undefined

  if (rect.right >= DROPDOWN_WIDTH) {
    // Enough room to the left of the button's right edge
    right = rightEdge
  } else {
    // Not enough room on the right side — anchor to left edge of button
    left = Math.max(8, leftEdge)
  }

  const top = openUpward
    ? rect.top + window.scrollY - DROPDOWN_HEIGHT - 4
    : rect.bottom + window.scrollY + 4

  return { top, left, right, openUpward }
}

export default function BillingActions({ tagihan, onMarkPaid, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<DropdownCoords>({ top: 0, right: 0, openUpward: false })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  function openMenu() {
    if (!btnRef.current) return
    setCoords(getDropdownCoords(btnRef.current))
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (
        menuRef.current?.contains(e.target as Node) ||
        btnRef.current?.contains(e.target as Node)
      ) return
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

  function navigate(href: string) {
    setOpen(false)
    router.push(href)
  }

  function handleMarkPaid() {
    setOpen(false)
    startTransition(async () => {
      await markAsPaidAction(tagihan.id)
      onMarkPaid?.(tagihan.id)
      router.refresh()
    })
  }

  function handleDelete() {
    setOpen(false)
    setConfirmDelete(true)
  }

  function confirmDeleteTagihan() {
    startTransition(async () => {
      onDelete?.(tagihan.id)
      await deleteTagihanAction(tagihan.id)
      setConfirmDelete(false)
      router.refresh()
    })
  }

  const buktiUrl = tagihan.pembayaran?.[0]?.bukti_pembayaran ?? null

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
        onClick={() => navigate(`/admin/tagihan/${tagihan.id}`)}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        <Eye size={14} />
        Lihat Detail
      </button>

      {buktiUrl ? (
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            window.open(buktiUrl, '_blank', 'noopener,noreferrer')
          }}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <ImageIcon size={14} />
          Lihat Bukti Pembayaran
        </button>
      ) : null}

      {tagihan.status_tagihan !== 'lunas' ? (
        <button
          type="button"
          onClick={handleMarkPaid}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-green-600 transition hover:bg-green-50"
        >
          <CheckCircle2 size={14} />
          Tandai Lunas
        </button>
      ) : null}

      <div className="my-1 border-t border-gray-100" />

      <button
        type="button"
        onClick={() => navigate(`/admin/tagihan/${tagihan.id}/edit`)}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        <Pencil size={14} />
        Edit Tagihan
      </button>

      <button
        type="button"
        onClick={handleDelete}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
      >
        <Trash2 size={14} />
        Hapus Tagihan
      </button>
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
        aria-label="Aksi tagihan"
      >
        {isPending ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-purple border-t-transparent" />
        ) : (
          <MoreHorizontal size={15} />
        )}
      </button>

      {mounted && open ? createPortal(dropdown, document.body) : null}
      <ConfirmDialog
        open={confirmDelete}
        title="Konfirmasi Tagihan"
        itemName={`${tagihan.pelanggan?.nama_lengkap ?? 'Pelanggan'} - ${tagihan.bulan}/${tagihan.tahun}`}
        message="Tagihan ini akan dihapus permanen."
        confirmLabel="Ya, Hapus"
        pending={isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={confirmDeleteTagihan}
      />
    </>
  )
}
