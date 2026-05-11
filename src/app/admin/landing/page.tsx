import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { PromoManager, FaqManager, AreaManager, IklanManager, PaketManager } from './LandingManagers'
import type { PaketInternet, Promo, Faq, AreaLayanan, Iklan } from '@/types/database'
import { FileText, Globe, HelpCircle, MapPin, Wifi, ImageIcon } from 'lucide-react'

type Tab = 'iklan' | 'paket' | 'promo' | 'faq' | 'area'

type AreaRow = AreaLayanan & { id: string }

export default async function AdminLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'iklan' } = await searchParams
  const activeTab = (tab as Tab) ?? 'iklan'
  const admin = createAdminClient()

  const [iklans, paket, promos, faqs, areas] = await Promise.all([
    activeTab === 'iklan'
      ? admin.from('iklan').select('*').order('urutan').then((r) => (r.data ?? []) as Iklan[])
      : Promise.resolve([] as Iklan[]),
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
    { key: 'iklan',  label: 'Iklan Banner',    icon: <ImageIcon size={15} /> },
    { key: 'paket',  label: 'Paket Internet',   icon: <Wifi size={15} /> },
    { key: 'promo',  label: 'Promo',            icon: <FileText size={15} /> },
    { key: 'faq',    label: 'FAQ',              icon: <HelpCircle size={15} /> },
    { key: 'area',   label: 'Area Layanan',     icon: <MapPin size={15} /> },
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
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/landing?tab=${t.key}`}
            className={`flex flex-shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
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

      {/* ── IKLAN TAB ──────────────────────────────────────────────────────── */}
      {activeTab === 'iklan' && (
        <div>
          <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <strong>Catatan:</strong> Iklan yang aktif akan tampil sebagai slider banner di halaman utama website. Urutkan sesuai keinginan tampilan.
          </div>
          <IklanManager iklans={iklans} />
        </div>
      )}

      {/* ── PAKET TAB ──────────────────────────────────────────────────────── */}
      {activeTab === 'paket' && (
        <div>
          <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <strong>Catatan:</strong> Paket yang aktif akan tampil pada halaman{' '}
            <code className="rounded bg-blue-100 px-1 text-xs font-mono">package</code> landing page.
          </div>
          <PaketManager paketList={paket} />
        </div>
      )}

      {/* ── PROMO TAB ───────────────────────────────────────────────────────── */}
      {activeTab === 'promo' && (
        <div>
          <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <strong>Catatan:</strong> Promo yang aktif akan tampil pada halaman <code className="rounded bg-blue-100 px-1 text-xs font-mono">promo</code> landing page.
          </div>
          <PromoManager promos={promos} />
        </div>
      )}

      {/* ── FAQ TAB ─────────────────────────────────────────────────────────── */}
      {activeTab === 'faq' && (
        <div>
          <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <strong>Catatan:</strong> Faq yang ada akan tampil pada halaman <code className="rounded bg-blue-100 px-1 text-xs font-mono">faq</code> landing page.
          </div>
          <FaqManager faqs={faqs} />
        </div>
      )}

      {/* ── AREA TAB ────────────────────────────────────────────────────────── */}
      {activeTab === 'area' && (
        <div>
          <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <strong>Catatan:</strong> Area yang dijangkau akan ada pada fitur <code className="rounded bg-blue-100 px-1 text-xs font-mono">check location</code>.
          </div>
          <AreaManager areas={areas} />
        </div>
      )}
    </div>
  )
}
