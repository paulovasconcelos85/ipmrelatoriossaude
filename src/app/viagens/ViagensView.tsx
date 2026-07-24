'use client';

import { useState } from 'react';
import { formatarPeriodo } from '@/lib/format';
import { ATENDIMENTOS_CAMPOS } from '@/lib/atendimentos-fields';
import DetalhesViagem from '@/components/DetalhesViagem';
import type { ViagemIpm } from '@/lib/viagens-ipm';

type Modo = 'cards' | 'tabela';

/** Título usado quando não há barco cadastrado: primeiro parceiro ou o tipo de transporte. */
function tituloViagemSemBarco(v: ViagemIpm): string {
  return v.parceiros[0] ?? v.tipo_transporte ?? 'Viagem sem barco/parceiro';
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
              <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-bold text-primary-900">
                Nº {viagem.numero}
              </span>
            )}
            {viagem.cancelada && (
              <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">
                Cancelada
              </span>
            )}
          </div>
          <p className="break-words text-lg font-bold leading-snug text-primary-900">
            {viagem.barco ?? tituloViagemSemBarco(viagem)}
            {viagem.barco && viagem.parceirosComLocal.length > 0 && (
              <span className="ml-2 text-sm font-semibold text-slate-500">
                · {viagem.parceirosComLocal.join(', ')}
              </span>
            )}
          </p>
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
          <DetalhesViagem viagem={viagem} />
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
                {v.parceirosComLocal.length > 0 ? v.parceirosComLocal.join(', ') : '—'}
              </td>
              <td className="whitespace-normal px-3 py-3 text-slate-700">
                {v.coordenadores.length > 0 ? v.coordenadores.join(', ') : '—'}
              </td>
              <td className="whitespace-normal px-3 py-3 text-slate-700">
                {v.lideres_saude.length > 0 ? v.lideres_saude.join(', ') : '—'}
              </td>
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
            className={`rounded-full px-4 py-1.5 ${modo === 'cards' ? 'bg-primary-900 text-white' : 'text-slate-600'}`}
          >
            Cards
          </button>
          <button
            type="button"
            onClick={() => setModo('tabela')}
            className={`rounded-full px-4 py-1.5 ${modo === 'tabela' ? 'bg-primary-900 text-white' : 'text-slate-600'}`}
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
        <ul className="flex flex-col gap-3">
          {viagens.map((v) => (
            <ViagemCard key={v.id} viagem={v} aberto={abertos.has(v.id)} onToggle={() => alternar(v.id)} />
          ))}
          {viagens.length === 0 && (
            <li className="rounded-2xl border-2 border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
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
