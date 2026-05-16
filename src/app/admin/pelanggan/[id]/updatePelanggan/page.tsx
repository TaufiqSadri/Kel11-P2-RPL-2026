import { createAdminClient } from '@/lib/supabase/admin'
import { updatePelangganByAdmin } from '@/app/admin/actions'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { syncSuspendedPelangganStatuses } from '@/lib/data/pelangganStatus'

type Props = { params: { id: string } }

export default async function EditPelangganPage({ params }: Props) {
await syncSuspendedPelangganStatuses([params.id])
const admin = createAdminClient()

const [{ data: pelanggan }, { data: paketList }] = await Promise.all([
admin.from('pelanggan').select('*').eq('id', params.id).single(),
admin.from('paket_internet').select('id, nama_paket, kecepatan_mbps, harga').eq('is_active', true).order('harga'),
])

if (!pelanggan) notFound()

const inputCls =
'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20'

return (
<div className="mx-auto max-w-3xl">
      <div className="mb-6">
      <Link
      href={`/admin/pelanggan/${params.id}`}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900"
      >
      <ArrowLeft size={16} />
      Kembali ke Detail Pelanggan
      </Link>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-card md:p-8">
      <div className="mb-8">
      <h1 className="font-display text-xl font-bold text-gray-900">Edit Pelanggan</h1>
      <p className="mt-1 text-sm text-gray-500">
            Ubah data pelanggan <span className="font-semibold text-gray-700">{pelanggan.nama_lengkap}</span>
      </p>
      </div>

      <form action={updatePelangganByAdmin.bind(null, params.id)} className="space-y-5">
      {/* Nama + Status */}
      <div className="grid gap-5 sm:grid-cols-2">
            <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Nama Lengkap</label>
            <input name="nama_lengkap" defaultValue={pelanggan.nama_lengkap} required className={inputCls} />
            </div>
            <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Status Langganan</label>
            <div className="relative">
            <select
                  name="status_langganan"
                  defaultValue={pelanggan.status_langganan}
                  className={`h-[50px] appearance-none bg-white pr-10 ${inputCls}`}
            >
                  <option value="aktif">Aktif</option>
                  <option value="ditangguhkan">Ditangguhkan</option>
                  <option value="proses_instalasi">Proses Instalasi</option>
                  <option value="pending">Pending</option>
                  <option value="nonaktif">Nonaktif</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            </div>
      </div>

      {/* Email (readonly) + No HP */}
      <div className="grid gap-5 sm:grid-cols-2">
            <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Email <span className="text-gray-400">(tidak bisa diubah)</span>
            </label>
            <input
            value={pelanggan.email}
            disabled
            className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-400"
            />
            </div>
            <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">No. HP</label>
            <input name="no_hp" type="tel" defaultValue={pelanggan.no_hp} required className={inputCls} />
            </div>
      </div>

      {/* Paket */}
      <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Paket Internet</label>
            <div className="relative">
            <select
            name="paket_id"
            defaultValue={pelanggan.paket_id ?? ''}
            className={`h-[50px] appearance-none bg-white pr-10 ${inputCls}`}
            >
            <option value="" disabled>Pilih Paket</option>
            {(paketList ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                  {p.nama_paket} — {p.kecepatan_mbps} Mbps (Rp {p.harga.toLocaleString('id-ID')}/bln)
                  </option>
            ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
      </div>

      {/* Alamat */}
      <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Alamat Pemasangan</label>
            <textarea
            name="alamat_pemasangan"
            defaultValue={pelanggan.alamat_pemasangan}
            required
            rows={3}
            className={inputCls}
            />
      </div>

      {/* Koordinat */}
      <div className="grid gap-5 sm:grid-cols-2">
            <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Latitude <span className="text-gray-400">(opsional)</span>
            </label>
            <input
            name="latitude"
            type="number"
            step="any"
            defaultValue={pelanggan.latitude ?? ''}
            className={inputCls}
            />
            </div>
            <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Longitude <span className="text-gray-400">(opsional)</span>
            </label>
            <input
            name="longitude"
            type="number"
            step="any"
            defaultValue={pelanggan.longitude ?? ''}
            className={inputCls}
            />
            </div>
      </div>

      <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Tanggal Bergabung
            </label>
            <input
            name="tanggal_bergabung"
            type="date"
            defaultValue={
              pelanggan.tanggal_bergabung
                ? new Date(pelanggan.tanggal_bergabung).toISOString().slice(0, 10)
                : ''
            }
            className={inputCls}
            />
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
            type="submit"
            className="rounded-xl bg-brand-pink px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-700"
            >
            Simpan Perubahan
            </button>
            <Link
            href={`/admin/pelanggan/${params.id}`}
            className="rounded-xl border border-gray-200 px-6 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
            Batal
            </Link>
      </div>
      </form>
      </div>
</div>
)
}
