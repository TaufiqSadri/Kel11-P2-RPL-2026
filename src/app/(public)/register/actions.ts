'use server'

import { createClient } from '@/lib/supabase/server'
import type { RegisterFormData } from '@/types/database'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export async function registerAction(formData: FormData) {
  const supabase = await createClient()

  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (password !== confirmPassword) {
    return { error: 'Password tidak cocok.' }
  }
  if (password.length < 8) {
    return { error: 'Password minimal 8 karakter.' }
  }

  const data: RegisterFormData = {
    nama_lengkap: formData.get('nama_lengkap') as string,
    email: formData.get('email') as string,
    no_hp: formData.get('no_hp') as string,
    alamat_pemasangan: formData.get('alamat_pemasangan') as string,
    latitude: formData.get('latitude') ? Number(formData.get('latitude')) : null,
    longitude: formData.get('longitude') ? Number(formData.get('longitude')) : null,
    paket_id: formData.get('paket_id') as string,
  }

  if (
    !data.nama_lengkap ||
    !data.email ||
    !data.no_hp ||
    !data.alamat_pemasangan ||
    !data.paket_id
  ) {
    return { error: 'Semua field wajib diisi.' }
  }

  const origin =
    headers().get('origin') ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000'

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/login&success=email_confirmed`,
      data: {
        nama_lengkap: data.nama_lengkap,
        no_hp: data.no_hp,
        alamat_pemasangan: data.alamat_pemasangan,
        latitude: data.latitude,
        longitude: data.longitude,
        paket_id: data.paket_id,
      },
    },
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      return { error: 'Email ini sudah terdaftar. Silakan login.' }
    }
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Gagal membuat akun. Coba lagi.' }
  }

  if (authData.session) {
    await supabase.auth.signOut()
  }

  redirect('/register/success')
}
