// src/proxy.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                path: "/",
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
            },
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: (c) => c.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
            }
        }
    )
    const { data: { user } } = await supabase.auth.getUser()
    const { pathname } = request.nextUrl

    if (!user && pathname !== '/' && pathname !== '/auth/error' && !pathname.startsWith('/auth/')) {
        return NextResponse.redirect(new URL('/', request.url))
    }
    return supabaseResponse
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|auth/).*)'],
}
