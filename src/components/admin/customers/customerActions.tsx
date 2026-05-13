'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'

import {
  MoreHorizontal,
  Eye,
  Pencil,
  Receipt,
  History,
  MessageSquare,
  UserX,
  UserCheck,
  Trash2,
} from 'lucide-react'

import type { PelangganWithPaket } from '@/types/database'

interface Props {
  pelanggan: PelangganWithPaket
  onStatusChange?: (id: string, newStatus: 'aktif' | 'nonaktif') => void
  onDelete?: (id: string) => void
}

const DROPDOWN_HEIGHT = 280
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

export default function CustomerActions({
  pelanggan,
  onStatusChange,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<DropdownCoords>({ top: 0, right: 0 })
  const [mounted, setMounted] = useState(false)
  const [isPending, startTransition] = useTransition()

  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  function openMenu() {
    if (!btnRef.current) return
    setCoords(getDropdownCoords(btnRef.current))
    setOpen((prev) => !prev)
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

  const menuItems = [
    {
      icon: Eye,
      label: 'Lihat Detail',
      onClick: () => navigate(`/admin/pelanggan/${pelanggan.id}`),
    },
    {
      icon: Pencil,
      label: 'Edit Pelanggan',
      onClick: () => navigate(`/admin/pelanggan/${pelanggan.id}/updatePelanggan`),
    },
    {
      icon: Receipt,
      label: 'Lihat Tagihan',
      onClick: () => navigate(`/admin/tagihan?pelanggan=${pelanggan.id}`),
    },
    {
      icon: History,
      label: 'Riwayat Pembayaran',
      onClick: () => navigate(`/admin/verifikasi?pelanggan=${pelanggan.id}`),
    },
    {
      icon: MessageSquare,
      label: 'Lihat Komplain',
      onClick: () => navigate(`/admin/komplain?pelanggan=${pelanggan.id}`),
    },
    { divider: true },
    pelanggan.status_langganan === 'aktif'
      ? {
          icon: UserX,
          label: 'Nonaktifkan',
          className: 'text-orange-600 hover:bg-orange-50',
          onClick: () => {
            setOpen(false)
            startTransition(async () => {
              const { togglePelangganStatus } = await import('@/app/admin/actions')
              await togglePelangganStatus(pelanggan.id, pelanggan.status_langganan, new FormData())
              onStatusChange?.(pelanggan.id, 'nonaktif')
              router.refresh()
            })
          },
        }
      : {
          icon: UserCheck,
          label: 'Aktifkan',
          className: 'text-green-600 hover:bg-green-50',
          onClick: () => {
            setOpen(false)
            startTransition(async () => {
              const { togglePelangganStatus } = await import('@/app/admin/actions')
              await togglePelangganStatus(pelanggan.id, pelanggan.status_langganan, new FormData())
              onStatusChange?.(pelanggan.id, 'aktif')
              router.refresh()
            })
          },
        },
    {
      icon: Trash2,
      label: 'Hapus Pelanggan',
      className: 'text-red-600 hover:bg-red-50',
      onClick: () => {
        setOpen(false)
        if (!confirm(`Hapus pelanggan "${pelanggan.nama_lengkap}"? Tindakan ini tidak bisa dibatalkan.`)) return
        startTransition(async () => {
          onDelete?.(pelanggan.id)
          router.refresh()
        })
      },
    },
  ]

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
      {menuItems.map((item, i) => {
        if ('divider' in item) {
          return <div key={`div-${i}`} className="my-1 border-t border-gray-100" />
        }

        const Icon = item.icon

        return (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 ${item.className ?? ''}`}
          >
            <Icon size={14} />
            {item.label}
          </button>
        )
      })}
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
        aria-label="Aksi pelanggan"
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