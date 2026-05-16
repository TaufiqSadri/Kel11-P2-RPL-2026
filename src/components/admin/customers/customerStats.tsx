import { Users, UserCheck, Clock, UserX, PauseCircle } from 'lucide-react'
import type { PelangganStats } from '@/types/database'

interface Props {
      stats: PelangganStats
}

const cards = [
      {
      key: 'total' as const,
      label: 'Total Pelanggan',
      icon: Users,
      iconBg: 'bg-purple-100',
      iconColor: 'text-brand-purple',
      valueColor: 'text-gray-900',
      },
      {
      key: 'aktif' as const,
      label: 'Pelanggan Aktif',
      icon: UserCheck,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      valueColor: 'text-green-600',
      },
      {
      key: 'pending' as const,
      label: 'Pending Aktivasi',
      icon: Clock,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      valueColor: 'text-yellow-600',
      },
      {
      key: 'ditangguhkan' as const,
      label: 'Ditangguhkan',
      icon: PauseCircle,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      valueColor: 'text-orange-600',
      },
      {
      key: 'nonaktif' as const,
      label: 'Nonaktif',
      icon: UserX,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-500',
      valueColor: 'text-red-500',
      },
]

export default function CustomerStats({ stats }: Props) {
      return (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                  {cards.map(({ key, label, icon: Icon, iconBg, iconColor, valueColor }) => (
                  <div key={key} className="rounded-2xl bg-white p-5 shadow-card">
                  <div className="mb-3 flex items-start justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        {label}
                        </p>
                        <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}
                        >
                        <Icon size={16} className={iconColor} />
                        </div>
                  </div>
                  <p className={`font-display text-2xl font-bold ${valueColor}`}>
                        {stats[key].toLocaleString('id-ID')}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                        {key === 'total'
                        ? 'Semua terdaftar'
                        : key === 'aktif'
                        ? 'Layanan berjalan'
                        : key === 'pending'
                        ? 'Menunggu persetujuan'
                        : key === 'ditangguhkan'
                        ? 'Ada tunggakan aktif'
                        : 'Langganan dinonaktifkan'}
                  </p>
                  </div>
                  ))}
            </div>
      )
}
