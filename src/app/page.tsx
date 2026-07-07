import FontSizeControl from '@/components/FontSizeControl';
import ScrollToAtual from '@/components/ScrollToAtual';
import { getViagens } from '@/lib/viagens';
import {
  calcularStatus,
  chaveMes,
  diaSemanaCurto,
  formatarPeriodo,
  nomeMes,
  type StatusViagem,
} from '@/lib/format';

export const dynamic = 'force-dynamic';

const STATUS_CONFIG: Record<StatusViagem, { rotulo: string; badge: string; borda: string }> = {
  realizada: {
    rotulo: 'Já aconteceu',
    badge: 'bg-slate-500 text-white',
    borda: 'border-slate-200',
  },
  em_andamento: {
    rotulo: 'Em andamento',
    badge: 'bg-emerald-600 text-white',
    borda: 'border-emerald-400',
  },
  agendada: {
    rotulo: 'Programada',
    badge: 'bg-blue-100 text-blue-900',
    borda: 'border-slate-200',
  },
};

export default async function Home() {
  const { viagens, usandoDadosLocais } = await getViagens();

  const grupos = new Map<string, typeof viagens>();
  for (const viagem of viagens) {
    const chave = chaveMes(viagem.data_saida);
    const lista = grupos.get(chave) ?? [];
    lista.push(viagem);
    grupos.set(chave, lista);
  }
  const meses = [...grupos.entries()].sort(([a], [b]) => a.localeCompare(b));

  const viagemAtual = viagens.find(
    (v) => calcularStatus(v.data_saida, v.data_retorno) !== 'realizada',
  );

  return (
    <>
      <ScrollToAtual />
      <header className="sticky top-0 z-10 bg-blue-900 px-4 py-4 shadow-md">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">
              Calendário de Viagens 2026
            </h1>
            <FontSizeControl />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-blue-100">
            <span>Toque em A+ para aumentar o tamanho da letra</span>
            {viagemAtual && (
              <a href="#topo" className="font-semibold underline underline-offset-2">
                Ver viagens anteriores ↑
              </a>
            )}
          </div>
        </div>
      </header>

      <main id="topo" className="scroll-mt-24 mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-6">
        {usandoDadosLocais && (
          <p className="mb-6 rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-base text-amber-900">
            Mostrando dados locais de exemplo. Configure o Supabase para ver os dados sempre atualizados.
          </p>
        )}

        {meses.map(([chave, viagensDoMes]) => (
          <section key={chave} className="mb-10">
            <h2 className="mb-4 text-lg font-bold capitalize text-blue-900 sm:text-xl">
              {nomeMes(viagensDoMes[0].data_saida)}
            </h2>

            <ul className="flex flex-col gap-4">
              {viagensDoMes.map((viagem, i) => {
                const status = calcularStatus(viagem.data_saida, viagem.data_retorno);
                const config = STATUS_CONFIG[status];
                const ehAtual = viagem === viagemAtual;
                return (
                <li
                  key={`${viagem.data_saida}-${i}`}
                  id={ehAtual ? 'viagem-atual' : undefined}
                  className={`scroll-mt-36 rounded-2xl border-2 bg-white p-5 shadow-sm ${
                    viagem.cancelada
                      ? 'border-red-300 opacity-80'
                      : status === 'realizada'
                        ? `${config.borda} opacity-70`
                        : config.borda
                  } ${ehAtual ? 'ring-4 ring-blue-300' : ''}`}
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-lg font-bold text-blue-900 sm:text-xl">
                      {formatarPeriodo(viagem.data_saida, viagem.data_retorno)}
                    </p>
                    {viagem.cancelada ? (
                      <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-bold text-white">
                        Cancelada
                      </span>
                    ) : (
                      <span className={`rounded-full px-3 py-1 text-sm font-bold ${config.badge}`}>
                        {config.rotulo}
                      </span>
                    )}
                  </div>

                  <p className="mb-3 text-sm capitalize text-slate-500">
                    saída {diaSemanaCurto(viagem.data_saida)}
                  </p>

                  {viagem.grupo && (
                    <p className="mb-3 text-lg font-semibold leading-snug text-slate-900">{viagem.grupo}</p>
                  )}

                  {viagem.grupo_complemento && (
                    <p className="mb-3 text-base leading-snug text-slate-700">{viagem.grupo_complemento}</p>
                  )}

                  <dl className="flex flex-col gap-2 text-base text-slate-700">
                    {viagem.regiao_rio && (
                      <div className="flex gap-2">
                        <dt className="font-semibold text-slate-500">Região/Rio:</dt>
                        <dd>{viagem.regiao_rio}</dd>
                      </div>
                    )}
                    {viagem.responsavel_grupo && (
                      <div className="flex gap-2">
                        <dt className="font-semibold text-slate-500">Responsável:</dt>
                        <dd>{viagem.responsavel_grupo}</dd>
                      </div>
                    )}
                    {viagem.coordenador && (
                      <div className="flex gap-2">
                        <dt className="font-semibold text-slate-500">Coordenador:</dt>
                        <dd>{viagem.coordenador}</dd>
                      </div>
                    )}
                    {viagem.barco_local && (
                      <div className="flex gap-2">
                        <dt className="font-semibold text-slate-500">Barco/Local:</dt>
                        <dd>{viagem.barco_local}</dd>
                      </div>
                    )}
                  </dl>

                  {viagem.observacoes && (
                    <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-base italic text-slate-600">
                      {viagem.observacoes}
                    </p>
                  )}
                </li>
                );
              })}
            </ul>
          </section>
        ))}
      </main>
    </>
  );
}
