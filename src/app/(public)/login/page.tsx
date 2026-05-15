'use client'

import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

function getLoginErrorMessage(code: string | null) {
  if (code === 'email_not_confirmed') {
    return 'Email belum dikonfirmasi. Cek inbox email Anda lalu klik link verifikasi dari Distric Net.'
  }
  if (code === 'registration_data_missing') {
    return 'Data pendaftaran tidak lengkap. Silakan daftar ulang atau hubungi admin.'
  }
  if (code === 'registration_profile_failed') {
    return 'Email sudah terverifikasi, tetapi data pelanggan gagal dibuat. Hubungi admin.'
  }
  if (code === 'auth_callback_failed') {
    return 'Link verifikasi tidak valid atau sudah kedaluwarsa. Coba daftar ulang atau minta link baru.'
  }
  return ''
}

function getLoginSuccessMessage(code: string | null) {
  if (code === 'email_confirmed') {
    return 'Verifikasi akun berhasil. Silakan login, lalu tunggu admin menyetujui data pendaftaran Anda.'
  }
  return ''
}

function isEmailNotConfirmedMessage(message: string) {
  const normalized = message.toLowerCase()
  return normalized.includes('email not confirmed') || normalized.includes('not confirmed')
}

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams(window.location.search)
    const queryError = getLoginErrorMessage(params.get('error'))
    const querySuccess = getLoginSuccessMessage(params.get('success'))
    if (queryError) setError(queryError)
    if (querySuccess) setSuccess(querySuccess)

    async function validateExistingSession() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || cancelled) return

      if (!user.email_confirmed_at) {
        await supabase.auth.signOut()
        if (!cancelled) {
          setError('Email belum dikonfirmasi. Cek inbox email Anda lalu klik link verifikasi dari Distric Net.')
        }
        return
      }

      if (user.user_metadata?.role === 'admin') {
        window.location.href = '/admin'
        return
      }

      const { data: pelanggan } = await supabase
        .from('pelanggan')
        .select('status_langganan')
        .eq('user_id', user.id)
        .maybeSingle()

      if (cancelled) return

      if (!pelanggan) {
        await supabase.auth.signOut()
        if (!cancelled) {
          setError('Login berhasil, tetapi data pelanggan tidak ditemukan. Silakan daftar dulu atau hubungi admin.')
        }
        return
      }

      if (pelanggan.status_langganan === 'pending') {
        window.location.href = '/dashboard/pending'
        return
      }
      if (pelanggan.status_langganan === 'nonaktif') {
        window.location.href = '/dashboard/nonaktif'
        return
      }

      window.location.href = '/dashboard'
    }

    void validateExistingSession()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setError('')
    setSuccess('')
    try {
      const supabase = createClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (oauthError) {
        setError(oauthError.message)
        setGoogleLoading(false)
      }
      // On success the browser will redirect — no further action needed
    } catch {
      setError('Gagal menghubungi layanan Google. Coba lagi.')
      setGoogleLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
  
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
  
    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
  
    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        setError('Email atau password salah.')
      } else if (isEmailNotConfirmedMessage(signInError.message)) {
        setError('Email belum dikonfirmasi. Cek inbox email Anda lalu klik link verifikasi dari Distric Net.')
      } else {
        setError(signInError.message)
      }
      setLoading(false)
      return
    }
  
    const user = data.user
    if (!user) {
      setError('Gagal login. Coba lagi.')
      setLoading(false)
      return
    }

    if (!user.email_confirmed_at) {
      await supabase.auth.signOut()
      setError('Email belum dikonfirmasi. Cek inbox email Anda lalu klik link verifikasi dari Distric Net.')
      setLoading(false)
      return
    }
  
    const isAdmin = user.user_metadata?.role === 'admin'
    if (isAdmin) {
      window.location.href = '/admin'
      return
    }
  
    const { data: pelanggan, error: pelangganError } = await supabase
      .from('pelanggan')
      .select('status_langganan')
      .eq('user_id', user.id)
      .maybeSingle()

    if (pelangganError || !pelanggan) {
      await supabase.auth.signOut()
      setError('Login berhasil, tetapi data pelanggan tidak ditemukan. Silakan daftar dulu atau hubungi admin.')
      setLoading(false)
      return
    }
  
    if (pelanggan.status_langganan === 'pending') {
      window.location.href = '/dashboard/pending'
      return
    }
    if (pelanggan.status_langganan === 'nonaktif') {
      window.location.href = '/dashboard/nonaktif'
      return
    }
    window.location.href = '/dashboard'
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-card">
          <div className="mb-8 text-center">
            <h1 className="font-display text-4xl font-bold text-gray-900">Selamat Datang</h1>
            <p className="mt-1 text-sm text-gray-500">
              Masuk ke akun Distric Net Anda untuk mengelola layanan internet.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="flex h-14 w-full items-center justify-center gap-4 rounded-lg border border-gray-200 bg-white text-lg font-bold text-gray-700 transition hover:border-[#68247B] hover:bg-purple-50 disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader2 size={18} className="animate-spin text-gray-400" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M18.8 10.2085C18.8 9.5585 18.7417 8.9335 18.6333 8.3335H10V11.8835H14.9333C14.7167 13.0252 14.0667 13.9918 13.0917 14.6418V16.9502H16.0667C17.8 15.3502 18.8 13.0002 18.8 10.2085Z" fill="#4285F4"/>
                <path d="M9.99998 19.1667C12.475 19.1667 14.55 18.35 16.0667 16.95L13.0917 14.6417C12.275 15.1917 11.2333 15.525 9.99998 15.525C7.61665 15.525 5.59165 13.9167 4.86665 11.75H1.81665V14.1167C3.32498 17.1083 6.41665 19.1667 9.99998 19.1667Z" fill="#34A853"/>
                <path d="M4.86671 11.7416C4.68337 11.1916 4.57504 10.6083 4.57504 9.99993C4.57504 9.3916 4.68337 8.80827 4.86671 8.25827V5.8916H1.81671C1.19171 7.12493 0.833374 8.5166 0.833374 9.99993C0.833374 11.4833 1.19171 12.8749 1.81671 14.1083L4.19171 12.2583L4.86671 11.7416Z" fill="#FBBC05"/>
                <path d="M9.99998 4.4835C11.35 4.4835 12.55 4.95016 13.5083 5.85016L16.1333 3.22516C14.5417 1.74183 12.475 0.833496 9.99998 0.833496C6.41665 0.833496 3.32498 2.89183 1.81665 5.89183L4.86665 8.2585C5.59165 6.09183 7.61665 4.4835 9.99998 4.4835Z" fill="#EA4335"/>
              </svg>
            )}
            Masuk dengan Google
          </button>

          <div className="my-8 flex items-center gap-5 text-base font-semibold text-gray-500">
            <span className="h-px flex-1 bg-[#e3d8ea]" />
            atau
            <span className="h-px flex-1 bg-[#e3d8ea]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Alamat Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="nama@email.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-brand-pink focus:outline-none focus:ring-2 focus:ring-brand-pink/30"
              />
            </div>

            <div>
              <div className="mb-1 flex justify-between">
                <label className="text-sm font-medium text-gray-700">Kata Sandi</label>
                <Link href="/auth/forgot-password" className="text-xs text-brand-purple hover:underline">
                  Lupa kata sandi?
                </Link>
              </div>
              <div className="relative">
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-11 text-sm transition focus:border-brand-pink focus:outline-none focus:ring-2 focus:ring-brand-pink/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-purple py-3 font-display font-semibold text-white transition hover:bg-brand-purple/90 disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Masuk
            </button>

            <p className="text-center text-sm text-gray-500">
              Belum punya akun?{' '}
              <Link href="/register" className="font-semibold text-brand-purple hover:underline">
                Daftar Sekarang
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
