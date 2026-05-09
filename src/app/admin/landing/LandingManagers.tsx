'use client'

import { useRef, useState, useTransition } from 'react'
import { Pencil, Trash2, Plus, X, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import type { Promo, Faq, AreaLayanan } from '@/types/database'
import {
  createPromo, updatePromo, deletePromo, togglePromoStatus,
  createFaq, updateFaq, deleteFaq,
  createAreaLayanan, deleteAreaLayanan,
} from './actions'

// ── Reusable modal ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function SubmitBtn({ label, pending }: { label: string; pending: boolean }) {
  return (
    <button type="submit" disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-pink px-5 text-sm font-semibold text-white transition hover:bg-pink-900 disabled:opacity-60">
      {pending && <Loader2 size={14} className="animate-spin" />}
      {label}
    </button>
  )
}

// ── PROMO TAB ─────────────────────────────────────────────────────────────────
export function PromoManager({ promos }: { promos: Promo[] }) {
  const [modal, setModal] = useState<'create' | Promo | null>(null)
  const [pending, start] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleCreate(fd: FormData) {
    start(async () => { await createPromo(fd); setModal(null) })
  }
  function handleUpdate(id: string, fd: FormData) {
    start(async () => { await updatePromo(id, fd); setModal(null) })
  }

  const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20'

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">{promos.length} promo aktif</p>
        <button type="button" onClick={() => setModal('create')}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-pink px-4 py-2 text-sm font-semibold text-white hover:bg-pink-900">
          <Plus size={15} /> Tambah Promo
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {promos.map((p) => (
          <div key={p.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-start justify-between gap-2">
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-brand-purple">{p.tag}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {p.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
            <h3 className="mt-2 font-semibold text-gray-900">{p.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">{p.description}</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setModal(p)}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                <Pencil size={12} /> Edit
              </button>
              <form action={togglePromoStatus.bind(null, p.id, p.is_active)}>
                <button type="submit" className="flex items-center gap-1 rounded-lg border border-yellow-200 px-3 py-1.5 text-xs font-medium text-yellow-700 hover:bg-yellow-50">
                  {p.is_active ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                  {p.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
              </form>
              <form action={deletePromo.bind(null, p.id)}>
                <button type="submit" className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                  <Trash2 size={12} /> Hapus
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {modal === 'create' && (
        <Modal title="Tambah Promo" onClose={() => setModal(null)}>
          <form ref={formRef} action={handleCreate} className="space-y-4">
            <div><label className="mb-1 block text-xs font-semibold text-gray-600">Judul</label>
              <input name="title" required className={inputCls} placeholder="Gratis Biaya Instalasi" /></div>
            <div><label className="mb-1 block text-xs font-semibold text-gray-600">Deskripsi</label>
              <textarea name="description" required rows={3} className={inputCls} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-xs font-semibold text-gray-600">Tag</label>
                <input name="tag" required className={inputCls} placeholder="Pelanggan Baru" /></div>
              <div><label className="mb-1 block text-xs font-semibold text-gray-600">Urutan</label>
                <input name="urutan" type="number" defaultValue={promos.length + 1} className={inputCls} /></div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100">Batal</button>
              <SubmitBtn label="Simpan" pending={pending} />
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {modal && modal !== 'create' && (
        <Modal title="Edit Promo" onClose={() => setModal(null)}>
          <form action={(fd) => handleUpdate((modal as Promo).id, fd)} className="space-y-4">
            <div><label className="mb-1 block text-xs font-semibold text-gray-600">Judul</label>
              <input name="title" required defaultValue={(modal as Promo).title} className={inputCls} /></div>
            <div><label className="mb-1 block text-xs font-semibold text-gray-600">Deskripsi</label>
              <textarea name="description" required rows={3} defaultValue={(modal as Promo).description} className={inputCls} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-xs font-semibold text-gray-600">Tag</label>
                <input name="tag" required defaultValue={(modal as Promo).tag} className={inputCls} /></div>
              <div><label className="mb-1 block text-xs font-semibold text-gray-600">Urutan</label>
                <input name="urutan" type="number" defaultValue={(modal as Promo).urutan} className={inputCls} /></div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100">Batal</button>
              <SubmitBtn label="Simpan" pending={pending} />
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

// ── FAQ TAB ───────────────────────────────────────────────────────────────────
export function FaqManager({ faqs }: { faqs: Faq[] }) {
  const [modal, setModal] = useState<'create' | Faq | null>(null)
  const [pending, start] = useTransition()

  function handleCreate(fd: FormData) {
    start(async () => { await createFaq(fd); setModal(null) })
  }
  function handleUpdate(id: string, fd: FormData) {
    start(async () => { await updateFaq(id, fd); setModal(null) })
  }

  const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20'

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">{faqs.length} pertanyaan</p>
        <button type="button" onClick={() => setModal('create')}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-pink px-4 py-2 text-sm font-semibold text-white hover:bg-pink-900">
          <Plus size={15} /> Tambah FAQ
        </button>
      </div>

      <div className="space-y-3">
        {faqs.map((f, i) => (
          <div key={f.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs font-bold text-brand-purple">#{i + 1}</p>
                <p className="mt-1 font-semibold text-gray-900">{f.question}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{f.answer}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => setModal(f)}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  <Pencil size={12} /> Edit
                </button>
                <form action={deleteFaq.bind(null, f.id)}>
                  <button type="submit" className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                    <Trash2 size={12} /> Hapus
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal === 'create' && (
        <Modal title="Tambah FAQ" onClose={() => setModal(null)}>
          <form action={handleCreate} className="space-y-4">
            <div><label className="mb-1 block text-xs font-semibold text-gray-600">Pertanyaan</label>
              <input name="question" required className={inputCls} placeholder="Berapa lama proses pemasangan?" /></div>
            <div><label className="mb-1 block text-xs font-semibold text-gray-600">Jawaban</label>
              <textarea name="answer" required rows={4} className={inputCls} /></div>
            <div><label className="mb-1 block text-xs font-semibold text-gray-600">Urutan</label>
              <input name="urutan" type="number" defaultValue={faqs.length + 1} className={inputCls} /></div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100">Batal</button>
              <SubmitBtn label="Simpan" pending={pending} />
            </div>
          </form>
        </Modal>
      )}

      {modal && modal !== 'create' && (
        <Modal title="Edit FAQ" onClose={() => setModal(null)}>
          <form action={(fd) => handleUpdate((modal as Faq).id, fd)} className="space-y-4">
            <div><label className="mb-1 block text-xs font-semibold text-gray-600">Pertanyaan</label>
              <input name="question" required defaultValue={(modal as Faq).question} className={inputCls} /></div>
            <div><label className="mb-1 block text-xs font-semibold text-gray-600">Jawaban</label>
              <textarea name="answer" required rows={4} defaultValue={(modal as Faq).answer} className={inputCls} /></div>
            <div><label className="mb-1 block text-xs font-semibold text-gray-600">Urutan</label>
              <input name="urutan" type="number" defaultValue={(modal as Faq).urutan} className={inputCls} /></div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100">Batal</button>
              <SubmitBtn label="Simpan" pending={pending} />
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

// ── AREA LAYANAN TAB ──────────────────────────────────────────────────────────
export function AreaManager({ areas }: { areas: (AreaLayanan & { id: string })[] }) {
  const [showForm, setShowForm] = useState(false)
  const [pending, start] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20'

  // Group by kecamatan
  const grouped = areas.reduce<Record<string, (AreaLayanan & { id: string })[]>>((acc, a) => {
    if (!acc[a.kecamatan]) acc[a.kecamatan] = []
    acc[a.kecamatan].push(a)
    return acc
  }, {})

  function handleCreate(fd: FormData) {
    start(async () => { await createAreaLayanan(fd); setShowForm(false) })
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">{areas.length} nagari di {Object.keys(grouped).length} kecamatan</p>
        <button type="button" onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-pink px-4 py-2 text-sm font-semibold text-white hover:bg-pink-900">
          <Plus size={15} /> Tambah Nagari
        </button>
      </div>

      {showForm && (
        <form ref={formRef} action={handleCreate} className="mb-5 rounded-xl border border-dashed border-brand-pink bg-pink-50 p-5">
          <p className="mb-3 text-sm font-semibold text-gray-700">Tambah Nagari Baru</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs font-semibold text-gray-600">Kecamatan</label>
              <input name="kecamatan" required className={inputCls} placeholder="Batang Anai" /></div>
            <div><label className="mb-1 block text-xs font-semibold text-gray-600">Nagari / Kelurahan</label>
              <input name="nagari" required className={inputCls} placeholder="Lubuk Alung" /></div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100">Batal</button>
            <SubmitBtn label="Tambah" pending={pending} />
          </div>
        </form>
      )}

      <div className="space-y-4">
        {Object.entries(grouped).map(([kec, nagariList]) => (
          <div key={kec} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="mb-3 text-sm font-bold text-brand-purple">Kec. {kec}</p>
            <div className="flex flex-wrap gap-2">
              {nagariList.map((a) => (
                <div key={a.id} className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 pl-3 pr-1.5 py-1 text-xs font-medium text-gray-700">
                  {a.nagari}
                  <form action={deleteAreaLayanan.bind(null, a.id)} className="flex">
                    <button type="submit" className="ml-1 rounded-full p-0.5 text-gray-400 hover:bg-red-100 hover:text-red-600" title="Hapus">
                      <X size={10} />
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
