'use client';

import { useState } from 'react';
import Link from 'next/link';
import FontSizeControl from '@/components/FontSizeControl';

export default function AdminHeader({
  totalViagens,
  onLogout,
}: {
  totalViagens: number;
  onLogout: () => Promise<void>;
}) {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <header className="sticky top-0 z-20 bg-blue-900 shadow-md">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">
            Administração de viagens
          </h1>
          <p className="text-sm text-blue-100">{totalViagens} viagens registradas</p>
        </div>

        <div className="hidden items-center gap-4 sm:flex">
          <FontSizeControl />
          <Link href="/calendario" className="text-sm font-semibold text-blue-100 underline underline-offset-2">
            Calendário
          </Link>
          <Link href="/viagens" className="text-sm font-semibold text-blue-100 underline underline-offset-2">
            Ver lista pública
          </Link>
          <Link href="/admin/cadastros" className="text-sm font-semibold text-blue-100 underline underline-offset-2">
            Cadastros
          </Link>
          <Link
            href="/viagens/nova"
            className="rounded-full bg-white px-4 py-2 text-sm font-bold text-blue-900 shadow-sm transition-all duration-150 hover:bg-blue-50 active:scale-95"
          >
            + Nova viagem
          </Link>
          <form action={onLogout}>
            <button type="submit" className="text-sm font-semibold text-blue-100 underline underline-offset-2">
              Sair
            </button>
          </form>
        </div>

        <button
          type="button"
          onClick={() => setMenuAberto((v) => !v)}
          aria-expanded={menuAberto}
          aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-800 text-2xl text-white transition-all duration-150 active:scale-95 sm:hidden"
        >
          {menuAberto ? '✕' : '☰'}
        </button>
      </div>

      {menuAberto && (
        <div className="border-t border-blue-800 px-4 pb-4 pt-3 sm:hidden">
          <div className="flex flex-col gap-3">
            <FontSizeControl />
            <Link
              href="/viagens/nova"
              className="rounded-full bg-white px-4 py-3 text-center text-base font-bold text-blue-900 shadow-sm active:scale-95"
            >
              + Nova viagem
            </Link>
            <Link
              href="/calendario"
              className="rounded-full border-2 border-blue-700 px-4 py-3 text-center text-base font-semibold text-white active:scale-95"
            >
              Calendário
            </Link>
            <Link
              href="/viagens"
              className="rounded-full border-2 border-blue-700 px-4 py-3 text-center text-base font-semibold text-white active:scale-95"
            >
              Ver lista pública
            </Link>
            <Link
              href="/admin/cadastros"
              className="rounded-full border-2 border-blue-700 px-4 py-3 text-center text-base font-semibold text-white active:scale-95"
            >
              Cadastros
            </Link>
            <form action={onLogout}>
              <button
                type="submit"
                className="w-full rounded-full border-2 border-blue-700 px-4 py-3 text-center text-base font-semibold text-white active:scale-95"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
