'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(
  _prevState: { error?: string },
  formData: FormData,
) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email dan password wajib diisi.' }
  }

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Email atau password salah.' }
    }
    return { error: error.message }
  }

  const user = signInData.user
  if (!user) {
    return { error: 'Gagal login. Coba lagi.' }
  }

  const isAdmin = user?.user_metadata?.role === 'admin'
  if (isAdmin) {
    redirect('/admin')
  }

  // Baru cek pelanggan
  const { data: pelanggan, error: pelangganError } = await supabase
    .from('pelanggan')
    .select('status_langganan')
    .eq('user_id', user.id)
    .maybeSingle()

  if (pelangganError || !pelanggan) {
    await supabase.auth.signOut()
    return { error: 'Login berhasil, tetapi data pelanggan tidak ditemukan. Silakan daftar dulu atau hubungi admin.' }
  }

  if (pelanggan.status_langganan === 'pending') {
    redirect('/dashboard/pending')
  }
  if (pelanggan.status_langganan === 'nonaktif') {
    redirect('/dashboard/nonaktif')
  }
  redirect('/dashboard')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
