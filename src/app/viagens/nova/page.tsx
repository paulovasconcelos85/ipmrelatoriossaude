import Link from 'next/link';
import NovaViagemForm from './NovaViagemForm';
import { listTiposTransporte, listBarcos, listParceiros, listProfissionais } from '@/lib/viagens-ipm';

export const dynamic = 'force-dynamic';

export default async function NovaViagem() {
  const [tiposTransporte, barcos, parceiros, profissionais] = await Promise.all([
    listTiposTransporte(),
    listBarcos(),
    listParceiros(),
    listProfissionais(),
  ]);

  return (
    <>
      <header className="sticky top-0 z-10 bg-blue-900 px-4 py-4 shadow-md">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">
              Nova viagem
            </h1>
            <Link href="/viagens" className="text-sm font-semibold text-blue-100 underline underline-offset-2">
              ← Voltar para a lista
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-6">
        <NovaViagemForm
          tiposTransporte={tiposTransporte}
          barcos={barcos}
          parceiros={parceiros}
          profissionais={profissionais}
        />
      </main>
    </>
  );
}
