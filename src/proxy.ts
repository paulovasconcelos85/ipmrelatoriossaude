import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  if (token) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

// Protege só o admin (agora na raiz "/") e as sub-rotas de /admin (edição, cadastros).
// /calendario e /viagens continuam públicas, sem login.
export const config = {
  matcher: ['/', '/admin/:path*'],
};
