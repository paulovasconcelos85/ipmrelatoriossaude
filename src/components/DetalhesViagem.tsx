import { useMemo } from 'react';
import { gruposAtendimentoComValores } from '@/lib/atendimentos-fields';
import type { ViagemIpm } from '@/lib/viagens-ipm';

/** Todos os dados de uma viagem, no mesmo formato exibido na página pública "/viagens". */
export default function DetalhesViagem({ viagem }: { viagem: ViagemIpm }) {
  const grupos = useMemo(() => gruposAtendimentoComValores(viagem), [viagem]);

  return (
    <div>
      <dl className="mb-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm text-slate-700 sm:grid-cols-2">
        {viagem.area && (
          <div className="flex flex-col">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Área</dt>
            <dd className="break-words">{viagem.area}</dd>
          </div>
        )}
        {viagem.local && (
          <div className="flex flex-col">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Local</dt>
            <dd className="break-words">{viagem.local}</dd>
          </div>
        )}
        <div className="flex flex-col sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Comunidades visitadas</dt>
          <dd className="break-words">
            {viagem.comunidades.length > 0 ? (
              viagem.comunidades.join(', ')
            ) : (
              <span className="italic text-slate-400">Ainda não registradas</span>
            )}
          </dd>
        </div>
        {viagem.dias_missao != null && (
          <div className="flex flex-col">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Dias em missão</dt>
            <dd>{viagem.dias_missao}</dd>
          </div>
        )}
        {viagem.tipo_transporte && (
          <div className="flex flex-col">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Transporte</dt>
            <dd className="break-words">{viagem.tipo_transporte}</dd>
          </div>
        )}
        {viagem.coordenadores.length > 0 && (
          <div className="flex flex-col">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Coordenador(es)</dt>
            <dd className="break-words">{viagem.coordenadores.join(', ')}</dd>
          </div>
        )}
        {viagem.lideres_saude.length > 0 && (
          <div className="flex flex-col">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Líder(es) de saúde</dt>
            <dd className="break-words">{viagem.lideres_saude.join(', ')}</dd>
          </div>
        )}
        {viagem.parceirosComLocal.length > 0 && (
          <div className="flex flex-col sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Parceiros</dt>
            <dd className="break-words">{viagem.parceirosComLocal.join(', ')}</dd>
          </div>
        )}
      </dl>

      {viagem.observacoes && (
        <p className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-sm italic text-slate-600">{viagem.observacoes}</p>
      )}

      <div className="mb-4">
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Voluntários</h3>
        {viagem.voluntarios.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {viagem.voluntarios.map((v, i) => (
              <li key={`${v.nome}-${i}`} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="font-semibold text-slate-800">{v.nome}</span>
                {v.funcao && <span className="text-slate-500">({v.funcao})</span>}
                {v.observacao && <span className="italic text-slate-400">— {v.observacao}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm italic text-slate-400">Ainda não registrados</p>
        )}
      </div>

      {grupos.length > 0 ? (
        <div className="flex flex-col gap-4">
          {grupos.map((grupo) => (
            <div key={grupo.titulo}>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">{grupo.titulo}</h3>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {grupo.campos.map((c) => (
                  <li
                    key={c.label}
                    className={`flex flex-col rounded-lg px-2.5 py-1.5 ${
                      c.destaque ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : 'bg-slate-50'
                    }`}
                  >
                    <span className={`break-words text-xs ${c.destaque ? 'font-semibold text-blue-700' : 'text-slate-500'}`}>
                      {c.label}
                    </span>
                    <span
                      className={`tabular-nums ${
                        c.destaque ? 'text-lg font-extrabold text-blue-900' : 'text-base font-semibold text-slate-900'
                      }`}
                    >
                      {c.valor}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400">Sem atendimentos registrados nesta viagem.</p>
      )}

      {viagem.atendimentosObservacoes && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm italic text-amber-800">
          {viagem.atendimentosObservacoes}
        </p>
      )}

      {viagem.fotos.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Fotos</h3>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {viagem.fotos.map((foto) => (
              <li key={foto.id} className="flex flex-col gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto.url}
                  alt={foto.legenda ?? 'Foto da viagem'}
                  loading="lazy"
                  className="aspect-square w-full rounded-lg object-cover"
                />
                {foto.legenda && <span className="break-words text-xs text-slate-500">{foto.legenda}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
