'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  CalendarClock,
  ChevronDown,
  CircleAlert,
  Clock,
  Receipt,
  Wrench,
  X,
} from 'lucide-react'

export type CustomerNotification = {
  id: string
  title: string
  summary: string
  time: string
  tone: 'purple' | 'pink' | 'blue' | 'yellow' | 'orange' | 'green' | 'red'
  icon: 'wrench' | 'receipt' | 'alert' | 'clock' | 'calendar'
  status?: string
  href?: string
  actionLabel?: string
  details?: Array<{ label: string; value: string }>
}

type Props = {
  notifications: CustomerNotification[]
}

const toneClass: Record<CustomerNotification['tone'], { icon: string; badge: string; border: string }> = {
  purple: {
    icon: 'bg-purple-100 text-brand-purple',
    badge: 'bg-purple-50 text-brand-purple',
    border: 'border-purple-100',
  },
  pink: {
    icon: 'bg-pink-100 text-brand-pink',
    badge: 'bg-pink-50 text-brand-pink',
    border: 'border-pink-100',
  },
  blue: {
    icon: 'bg-blue-100 text-blue-700',
    badge: 'bg-blue-50 text-blue-700',
    border: 'border-blue-100',
  },
  yellow: {
    icon: 'bg-yellow-100 text-yellow-700',
    badge: 'bg-yellow-50 text-yellow-700',
    border: 'border-yellow-100',
  },
  orange: {
    icon: 'bg-orange-100 text-orange-700',
    badge: 'bg-orange-50 text-orange-700',
    border: 'border-orange-100',
  },
  green: {
    icon: 'bg-green-100 text-green-700',
    badge: 'bg-green-50 text-green-700',
    border: 'border-green-100',
  },
  red: {
    icon: 'bg-red-100 text-red-700',
    badge: 'bg-red-50 text-red-700',
    border: 'border-red-100',
  },
}

const iconMap: Record<CustomerNotification['icon'], typeof Wrench> = {
  wrench: Wrench,
  receipt: Receipt,
  alert: CircleAlert,
  clock: Clock,
  calendar: CalendarClock,
}

export default function CustomerNotificationDrawer({ notifications }: Props) {
  const [open, setOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(
    notifications.find((item) => item.href || item.details?.length)?.id ?? null,
  )

  const count = notifications.length

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative inline-flex h-11 items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 text-sm font-semibold text-gray-700 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
        aria-label="Buka notifikasi pelanggan"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-purple-50 text-brand-purple">
          <Bell size={17} />
        </span>
        <span className="hidden sm:inline">Notifikasi</span>
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-pink px-1 text-[11px] font-bold text-white">
            {count}
          </span>
        ) : null}
      </button>

      {open ? (
        <button
          type="button"
          aria-label="Tutup notifikasi"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[75] bg-gray-900/30 backdrop-blur-[1px]"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 right-0 z-[80] flex w-[min(29rem,100vw)] flex-col bg-gray-50 shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="border-b border-gray-100 bg-white px-5 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-gray-900">Pengumuman</h2>
              <p className="mt-1 text-sm text-gray-500">
                {count > 0 ? `${count} informasi layanan Anda` : 'Tidak ada informasi baru'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-gray-100 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
              aria-label="Tutup notifikasi"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {count === 0 ? (
            <div className="rounded-2xl bg-white p-5 text-sm text-gray-500 shadow-card">
              Belum ada pengumuman penting untuk akun Anda.
            </div>
          ) : null}

          {notifications.map((item) => {
            const Icon = iconMap[item.icon]
            const tone = toneClass[item.tone]
            const canExpand = Boolean(item.href || item.details?.length)
            const expanded = expandedId === item.id

            return (
              <div
                key={item.id}
                className={`overflow-hidden rounded-2xl border bg-white shadow-card ${tone.border}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (canExpand) setExpandedId(expanded ? null : item.id)
                  }}
                  className={`flex w-full items-start gap-3 px-4 py-4 text-left ${
                    canExpand ? 'transition hover:bg-gray-50' : 'cursor-default'
                  }`}
                >
                  <span className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl ${tone.icon}`}>
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-base font-semibold leading-snug text-gray-900">
                      {item.title}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-sm leading-5 text-gray-500">
                      {item.summary}
                    </span>
                    <span className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
                        <Clock size={13} />
                        {item.time}
                      </span>
                      {item.status ? (
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone.badge}`}>
                          {item.status}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  {canExpand ? (
                    <ChevronDown
                      size={17}
                      className={`mt-1 flex-shrink-0 text-gray-400 transition ${
                        expanded ? 'rotate-180' : ''
                      }`}
                    />
                  ) : null}
                </button>

                {canExpand && expanded ? (
                  <div className="border-t border-gray-100 px-4 py-4">
                    {item.details && item.details.length > 0 ? (
                      <div className="grid gap-2">
                        {item.details.map((detail) => (
                          <div
                            key={`${item.id}-${detail.label}`}
                            className="rounded-xl bg-gray-50 px-3 py-2"
                          >
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                              {detail.label}
                            </p>
                            <p className="mt-1 text-sm font-medium leading-5 text-gray-800">
                              {detail.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">{item.summary}</p>
                    )}

                    {item.href ? (
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-brand-purple px-4 text-sm font-semibold text-white transition hover:bg-purple-900"
                      >
                        {item.actionLabel ?? 'Lihat Detail'}
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </aside>
    </>
  )
}
