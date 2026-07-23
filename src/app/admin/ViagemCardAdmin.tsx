'use client';

import { useState } from 'react';
import Link from 'next/link';
import CompartilharWhatsapp from '@/components/CompartilharWhatsapp';
import DetalhesViagem from '@/components/DetalhesViagem';
import RelatorioPdfViagem from '@/components/RelatorioPdfViagem';
import { formatarPeriodo } from '@/lib/format';
import type { ViagemIpm } from '@/lib/viagens-ipm';
import ExcluirViagemButton from './ExcluirViagemButton';

export default function ViagemCardAdmin({ viagem, numero }: { viagem: ViagemIpm; numero: string | undefined }) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm">
      <div className="p-4 sm:p-5">
        <p className="text-lg font-bold text-slate-900">
          {numero}
          {viagem.cancelada && (
            <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-sm font-bold text-red-700">
              Cancelada
            </span>
          )}
        </p>
        <p className="mt-1 text-base text-slate-600">{formatarPeriodo(viagem.data_saida, viagem.data_chegada)}</p>
        <p className="text-base text-slate-600">
          {[viagem.area, viagem.local].filter(Boolean).join(' · ') || 'Sem área/local informado'}
        </p>
        {viagem.barco && <p className="text-base text-slate-500">Barco: {viagem.barco}</p>}
        <p className="text-base text-slate-500">
          {viagem.coordenadores.length > 0 ? `Coordenador(es): ${viagem.coordenadores.join(', ')}` : 'Sem coordenador'}
        </p>
        {viagem.parceirosComLocal.length > 0 && (
          <p className="text-base text-slate-500">Parceiros: {viagem.parceirosComLocal.join(', ')}</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex w-full items-center justify-center gap-2 bg-accent-500 py-4 text-lg font-bold text-white transition-all duration-150 hover:bg-accent-600 active:scale-[0.99]"
      >
        {aberto ? 'Ocultar todos os dados' : 'Ver todos os dados da viagem'}
        <span aria-hidden className="text-xl leading-none">
          {aberto ? '▲' : '▼'}
        </span>
      </button>

      {aberto && (
        <div className="border-t border-slate-100 px-5 py-4">
          <DetalhesViagem viagem={viagem} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3">
        <Link
          href={`/admin/${viagem.id}`}
          className="rounded-full border-2 border-slate-300 px-4 py-2.5 text-base font-semibold text-slate-600 transition-all duration-150 hover:bg-slate-50 active:scale-95"
        >
          Editar
        </Link>
        <RelatorioPdfViagem viagem={viagem} />
        <CompartilharWhatsapp viagem={viagem} />
        <ExcluirViagemButton id={viagem.id} />
      </div>
    </div>
  );
}
