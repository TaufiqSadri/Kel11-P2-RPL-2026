import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { StatusLangganan } from '@/types/database'

type AuthUser = {
  id: string
  email?: string
  email_confirmed_at?: string | null
  confirmed_at?: string | null
  user_metadata?: Record<string, unknown>
}

function isEmailConfirmed(user: AuthUser) {
  return Boolean(user.email_confirmed_at ?? user.confirmed_at)
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function asNullableNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function safeNext(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard'
  return value
}

function redirectByStatus(origin: string, status: StatusLangganan, fallback = '/dashboard') {
  if (status === 'pending') return NextResponse.redirect(`${origin}/dashboard/pending`)
  if (status === 'nonaktif') return NextResponse.redirect(`${origin}/dashboard/nonaktif`)
  if (status === 'ditangguhkan') return NextResponse.redirect(`${origin}/dashboard/tagihan`)
  return NextResponse.redirect(`${origin}${fallback === '/dashboard/pending' ? '/dashboard' : fallback}`)
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))
  const shouldReturnToLogin =
    next === '/login' && searchParams.get('success') === 'email_confirmed'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
    }

    const authUser = user as AuthUser
    if (!isEmailConfirmed(authUser)) {
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/login?error=email_not_confirmed`)
    }

    if (authUser.user_metadata?.role === 'admin') {
      return NextResponse.redirect(`${origin}/admin`)
    }

    const admin = createAdminClient()
    const { data: existing, error: existingError } = await admin
      .from('pelanggan')
      .select('status_langganan')
      .eq('user_id', authUser.id)
      .maybeSingle()

    if (existingError) {
      console.error('auth callback pelanggan check error:', existingError)
      return NextResponse.redirect(`${origin}/login?error=profile_check_failed`)
    }

    if (existing?.status_langganan) {
      if (shouldReturnToLogin) {
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/login?success=email_confirmed`)
      }
      return redirectByStatus(origin, existing.status_langganan as StatusLangganan, next)
    }

    const metadata = authUser.user_metadata ?? {}
    const namaLengkap = asString(metadata.nama_lengkap)
    const noHp = asString(metadata.no_hp)
    const alamatPemasangan = asString(metadata.alamat_pemasangan)
    const paketId = asString(metadata.paket_id)

    if (!namaLengkap || !authUser.email || !noHp || !alamatPemasangan || !paketId) {
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/login?error=registration_data_missing`)
    }

    const { data: pelanggan, error: pelangganError } = await admin
      .from('pelanggan')
      .insert({
        user_id: authUser.id,
        nama_lengkap: namaLengkap,
        email: authUser.email,
        no_hp: noHp,
        alamat_pemasangan: alamatPemasangan,
        latitude: asNullableNumber(metadata.latitude),
        longitude: asNullableNumber(metadata.longitude),
        paket_id: paketId,
        status_langganan: 'pending',
      })
      .select('status_langganan')
      .single()

    if (pelangganError) {
      console.error('auth callback pelanggan insert error:', pelangganError)
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/login?error=registration_profile_failed`)
    }

    if (shouldReturnToLogin) {
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/login?success=email_confirmed`)
    }

    return redirectByStatus(
      origin,
      (pelanggan?.status_langganan ?? 'pending') as StatusLangganan,
      next,
    )
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
