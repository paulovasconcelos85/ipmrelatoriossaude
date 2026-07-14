'use client';

import { useState } from 'react';
import Link from 'next/link';
import DetalhesViagem from '@/components/DetalhesViagem';
import RelatorioPdfViagem from '@/components/RelatorioPdfViagem';
import { formatarPeriodo } from '@/lib/format';
import type { ViagemIpm } from '@/lib/viagens-ipm';
import ExcluirViagemButton from './ExcluirViagemButton';

export default function ViagemCardAdmin({ viagem, numero }: { viagem: ViagemIpm; numero: string | undefined }) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-bold text-slate-900">
            {numero}
            {viagem.cancelada && (
              <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                Cancelada
              </span>
            )}
          </p>
          <p className="text-sm text-slate-600">{formatarPeriodo(viagem.data_saida, viagem.data_chegada)}</p>
          <p className="text-sm text-slate-600">
            {[viagem.area, viagem.local].filter(Boolean).join(' · ') || 'Sem área/local informado'}
          </p>
          {viagem.barco && <p className="text-sm text-slate-500">Barco: {viagem.barco}</p>}
          <p className="text-sm text-slate-500">
            {viagem.coordenador ? `Coordenador: ${viagem.coordenador}` : 'Sem coordenador'}
          </p>
          {viagem.parceiros.length > 0 && (
            <p className="text-sm text-slate-500">Parceiros: {viagem.parceiros.join(', ')}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/${viagem.id}`}
            className="rounded-full border-2 border-blue-900 px-4 py-2 text-sm font-bold text-blue-900 transition-all duration-150 hover:bg-blue-50 active:scale-95"
          >
            Editar
          </Link>
          <RelatorioPdfViagem viagem={viagem} />
          <ExcluirViagemButton id={viagem.id} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
      >
        {aberto ? 'Ocultar todos os dados' : 'Ver todos os dados da viagem'}
        <span aria-hidden>{aberto ? '▲' : '▼'}</span>
      </button>

      {aberto && (
        <div className="border-t border-slate-100 px-5 py-4">
          <DetalhesViagem viagem={viagem} />
        </div>
      )}
    </div>
  );
}
