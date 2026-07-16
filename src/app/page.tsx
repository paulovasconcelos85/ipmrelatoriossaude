import Link from 'next/link';
import { listViagensIpm, type ViagemIpm } from '@/lib/viagens-ipm';
import ViagemCardAdmin from './admin/ViagemCardAdmin';
import { logoutAdmin } from './logout-action';

export const dynamic = 'force-dynamic';

/**
 * Numeração "Ano-Nr" de cada viagem: usa `numero` quando já existe (importado do sistema
 * antigo) ou calcula a posição da viagem dentro do ano (ordem cronológica) quando não existe.
 */
function calcularNumeracao(viagens: ViagemIpm[]): Map<string, string> {
  const porAno = new Map<number, ViagemIpm[]>();
  for (const v of viagens) {
    const ano = v.ano ?? Number(v.data_saida.slice(0, 4));
    if (!porAno.has(ano)) porAno.set(ano, []);
    porAno.get(ano)!.push(v);
  }

  const numeracao = new Map<string, string>();
  for (const [ano, lista] of porAno) {
    const ordenadaPorData = [...lista].sort((a, b) => a.data_saida.localeCompare(b.data_saida));
    ordenadaPorData.forEach((v, i) => {
      numeracao.set(v.id, v.numero ?? `${ano}-${String(i + 1).padStart(2, '0')}`);
    });
  }
  return numeracao;
}

export default async function AdminViagens() {
  const viagens = await listViagensIpm();
  const numeracao = calcularNumeracao(viagens);

  return (
    <>
      <header className="sticky top-0 z-10 bg-blue-900 px-4 py-4 shadow-md sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">
              Administração de viagens
            </h1>
            <div className="flex items-center gap-4">
              <Link href="/calendario" className="text-sm font-semibold text-blue-100 underline underline-offset-2">
                Calendário
              </Link>
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
                className="rounded-full bg-white px-4 py-2 text-sm font-bold text-blue-900 shadow-sm transition-all duration-150 hover:bg-blue-50 active:scale-95"
              >
                + Nova viagem
              </Link>
              <form action={logoutAdmin}>
                <button
                  type="submit"
                  className="text-sm font-semibold text-blue-100 underline underline-offset-2"
                >
                  Sair
                </button>
              </form>
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
            <ViagemCardAdmin key={v.id} viagem={v} numero={numeracao.get(v.id)} />
          ))}
        </div>
      </main>
    </>
  );
}
