'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Eye, ImageIcon, CheckCircle2, Trash2 } from 'lucide-react'
import type { TagihanInstalasiWithRelations } from '@/lib/data/tagihan'
import { deleteTagihanInstalasiAction, markAsPaidInstalasiAction } from '@/app/admin/actions'

interface Props {
  row: TagihanInstalasiWithRelations
  onMarkPaid?: (id: string) => void
  onDelete?: (id: string) => void
}

const DROPDOWN_HEIGHT = 180
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

export default function BillingActionsInstalasi({ row, onMarkPaid, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<DropdownCoords>({ top: 0, right: 0 })
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

  function navigate(href: string) {
    setOpen(false)
    router.push(href)
  }

  function handleMarkPaid() {
    setOpen(false)
    startTransition(async () => {
      await markAsPaidInstalasiAction(row.id)
      onMarkPaid?.(row.id)
      router.refresh()
    })
  }

  function handleDelete() {
    setOpen(false)
    if (!confirm('Hapus tagihan instalasi ini? Tindakan tidak bisa dibatalkan.')) return
    startTransition(async () => {
      onDelete?.(row.id)
      await deleteTagihanInstalasiAction(row.id)
      router.refresh()
    })
  }

  const buktiUrl = row.pembayaran?.[0]?.bukti_pembayaran ?? null
  const pelangganId = row.pelanggan?.id

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
      {pelangganId ? (
        <button
          type="button"
          onClick={() => navigate(`/admin/pelanggan/${pelangganId}`)}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <Eye size={14} />
          Lihat Pelanggan
        </button>
      ) : null}

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

      {row.status_tagihan !== 'lunas' ? (
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
        aria-label="Aksi tagihan instalasi"
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