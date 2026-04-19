import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/dashboard";
  // Validate next is a relative path
  const safePath = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/dashboard';

  // No code param — this is a direct hit or prefetch, not a real callback.
  // Redirect to login quietly instead of the error page.
  if (!code) {
    console.warn('[auth/callback] No code param — redirecting to login.');
    return NextResponse.redirect(`${origin}/`);
  }

  const response = NextResponse.redirect(`${origin}${safePath}`);

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
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (!error) {
    console.log('[auth/callback] Session exchange successful, redirecting to', safePath);
    return response;
  }

  // Log the real error so it shows up in Next.js server logs
  console.error('[auth/callback] exchangeCodeForSession failed:', {
    message: error.message,
    code: error.code,
    status: error.status,
  });

  // Pass the actual error code to the error page for a helpful message
  const errorCode = error.code ?? error.status?.toString() ?? 'unknown';
  return NextResponse.redirect(`${origin}/auth/error?error_code=${encodeURIComponent(errorCode)}`);
}
