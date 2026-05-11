import { Receipt, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import type { TagihanStats } from '@/lib/data/tagihan'

interface Props {
  stats: TagihanStats
  /** Statistik untuk tabel tagihan_instalasi (label disesuaikan) */
  forInstalasi?: boolean
}

const cardsBul = [
  {
    key: 'total' as const,
    label: 'Total Tagihan',
    icon: Receipt,
    iconBg: 'bg-purple-100',
    iconColor: 'text-brand-purple',
    valueColor: 'text-gray-900',
    sub: 'Semua tagihan',
  },
  {
    key: 'belum_bayar' as const,
    label: 'Belum Dibayar',
    icon: XCircle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-500',
    valueColor: 'text-red-600',
    sub: 'Menunggu pembayaran',
  },
  {
    key: 'menunggu_verifikasi' as const,
    label: 'Menunggu Verifikasi',
    icon: Clock,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    valueColor: 'text-yellow-600',
    sub: 'Bukti dikirim',
  },
  {
    key: 'lunas' as const,
    label: 'Sudah Dibayar',
    icon: CheckCircle,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    valueColor: 'text-green-600',
    sub: 'Terverifikasi lunas',
  },
  {
    key: 'overdue' as const,
    label: 'Overdue',
    icon: AlertCircle,
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    valueColor: 'text-gray-700',
    sub: 'Melewati jatuh tempo',
  },
]

export default function BillingStats({ stats, forInstalasi }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {cardsBul.map(({ key, label, icon: Icon, iconBg, iconColor, valueColor, sub }) => {
        const displayLabel = forInstalasi && key === 'total' ? 'Total (Instalasi)' : label
        const displaySub = forInstalasi && key === 'total' ? 'Semua tagihan instalasi' : sub
        return (
        <div key={key} className="rounded-2xl bg-white p-5 shadow-card">
          <div className="mb-3 flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{displayLabel}</p>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
              <Icon size={16} className={iconColor} />
            </div>
          </div>
          <p className={`font-display text-2xl font-bold ${valueColor}`}>
            {stats[key].toLocaleString('id-ID')}
          </p>
          <p className="mt-1 text-xs text-gray-400">{displaySub}</p>
        </div>
        )
      })}
    </div>
  )
}
