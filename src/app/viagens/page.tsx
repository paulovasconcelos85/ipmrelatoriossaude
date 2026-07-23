import Link from 'next/link';
import Dashboard from './Dashboard';
import ViagensView from './ViagensView';
import { listViagensIpm } from '@/lib/viagens-ipm';

export const dynamic = 'force-dynamic';

export default async function ViagensSistemaIpm() {
  const viagens = await listViagensIpm();

  return (
    <>
      <header className="sticky top-0 z-10 bg-primary-900 px-4 py-4 shadow-md sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">
              IPM Maria · Viagens e Atendimentos
            </h1>
            <Link href="/calendario" className="text-sm font-semibold text-primary-100 underline underline-offset-2">
              Calendário 2026
            </Link>
          </div>
          <p className="text-sm text-primary-100">{viagens.length} viagens registradas</p>
        </div>
      </header>

      <main className="w-full flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <Dashboard viagens={viagens} />
        <ViagensView viagens={viagens} />
      </main>
    </>
  );
}
