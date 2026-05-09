'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath, revalidateTag } from 'next/cache'

// ── PROMO ─────────────────────────────────────────────────────────────────────

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

// ── FAQ ───────────────────────────────────────────────────────────────────────

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

// ── AREA LAYANAN ──────────────────────────────────────────────────────────────

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
