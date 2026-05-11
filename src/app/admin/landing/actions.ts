'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'

// - Function untuk CRUD Paket ─────────────────────────────────────────────────────────────────────

export async function togglePaketStatus(
  paketId: string,
  isActive: boolean,
  _formData: FormData
) {
  const admin = createAdminClient()

  await admin
    .from('paket_internet')
    .update({
      is_active: !isActive
    })
    .eq('id', paketId)

  revalidatePath('/admin/landing?tab=paket')
}

export async function deletePaket(
  paketId: string,
  _formData: FormData
) {
  const admin = createAdminClient()

  await admin
    .from('paket_internet')
    .delete()
    .eq('id', paketId)

  revalidatePath('/admin/landing?tab=paket')
}

export async function addPaket(
  formData: FormData
) {
  const admin = createAdminClient()

  const nama_paket =
    formData.get('nama_paket') as string

  const kecepatan_mbps = Number(
    formData.get('kecepatan_mbps')
  )

  const harga = Number(
    formData.get('harga')
  )

  const deskripsi =
    formData.get('deskripsi') as string


  const { error } = await admin
    .from('paket_internet')
    .insert({
      nama_paket,
      kecepatan_mbps,
      harga,
      deskripsi,
      is_active: true,
    })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/landing?tab=paket')

  redirect('/admin/landing?tab=paket')
}

export async function updatePaket(
  paketId: string,
  formData: FormData
) {
  const admin = createAdminClient()

  const nama_paket =
    formData.get('nama_paket') as string

  const kecepatan_mbps = Number(
    formData.get('kecepatan_mbps')
  )

  const harga = Number(
    formData.get('harga')
  )

  const deskripsi =
    formData.get('deskripsi') as string

  const { error } = await admin
    .from('paket_internet')
    .update({
      nama_paket,
      kecepatan_mbps,
      harga,
      deskripsi,
    })
    .eq('id', paketId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/landing?tab=paket')

  redirect('/admin/landing?tab=paket')
}

// ── Fungction untuk CRUD Promo ───────────────────────────────────────────────────────────────────

export async function createPromo(formData: FormData) {
  const admin = createAdminClient()
  await admin.from('promo').insert({
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    tag: formData.get('tag') as string,
    urutan: Number(formData.get('urutan') ?? 0),
    is_active: true,
  })
  revalidatePath('/admin/landing')
  revalidateTag('landing-promos')
}

export async function updatePromo(id: string, formData: FormData) {
  const admin = createAdminClient()
  await admin.from('promo').update({
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    tag: formData.get('tag') as string,
    urutan: Number(formData.get('urutan') ?? 0),
  }).eq('id', id)
  revalidatePath('/admin/landing')
  revalidateTag('landing-promos')
}

export async function togglePromoStatus(id: string, current: boolean) {
  const admin = createAdminClient()
  await admin.from('promo').update({ is_active: !current }).eq('id', id)
  revalidatePath('/admin/landing')
  revalidateTag('landing-promos')
}

export async function deletePromo(id: string) {
  const admin = createAdminClient()
  await admin.from('promo').delete().eq('id', id)
  revalidatePath('/admin/landing')
  revalidateTag('landing-promos')
}

// ── Function untuk CRUD FAQ ──────────────────────────────────────────────────────────────────────

export async function createFaq(formData: FormData) {
  const admin = createAdminClient()
  await admin.from('faq').insert({
    question: formData.get('question') as string,
    answer: formData.get('answer') as string,
    urutan: Number(formData.get('urutan') ?? 0),
  })
  revalidatePath('/admin/landing')
  revalidateTag('landing-faqs')
}

export async function updateFaq(id: string, formData: FormData) {
  const admin = createAdminClient()
  await admin.from('faq').update({
    question: formData.get('question') as string,
    answer: formData.get('answer') as string,
    urutan: Number(formData.get('urutan') ?? 0),
  }).eq('id', id)
  revalidatePath('/admin/landing')
  revalidateTag('landing-faqs')
}

export async function deleteFaq(id: string) {
  const admin = createAdminClient()
  await admin.from('faq').delete().eq('id', id)
  revalidatePath('/admin/landing')
  revalidateTag('landing-faqs')
}

// ── Function untuk CRUD AREA LAYANAN ─────────────────────────────────────────────────────────────

export async function createAreaLayanan(formData: FormData) {
  const admin = createAdminClient()
  await admin.from('area_layanan').insert({
    kecamatan: formData.get('kecamatan') as string,
    nagari: formData.get('nagari') as string,
  })
  revalidatePath('/admin/landing')
  revalidateTag('landing-areas')
}

export async function deleteAreaLayanan(id: string) {
  const admin = createAdminClient()
  await admin.from('area_layanan').delete().eq('id', id)
  revalidatePath('/admin/landing')
  revalidateTag('landing-areas')
}

// ── IKLAN / BANNER ────────────────────────────────────────────────────────────

export async function createIklan(formData: FormData) {
  const admin = createAdminClient()
  const imageUrl = formData.get('image_url') as string
  if (!imageUrl) return { error: 'URL gambar wajib diisi.' }

  const { error } = await admin.from('iklan').insert({
    judul: formData.get('judul') as string,
    deskripsi: (formData.get('deskripsi') as string) || null,
    image_url: imageUrl,
    link_url: (formData.get('link_url') as string) || null,
    urutan: Number(formData.get('urutan') ?? 0),
    is_active: true,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/landing')
  revalidatePath('/')
  revalidateTag('landing-iklans')
  return { success: true }
}

export async function updateIklan(id: string, formData: FormData) {
  const admin = createAdminClient()
  const imageUrl = formData.get('image_url') as string
  if (!imageUrl) return { error: 'URL gambar wajib diisi.' }

  const { error } = await admin.from('iklan').update({
    judul: formData.get('judul') as string,
    deskripsi: (formData.get('deskripsi') as string) || null,
    image_url: imageUrl,
    link_url: (formData.get('link_url') as string) || null,
    urutan: Number(formData.get('urutan') ?? 0),
  }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/landing')
  revalidatePath('/')
  revalidateTag('landing-iklans')
  return { success: true }
}

export async function toggleIklanStatus(id: string, current: boolean) {
  const admin = createAdminClient()
  await admin.from('iklan').update({ is_active: !current }).eq('id', id)
  revalidatePath('/admin/landing')
  revalidatePath('/')
  revalidateTag('landing-iklans')
}

export async function deleteIklan(id: string, imageUrl: string) {
  const admin = createAdminClient()

  // Hapus file dari storage jika URL berasal dari Supabase Storage
  if (imageUrl.includes('/storage/v1/object/public/iklan-banners/')) {
    const path = imageUrl.split('/storage/v1/object/public/iklan-banners/')[1]
    if (path) {
      await admin.storage.from('iklan-banners').remove([path])
    }
  }

  await admin.from('iklan').delete().eq('id', id)
  revalidatePath('/admin/landing')
  revalidatePath('/')
  revalidateTag('landing-iklans')
}
