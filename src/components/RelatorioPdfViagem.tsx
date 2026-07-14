'use client';

import { useState } from 'react';
import { gerarRelatorioPdf } from './relatorio-pdf';
import type { ViagemIpm } from '@/lib/viagens-ipm';

export default function RelatorioPdfViagem({ viagem }: { viagem: ViagemIpm }) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={gerando}
        onClick={async () => {
          setErro(null);
          setGerando(true);
          try {
            await gerarRelatorioPdf(viagem);
          } catch (err) {
            setErro(err instanceof Error ? err.message : 'Erro ao gerar o relatório.');
          } finally {
            setGerando(false);
          }
        }}
        className="self-start rounded-full bg-blue-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:bg-blue-800 active:scale-95 disabled:opacity-60"
      >
        {gerando ? 'Gerando...' : 'Emitir relatório em PDF'}
      </button>
      {erro && <p className="text-sm font-semibold text-red-600">{erro}</p>}
    </div>
  );
}
