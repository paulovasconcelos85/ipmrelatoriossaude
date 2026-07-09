import Link from 'next/link';
import { listViagensIpm } from '@/lib/viagens-ipm';
import { formatarPeriodo } from '@/lib/format';
import ExcluirViagemButton from './ExcluirViagemButton';

export const dynamic = 'force-dynamic';

export default async function AdminViagens() {
  const viagens = await listViagensIpm();

  return (
    <>
      <header className="sticky top-0 z-10 bg-blue-900 px-4 py-4 shadow-md sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">
              Administração de viagens
            </h1>
            <div className="flex items-center gap-4">
              <Link href="/viagens" className="text-sm font-semibold text-blue-100 underline underline-offset-2">
                Ver lista pública
              </Link>
              <Link
                href="/admin/cadastros"
                className="text-sm font-semibold text-blue-100 underline underline-offset-2"
              >
                Cadastros
              </Link>
              <Link
                href="/viagens/nova"
                className="rounded-full bg-white px-4 py-2 text-sm font-bold text-blue-900 shadow-sm"
              >
                + Nova viagem
              </Link>
            </div>
          </div>
          <p className="text-sm text-blue-100">{viagens.length} viagens registradas</p>
        </div>
      </header>

      <main className="w-full flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          {viagens.length === 0 && (
            <p className="rounded-2xl border-2 border-slate-200 bg-white p-5 text-center text-slate-500 shadow-sm">
              Nenhuma viagem cadastrada ainda.
            </p>
          )}

          {viagens.map((v) => (
            <div
              key={v.id}
              className="flex flex-col gap-3 rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-base font-bold text-slate-900">
                  {formatarPeriodo(v.data_saida, v.data_chegada)}
                  {v.cancelada && (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                      Cancelada
                    </span>
                  )}
                </p>
                <p className="text-sm text-slate-600">
                  {[v.area, v.local].filter(Boolean).join(' · ') || 'Sem área/local informado'}
                </p>
                <p className="text-sm text-slate-500">
                  {v.coordenador ? `Coordenador: ${v.coordenador}` : 'Sem coordenador'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/${v.id}`}
                  className="rounded-full border-2 border-blue-900 px-4 py-2 text-sm font-bold text-blue-900"
                >
                  Editar
                </Link>
                <ExcluirViagemButton id={v.id} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
