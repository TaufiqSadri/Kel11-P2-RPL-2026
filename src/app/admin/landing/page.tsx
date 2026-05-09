import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { PromoManager, FaqManager, AreaManager } from './LandingManagers'
import type { PaketInternet, Promo, Faq, AreaLayanan } from '@/types/database'
import { FileText, Globe, HelpCircle, MapPin, Wifi } from 'lucide-react'

type Tab = 'paket' | 'promo' | 'faq' | 'area'

type AreaRow = AreaLayanan & { id: string }

export default async function AdminLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'paket' } = await searchParams
  const activeTab = (tab as Tab) ?? 'paket'
  const admin = createAdminClient()

  // Fetch only what's needed for the active tab
  const [paket, promos, faqs, areas] = await Promise.all([
    activeTab === 'paket'
      ? admin.from('paket_internet').select('*').order('harga').then((r) => (r.data ?? []) as PaketInternet[])
      : Promise.resolve([] as PaketInternet[]),
    activeTab === 'promo'
      ? admin.from('promo').select('*').order('urutan').then((r) => (r.data ?? []) as Promo[])
      : Promise.resolve([] as Promo[]),
    activeTab === 'faq'
      ? admin.from('faq').select('*').order('urutan').then((r) => (r.data ?? []) as Faq[])
      : Promise.resolve([] as Faq[]),
    activeTab === 'area'
      ? admin.from('area_layanan').select('*').order('kecamatan').order('nagari').then((r) => (r.data ?? []) as AreaRow[])
      : Promise.resolve([] as AreaRow[]),
  ])

  const rupiah = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'paket', label: 'Paket Internet', icon: <Wifi size={15} /> },
    { key: 'promo', label: 'Promo', icon: <FileText size={15} /> },
    { key: 'faq', label: 'FAQ', icon: <HelpCircle size={15} /> },
    { key: 'area', label: 'Area Layanan', icon: <MapPin size={15} /> },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold text-gray-900 flex items-center gap-2">
          <Globe size={20} className="text-brand-purple" />
          Kelola Landing Page
        </h1>
        <p className="mt-1 text-sm text-gray-500">Manage konten yang tampil di halaman publik website.</p>
      </div>

      {/* Tab navigation */}
      <div className="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/landing?tab=${t.key}`}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              activeTab === t.key
                ? 'bg-brand-purple text-white shadow'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </Link>
        ))}
      </div>

      {/* ── PAKET TAB ──────────────────────────────────────────────────────── */}
      {activeTab === 'paket' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">{paket.length} paket terdaftar</p>
            <Link href="/admin/paket/createPaket"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-pink px-4 py-2 text-sm font-semibold text-white hover:bg-pink-900">
              + Tambah Paket
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paket.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
                  <div>
                    <p className="font-semibold text-gray-900">{p.nama_paket}</p>
                    <p className="text-xs text-gray-500">{p.kecepatan_mbps} Mbps</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-2xl font-bold text-brand-purple">{rupiah(p.harga)}<span className="text-xs font-normal text-gray-400">/bln</span></p>
                  {p.benefits?.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {p.benefits.map((b) => (
                        <li key={b} className="text-xs text-gray-500">• {b}</li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Link href={`/admin/paket/updatePaket/${p.id}`}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PROMO TAB ───────────────────────────────────────────────────────── */}
      {activeTab === 'promo' && <PromoManager promos={promos} />}

      {/* ── FAQ TAB ─────────────────────────────────────────────────────────── */}
      {activeTab === 'faq' && <FaqManager faqs={faqs} />}

      {/* ── AREA TAB ────────────────────────────────────────────────────────── */}
      {activeTab === 'area' && <AreaManager areas={areas} />}
    </div>
  )
}
