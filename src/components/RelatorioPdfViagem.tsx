'use client';

import { useState } from 'react';
import { gerarRelatorioDocx } from '@/lib/relatorio-docx';
import { gerarRelatorioPdf } from '@/lib/relatorio-pdf';
import type { ViagemIpm } from '@/lib/viagens-ipm';

type Formato = 'pdf' | 'docx';

export default function RelatorioPdfViagem({ viagem }: { viagem: ViagemIpm }) {
  const [gerando, setGerando] = useState<Formato | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function emitir(formato: Formato) {
    setErro(null);
    setGerando(formato);
    try {
      if (formato === 'pdf') {
        await gerarRelatorioPdf(viagem);
      } else {
        await gerarRelatorioDocx(viagem);
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao gerar o relatório.');
    } finally {
      setGerando(null);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={gerando !== null}
          onClick={() => emitir('pdf')}
          className="self-start rounded-full border-2 border-slate-300 px-4 py-2.5 text-base font-semibold text-slate-600 transition-all duration-150 hover:bg-slate-50 active:scale-95 disabled:opacity-60"
        >
          {gerando === 'pdf' ? 'Gerando...' : 'Relatório em PDF'}
        </button>
        <button
          type="button"
          disabled={gerando !== null}
          onClick={() => emitir('docx')}
          className="self-start rounded-full border-2 border-slate-300 px-4 py-2.5 text-base font-semibold text-slate-600 transition-all duration-150 hover:bg-slate-50 active:scale-95 disabled:opacity-60"
        >
          {gerando === 'docx' ? 'Gerando...' : 'Relatório em Word'}
        </button>
      </div>
      {erro && <p className="text-base font-semibold text-red-600">{erro}</p>}
    </div>
  );
}
