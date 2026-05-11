'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { submitPembayaranInstalasi } from '@/app/dashboard/actions'
import { CheckCircle2, FileText, Loader2, UploadCloud } from 'lucide-react'

const PAYMENT_BUCKET = 'payment-proofs'
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.\-_]/g, '-')
}

export default function PaymentUploadFormInstalasi({
  userId,
  instalasiId,
  defaultAmount,
}: {
  userId: string
  instalasiId: string
  defaultAmount: number
}) {
  const supabase = useMemo(() => createClient(), [])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadedUrl, setUploadedUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [isPdf, setIsPdf] = useState(false)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setUploadError('')

    if (!file) {
      setUploadedUrl('')
      setPreviewUrl('')
      setFileName('')
      setIsPdf(false)
      return
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('File harus berupa JPG, PNG, WEBP, atau PDF.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError('Ukuran file maksimal 5 MB.')
      return
    }

    setUploading(true)

    const safeName = sanitizeFileName(file.name)
    const path = `${userId}/instalasi-${instalasiId}/${Date.now()}-${safeName}`

    const { error: uploadErr } = await supabase.storage
      .from(PAYMENT_BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type })

    if (uploadErr) {
      setUploadError(uploadErr.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from(PAYMENT_BUCKET).getPublicUrl(path)
    setUploadedUrl(data.publicUrl)
    setPreviewUrl(URL.createObjectURL(file))
    setFileName(file.name)
    setIsPdf(file.type === 'application/pdf')
    setUploading(false)
  }

  return (
    <form action={submitPembayaranInstalasi} className="space-y-4">
      <input type="hidden" name="instalasi_id" value={instalasiId} />
      <input type="hidden" name="bukti_pembayaran" value={uploadedUrl} />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Jumlah Bayar</label>
        <input
          name="jumlah_bayar"
          type="number"
          min={0}
          defaultValue={defaultAmount}
          required
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Upload Bukti Pembayaran</label>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center transition hover:border-brand-purple/40 hover:bg-white">
          <UploadCloud size={22} className="text-brand-purple" />
          <span className="mt-3 text-sm font-semibold text-gray-700">Pilih file bukti pembayaran</span>
          <span className="mt-1 text-xs text-gray-400">Format: JPG, PNG, WEBP, PDF · Maks 5 MB</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>

      {uploading && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <Loader2 size={16} className="animate-spin" />
          Mengunggah file ke storage...
        </div>
      )}

      {uploadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {uploadError}
        </div>
      )}

      {uploadedUrl && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-700">
            <CheckCircle2 size={16} />
            File berhasil diunggah
          </div>
          <div className="overflow-hidden rounded-xl border border-green-100 bg-white">
            {isPdf ? (
              <div className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FileText size={16} className="text-brand-purple" />
                  {fileName}
                </div>
                {previewUrl && <iframe src={previewUrl} title="Preview" className="h-72 w-full" />}
              </div>
            ) : previewUrl ? (
              <img src={previewUrl} alt="Preview bukti" className="max-h-72 w-full object-contain" />
            ) : null}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
        Pembayaran instalasi akan diverifikasi oleh admin sebelum diterima.
      </div>

      <button
        type="submit"
        disabled={!uploadedUrl || uploading}
        className="w-full rounded-xl bg-brand-pink px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-pink-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        Kirim Pembayaran Instalasi
      </button>
    </form>
  )
}
