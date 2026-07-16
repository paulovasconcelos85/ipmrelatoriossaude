'use server';

import { signOut } from '@/auth';

export async function logoutAdmin(): Promise<void> {
  await signOut({ redirectTo: '/login' });
}
