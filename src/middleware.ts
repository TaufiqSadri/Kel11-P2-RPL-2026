import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type CookieToSet = {
  name: string
  value: string
  options?: Record<string, unknown>
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as never),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const isEmailConfirmed = Boolean(user?.email_confirmed_at ?? user?.confirmed_at)

  if (user && !isEmailConfirmed && (path.startsWith('/dashboard') || path.startsWith('/admin'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'email_not_confirmed')
    return NextResponse.redirect(url)
  }

  // 1. Protect /dashboard dan /admin - redirect ke login kalau belum auth
  if (!user && (path.startsWith('/dashboard') || path.startsWith('/admin'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  // 2. Kalau sudah login dan akses /admin, pastikan dia admin
  if (user && isEmailConfirmed && path.startsWith('/admin')) {
    const isAdmin = user.user_metadata?.role === 'admin'
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // 3. Kalau sudah login dan akses halaman auth (/login, /register)
  //    → redirect sesuai role, TAPI hormati ?redirect param dulu
  if (user && isEmailConfirmed && (path === '/login' || (path.startsWith('/register') && !path.startsWith('/register/success')))) {
    const redirectTo = request.nextUrl.searchParams.get('redirect')
    const isAdmin = user.user_metadata?.role === 'admin'

    // Tidak query DB di sini — status langganan dicek di page level
    if (redirectTo && redirectTo.startsWith('/')) {
      // Validasi redirect param - jangan redirect ke /admin kalau bukan admin
      if (redirectTo.startsWith('/admin') && !isAdmin) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }

    // Tidak ada redirect param, arahkan sesuai role
    return NextResponse.redirect(new URL(isAdmin ? '/admin' : '/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Hanya jalankan middleware di route yang butuh auth
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/register/:path*',
    '/auth/:path*',
  ],
}
