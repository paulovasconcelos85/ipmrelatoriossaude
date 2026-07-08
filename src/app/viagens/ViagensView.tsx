'use client';

import { useMemo, useState } from 'react';
import { formatarPeriodo } from '@/lib/format';
import { ATENDIMENTOS_CAMPOS, ATENDIMENTOS_GRUPOS } from '@/lib/atendimentos-fields';
import type { ViagemIpm } from '@/lib/viagens-ipm';

type Modo = 'cards' | 'tabela';

function tituloViagem(v: ViagemIpm): string {
  return v.barco ?? v.parceiros[0] ?? v.tipo_transporte ?? 'Viagem sem barco/parceiro';
}

function grupoComValores(v: ViagemIpm) {
  return ATENDIMENTOS_GRUPOS.map((grupo) => ({
    titulo: grupo.titulo,
    campos: grupo.campos
      .map((campo) => ({ label: campo.label, valor: v.atendimentos[campo.name], destaque: campo.destaque }))
      .filter((c) => typeof c.valor === 'number' && c.valor > 0),
  })).filter((g) => g.campos.length > 0);
}

function ViagemCard({
  viagem,
  aberto,
  onToggle,
}: {
  viagem: ViagemIpm;
  aberto: boolean;
  onToggle: () => void;
}) {
  const grupos = useMemo(() => grupoComValores(viagem), [viagem]);

  return (
    <li className="rounded-2xl border-2 border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={aberto}
        className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            {viagem.numero && (
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-900">
                Nº {viagem.numero}
              </span>
            )}
            {viagem.cancelada && (
              <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">
                Cancelada
              </span>
            )}
          </div>
          <p className="break-words text-lg font-bold leading-snug text-blue-900">{tituloViagem(viagem)}</p>
          <p className="break-words text-sm text-slate-500">
            {formatarPeriodo(viagem.data_saida, viagem.data_chegada)}
            {viagem.tipo_missao && ` · ${viagem.tipo_missao}`}
          </p>
        </div>
        <span className="mt-1 shrink-0 text-xl text-slate-400" aria-hidden>
          {aberto ? '−' : '+'}
        </span>
      </button>

      {aberto && (
        <div className="border-t border-slate-100 px-5 py-4">
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
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Comunidades visitadas
              </dt>
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
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Dias em missão
                </dt>
                <dd>{viagem.dias_missao}</dd>
              </div>
            )}
            {viagem.tipo_transporte && (
              <div className="flex flex-col">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Transporte</dt>
                <dd className="break-words">{viagem.tipo_transporte}</dd>
              </div>
            )}
            {viagem.coordenador && (
              <div className="flex flex-col">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Coordenador</dt>
                <dd className="break-words">{viagem.coordenador}</dd>
              </div>
            )}
            {viagem.lider_saude && (
              <div className="flex flex-col">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Líder de saúde
                </dt>
                <dd className="break-words">{viagem.lider_saude}</dd>
              </div>
            )}
            {viagem.parceiros.length > 0 && (
              <div className="flex flex-col sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Parceiros</dt>
                <dd className="break-words">{viagem.parceiros.join(', ')}</dd>
              </div>
            )}
          </dl>

          {viagem.observacoes && (
            <p className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-sm italic text-slate-600">
              {viagem.observacoes}
            </p>
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
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                    {grupo.titulo}
                  </h3>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {grupo.campos.map((c) => (
                      <li
                        key={c.label}
                        className={`flex flex-col rounded-lg px-2.5 py-1.5 ${
                          c.destaque ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : 'bg-slate-50'
                        }`}
                      >
                        <span
                          className={`break-words text-xs ${c.destaque ? 'font-semibold text-blue-700' : 'text-slate-500'}`}
                        >
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
        </div>
      )}
    </li>
  );
}

const COLUNAS_BASICAS = 17;
const TOTAL_COLUNAS = COLUNAS_BASICAS + ATENDIMENTOS_CAMPOS.length;

function ViagensTabela({ viagens }: { viagens: ViagemIpm[] }) {
  return (
    <div className="max-h-[75vh] overflow-auto rounded-2xl border-2 border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 whitespace-nowrap text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50">
          <tr>
            <th className="px-3 py-3 text-left font-semibold text-slate-600">Nº</th>
            <th className="px-3 py-3 text-left font-semibold text-slate-600">Ano</th>
            <th className="px-3 py-3 text-left font-semibold text-slate-600">Data saída</th>
            <th className="px-3 py-3 text-left font-semibold text-slate-600">Data chegada</th>
            <th className="px-3 py-3 text-right font-semibold text-slate-600">Dias</th>
            <th className="px-3 py-3 text-left font-semibold text-slate-600">Tipo de missão</th>
            <th className="px-3 py-3 text-left font-semibold text-slate-600">Tipo de transporte</th>
            <th className="px-3 py-3 text-left font-semibold text-slate-600">Barco</th>
            <th className="px-3 py-3 text-left font-semibold text-slate-600">Área</th>
            <th className="px-3 py-3 text-left font-semibold text-slate-600">Local</th>
            <th className="px-3 py-3 text-left font-semibold text-slate-600">Comunidades visitadas</th>
            <th className="px-3 py-3 text-left font-semibold text-slate-600">Parceiros</th>
            <th className="px-3 py-3 text-left font-semibold text-slate-600">Coordenador</th>
            <th className="px-3 py-3 text-left font-semibold text-slate-600">Líder de Saúde</th>
            <th className="px-3 py-3 text-left font-semibold text-slate-600">Voluntários</th>
            <th className="px-3 py-3 text-left font-semibold text-slate-600">Cancelada</th>
            <th className="px-3 py-3 text-left font-semibold text-slate-600">Observações</th>
            {ATENDIMENTOS_CAMPOS.map((campo) => (
              <th key={campo.name} className="px-3 py-3 text-right font-semibold text-slate-600">
                {campo.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {viagens.map((v) => (
            <tr key={v.id} className="hover:bg-slate-50">
              <td className="px-3 py-3 text-slate-500">{v.numero ?? '—'}</td>
              <td className="px-3 py-3 text-slate-700">{v.ano ?? '—'}</td>
              <td className="px-3 py-3 text-slate-700">{v.data_saida}</td>
              <td className="px-3 py-3 text-slate-700">{v.data_chegada ?? '—'}</td>
              <td className="px-3 py-3 text-right tabular-nums text-slate-700">{v.dias_missao ?? '—'}</td>
              <td className="px-3 py-3 text-slate-700">{v.tipo_missao ?? '—'}</td>
              <td className="px-3 py-3 text-slate-700">{v.tipo_transporte ?? '—'}</td>
              <td className="px-3 py-3 text-slate-700">{v.barco ?? '—'}</td>
              <td className="px-3 py-3 text-slate-700">{v.area ?? '—'}</td>
              <td className="px-3 py-3 text-slate-700">{v.local ?? '—'}</td>
              <td className="whitespace-normal px-3 py-3 text-slate-700">
                {v.comunidades.length > 0 ? v.comunidades.join(', ') : '—'}
              </td>
              <td className="whitespace-normal px-3 py-3 text-slate-700">
                {v.parceiros.length > 0 ? v.parceiros.join(', ') : '—'}
              </td>
              <td className="px-3 py-3 text-slate-700">{v.coordenador ?? '—'}</td>
              <td className="px-3 py-3 text-slate-700">{v.lider_saude ?? '—'}</td>
              <td className="whitespace-normal px-3 py-3 text-slate-700">
                {v.voluntarios.length > 0
                  ? v.voluntarios.map((vol) => (vol.funcao ? `${vol.nome} (${vol.funcao})` : vol.nome)).join(', ')
                  : '—'}
              </td>
              <td className="px-3 py-3 text-slate-700">{v.cancelada ? 'Sim' : 'Não'}</td>
              <td className="whitespace-normal px-3 py-3 text-slate-700">{v.observacoes ?? '—'}</td>
              {ATENDIMENTOS_CAMPOS.map((campo) => (
                <td key={campo.name} className="px-3 py-3 text-right tabular-nums text-slate-700">
                  {v.atendimentos[campo.name] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
          {viagens.length === 0 && (
            <tr>
              <td colSpan={TOTAL_COLUNAS} className="px-4 py-8 text-center text-slate-500">
                Nenhuma viagem encontrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function ViagensView({ viagens }: { viagens: ViagemIpm[] }) {
  const [modo, setModo] = useState<Modo>('cards');
  const [abertos, setAbertos] = useState<Set<string>>(new Set());

  function alternar(id: string) {
    setAbertos((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border-2 border-slate-200 bg-white p-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setModo('cards')}
            className={`rounded-full px-4 py-1.5 ${modo === 'cards' ? 'bg-blue-900 text-white' : 'text-slate-600'}`}
          >
            Cards
          </button>
          <button
            type="button"
            onClick={() => setModo('tabela')}
            className={`rounded-full px-4 py-1.5 ${modo === 'tabela' ? 'bg-blue-900 text-white' : 'text-slate-600'}`}
          >
            Tabela
          </button>
        </div>

        {modo === 'cards' && (
          <div className="flex gap-2 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setAbertos(new Set(viagens.map((v) => v.id)))}
              className="rounded-full border-2 border-slate-200 bg-white px-3 py-1.5 text-slate-600"
            >
              Abrir todos
            </button>
            <button
              type="button"
              onClick={() => setAbertos(new Set())}
              className="rounded-full border-2 border-slate-200 bg-white px-3 py-1.5 text-slate-600"
            >
              Fechar todos
            </button>
          </div>
        )}
      </div>

      {modo === 'cards' ? (
        <ul className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {viagens.map((v) => (
            <ViagemCard key={v.id} viagem={v} aberto={abertos.has(v.id)} onToggle={() => alternar(v.id)} />
          ))}
          {viagens.length === 0 && (
            <li className="col-span-full rounded-2xl border-2 border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
              Nenhuma viagem encontrada.
            </li>
          )}
        </ul>
      ) : (
        <ViagensTabela viagens={viagens} />
      )}
    </div>
  );
}
