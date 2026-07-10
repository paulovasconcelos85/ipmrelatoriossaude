'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, checkAdminPassword, createAdminSessionToken } from '@/lib/admin-auth';

export type EstadoLogin = { erro?: string } | undefined;

export async function loginAdmin(_estadoAnterior: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const senha = formData.get('senha');
  const next = formData.get('next');
  const destino = typeof next === 'string' && next.startsWith('/admin') ? next : '/admin';

  if (typeof senha !== 'string' || !checkAdminPassword(senha)) {
    return { erro: 'Senha incorreta.' };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });

  redirect(destino);
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect('/admin/login');
}
