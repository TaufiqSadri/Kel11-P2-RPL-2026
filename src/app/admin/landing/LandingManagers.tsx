'use client'

import { useRef, useState, useTransition } from 'react'
import { Pencil, Trash2, Plus, X, ToggleLeft, ToggleRight, Loader2, ImageIcon, UploadCloud, Link2, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import type { Promo, Faq, AreaLayanan, Iklan, PaketInternet } from '@/types/database'
import {
  createPromo, updatePromo, deletePromo, togglePromoStatus,
  createFaq, updateFaq, deleteFaq,
  createAreaLayanan, deleteAreaLayanan,
  createIklan, updateIklan, deleteIklan, toggleIklanStatus,
} from './actions'
import { addPaket, updatePaket, deletePaket, togglePaketStatus } from '@/app/admin/landing/actions'
import { createClient } from '@/lib/supabase/client'

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

// ── IMAGE UPLOADER ─────────────────────────────────────────────────────────────
const IKLAN_BUCKET = 'iklan-banners'
const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function IklanImageUploader({
  defaultUrl,
  onUploaded,
}: {
  defaultUrl?: string
  onUploaded: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [previewUrl, setPreviewUrl] = useState(defaultUrl ?? '')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')

    if (!ALLOWED.includes(file.type)) {
      setUploadError('Format harus JPG, PNG, WEBP, atau GIF.')
      return
    }
    if (file.size > MAX_SIZE) {
      setUploadError('Ukuran maksimal 5 MB.')
      return
    }

    setUploading(true)
    const supabase = createClient()
    const path = `${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, '-').toLowerCase()}`

    const { error } = await supabase.storage.from(IKLAN_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

    if (error) {
      setUploadError(error.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from(IKLAN_BUCKET).getPublicUrl(path)
    setPreviewUrl(data.publicUrl)
    onUploaded(data.publicUrl)
    setUploading(false)
  }

  return (
    <div className="space-y-2">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-center transition hover:border-brand-purple/50 hover:bg-white">
        {uploading ? (
          <Loader2 size={22} className="animate-spin text-brand-purple" />
        ) : (
          <UploadCloud size={22} className="text-brand-purple" />
        )}
        <span className="text-xs font-semibold text-gray-600">
          {uploading ? 'Mengunggah...' : 'Klik untuk upload gambar'}
        </span>
        <span className="text-xs text-gray-400">JPG, PNG, WEBP, GIF · Maks 5 MB</span>
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
      </label>

      {uploadError ? (
        <p className="text-xs text-red-600">{uploadError}</p>
      ) : null}

      {previewUrl ? (
        <div className="overflow-hidden rounded-xl border border-green-200 bg-green-50 p-2">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-green-700">
            <CheckCircle2 size={13} />
            Gambar siap
          </div>
          <div className="relative h-28 w-full overflow-hidden rounded-lg">
            <img src={previewUrl} alt="Preview banner" className="h-full w-full object-cover" />
          </div>
        </div>
      ) : null}
    </div>
  )
}

// ── IKLAN MANAGER ──────────────────────────────────────────────────────────────
export function IklanManager({ iklans }: { iklans: Iklan[] }) {
  const [modal, setModal] = useState<'create' | Iklan | null>(null)
  const [pending, start] = useTransition()
  const [uploadedUrl, setUploadedUrl] = useState('')
  const [editUploadedUrl, setEditUploadedUrl] = useState('')
  const [formError, setFormError] = useState('')

  const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20'

  function openCreate() {
    setUploadedUrl('')
    setFormError('')
    setModal('create')
  }

  function openEdit(iklan: Iklan) {
    setEditUploadedUrl(iklan.image_url)
    setFormError('')
    setModal(iklan)
  }

  async function handleCreate(fd: FormData) {
    const url = uploadedUrl || (fd.get('image_url_manual') as string)
    if (!url) { setFormError('Upload gambar atau isi URL gambar terlebih dahulu.'); return }
    fd.set('image_url', url)
    start(async () => {
      const result = await createIklan(fd)
      if (result?.error) { setFormError(result.error); return }
      setModal(null)
    })
  }

  async function handleUpdate(id: string, fd: FormData) {
    const url = editUploadedUrl || (fd.get('image_url_manual') as string)
    if (!url) { setFormError('Upload gambar atau isi URL gambar terlebih dahulu.'); return }
    fd.set('image_url', url)
    start(async () => {
      const result = await updateIklan(id, fd)
      if (result?.error) { setFormError(result.error); return }
      setModal(null)
    })
  }

  const activeCount = iklans.filter((i) => i.is_active).length

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {iklans.length} banner · <span className="text-green-600 font-semibold">{activeCount} aktif</span>
        </p>
        <button type="button" onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-pink px-4 py-2 text-sm font-semibold text-white hover:bg-pink-900">
          <Plus size={15} /> Tambah Iklan
        </button>
      </div>

      {iklans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <ImageIcon size={36} className="mb-3 text-gray-300" />
          <p className="text-sm font-semibold text-gray-500">Belum ada iklan banner</p>
          <p className="mt-1 text-xs text-gray-400">Tambah iklan untuk ditampilkan di slider halaman utama.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {iklans.map((iklan) => (
            <div key={iklan.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              {/* Banner preview */}
              <div className="relative h-36 w-full bg-gray-100">
                <img
                  src={iklan.image_url}
                  alt={iklan.judul}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30 rounded-t-xl">
                  <ImageIcon size={24} className="text-white" />
                </div>
                {/* Urutan badge */}
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-white">
                  #{iklan.urutan}
                </span>
              </div>

              <div className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-900 text-sm leading-tight">{iklan.judul}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${iklan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {iklan.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                {iklan.deskripsi ? (
                  <p className="mb-2 text-xs text-gray-500 line-clamp-2">{iklan.deskripsi}</p>
                ) : null}

                {iklan.link_url ? (
                  <a
                    href={iklan.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-brand-purple hover:underline"
                  >
                    <Link2 size={11} />
                    {iklan.link_url.length > 30 ? iklan.link_url.slice(0, 30) + '…' : iklan.link_url}
                  </a>
                ) : null}

                <div className="flex gap-2">
                  <button type="button" onClick={() => openEdit(iklan)}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                    <Pencil size={12} /> Edit
                  </button>
                  <form action={toggleIklanStatus.bind(null, iklan.id, iklan.is_active)}>
                    <button type="submit" className="flex items-center gap-1 rounded-lg border border-yellow-200 px-3 py-1.5 text-xs font-medium text-yellow-700 hover:bg-yellow-50">
                      {iklan.is_active ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                      {iklan.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </form>
                  <form action={deleteIklan.bind(null, iklan.id, iklan.image_url)}>
                    <button type="submit" className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                      <Trash2 size={12} /> Hapus
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {modal === 'create' && (
        <Modal title="Tambah Iklan Banner" onClose={() => setModal(null)}>
          <div className="max-h-[80vh] overflow-y-auto">
            <form action={handleCreate} className="space-y-4">
              {/* Upload gambar */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Gambar Banner <span className="text-red-500">*</span>
                </label>
                <IklanImageUploader onUploaded={(url) => setUploadedUrl(url)} />
                <p className="mt-2 text-xs text-gray-400">Atau masukkan URL gambar langsung:</p>
                <input
                  name="image_url_manual"
                  type="url"
                  placeholder="https://..."
                  className={inputCls + ' mt-1'}
                  onChange={(e) => {
                    if (!uploadedUrl) setUploadedUrl(e.target.value)
                  }}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Judul Banner</label>
                <input name="judul" required className={inputCls} placeholder="Promo Akhir Tahun" />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Deskripsi <span className="font-normal text-gray-400">(opsional)</span></label>
                <textarea name="deskripsi" rows={2} className={inputCls} placeholder="Keterangan singkat iklan..." />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">URL Tujuan Klik <span className="font-normal text-gray-400">(opsional)</span></label>
                <input name="link_url" type="url" className={inputCls} placeholder="https://..." />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Urutan Tampil</label>
                <input name="urutan" type="number" defaultValue={iklans.length + 1} className={inputCls} />
              </div>

              {formError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</p>
              ) : null}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100">Batal</button>
                <SubmitBtn label="Simpan Iklan" pending={pending} />
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {modal && modal !== 'create' && (
        <Modal title="Edit Iklan Banner" onClose={() => setModal(null)}>
          <div className="max-h-[80vh] overflow-y-auto">
            <form action={(fd) => handleUpdate((modal as Iklan).id, fd)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Gambar Banner <span className="text-red-500">*</span>
                </label>
                <IklanImageUploader
                  defaultUrl={(modal as Iklan).image_url}
                  onUploaded={(url) => setEditUploadedUrl(url)}
                />
                <p className="mt-2 text-xs text-gray-400">Atau masukkan URL gambar langsung:</p>
                <input
                  name="image_url_manual"
                  type="url"
                  defaultValue={(modal as Iklan).image_url}
                  placeholder="https://..."
                  className={inputCls + ' mt-1'}
                  onChange={(e) => setEditUploadedUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Judul Banner</label>
                <input name="judul" required defaultValue={(modal as Iklan).judul} className={inputCls} />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Deskripsi <span className="font-normal text-gray-400">(opsional)</span></label>
                <textarea name="deskripsi" rows={2} defaultValue={(modal as Iklan).deskripsi ?? ''} className={inputCls} />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">URL Tujuan Klik <span className="font-normal text-gray-400">(opsional)</span></label>
                <input name="link_url" type="url" defaultValue={(modal as Iklan).link_url ?? ''} className={inputCls} />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Urutan Tampil</label>
                <input name="urutan" type="number" defaultValue={(modal as Iklan).urutan} className={inputCls} />
              </div>

              {formError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</p>
              ) : null}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100">Batal</button>
                <SubmitBtn label="Simpan Perubahan" pending={pending} />
              </div>
            </form>
          </div>
        </Modal>
      )}
    </>
  )
}

// ── PAKET MANAGER ──────────────────────────────────────────────────────────────
export function PaketManager({ paketList }: { paketList: PaketInternet[] }) {
  const [modal, setModal] = useState<'create' | PaketInternet | null>(null)
  const [pending, start] = useTransition()
 
  const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20'
  const rupiah = (n: number) => `Rp ${n.toLocaleString('id-ID')}`
 
  function handleCreate(fd: FormData) {
    start(async () => {
      await addPaket(fd)
      setModal(null)
    })
  }
 
  function handleUpdate(id: string, fd: FormData) {
    start(async () => {
      await updatePaket(id, fd)
      setModal(null)
    })
  }
 
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">{paketList.length} paket terdaftar</p>
        <button
          type="button"
          onClick={() => setModal('create')}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-pink px-4 py-2 text-sm font-semibold text-white hover:bg-pink-900"
        >
          <Plus size={15} /> Tambah Paket
        </button>
      </div>
 
      {paketList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <ImageIcon size={36} className="mb-3 text-gray-300" />
          <p className="text-sm font-semibold text-gray-500">Belum ada paket internet</p>
          <p className="mt-1 text-xs text-gray-400">Tambah paket untuk ditampilkan di landing page.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paketList.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="flex h-36 items-center justify-center bg-gray-100 text-sm text-gray-400 border-b border-gray-100">
                No Image
              </div>
 
              <div className="p-5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{p.nama_paket}</h3>
                    <p className="text-xs text-gray-500">{p.kecepatan_mbps} Mbps</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
 
                <p className="mb-2 text-2xl font-bold text-brand-purple">
                  {rupiah(p.harga)}<span className="text-xs font-normal text-gray-400">/bln</span>
                </p>
 
                {p.deskripsi ? (
                  <p className="mb-3 text-xs leading-relaxed text-gray-500 line-clamp-2">{p.deskripsi}</p>
                ) : null}
 
                {p.benefits?.length > 0 && (
                  <ul className="mb-3 space-y-1">
                    {p.benefits.map((b) => (
                      <li key={b} className="text-xs text-gray-500">• {b}</li>
                    ))}
                  </ul>
                )}
 
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setModal(p)}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil size={12} /> Edit
                  </button>
 
                  <form action={togglePaketStatus.bind(null, p.id, p.is_active)}>
                    <button type="submit" className="flex items-center gap-1 rounded-lg border border-yellow-200 px-3 py-1.5 text-xs font-medium text-yellow-700 hover:bg-yellow-50">
                      {p.is_active ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                      {p.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </form>
 
                  <form action={deletePaket.bind(null, p.id)}>
                    <button type="submit" className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                      <Trash2 size={12} /> Hapus
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
 
      {/* Create Modal */}
      {modal === 'create' && (
        <Modal title="Tambah Paket Baru" onClose={() => setModal(null)}>
          <form action={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Nama Paket</label>
              <input name="nama_paket" required className={inputCls} placeholder="Paket Basic" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Kecepatan (Mbps)</label>
                <input name="kecepatan_mbps" type="number" required className={inputCls} placeholder="10" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Harga (Rp)</label>
                <input name="harga" type="number" required className={inputCls} placeholder="150000" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Deskripsi</label>
              <textarea name="deskripsi" rows={3} className={inputCls} placeholder="Cocok untuk penggunaan sehari-hari..." />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100">
                Batal
              </button>
              <SubmitBtn label="Simpan Paket" pending={pending} />
            </div>
          </form>
        </Modal>
      )}
 
      {/* Edit Modal */}
      {modal && modal !== 'create' && (
        <Modal title="Edit Paket" onClose={() => setModal(null)}>
          <form action={(fd) => handleUpdate((modal as PaketInternet).id, fd)} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Nama Paket</label>
              <input name="nama_paket" required defaultValue={(modal as PaketInternet).nama_paket} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Kecepatan (Mbps)</label>
                <input name="kecepatan_mbps" type="number" required defaultValue={(modal as PaketInternet).kecepatan_mbps} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Harga (Rp)</label>
                <input name="harga" type="number" required defaultValue={(modal as PaketInternet).harga} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Deskripsi</label>
              <textarea name="deskripsi" rows={3} defaultValue={(modal as PaketInternet).deskripsi ?? ''} className={inputCls} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100">
                Batal
              </button>
              <SubmitBtn label="Simpan Perubahan" pending={pending} />
            </div>
          </form>
        </Modal>
      )}
    </>
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
          <Plus size={15} /> Tambah Area
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
