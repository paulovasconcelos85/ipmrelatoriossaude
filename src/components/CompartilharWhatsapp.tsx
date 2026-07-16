'use client';

import { useState } from 'react';
import { montarTextoWhatsapp } from '@/lib/relatorio-texto';
import type { ViagemIpm } from '@/lib/viagens-ipm';

export default function CompartilharWhatsapp({ viagem }: { viagem: ViagemIpm }) {
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function abrirWhatsapp() {
    const texto = montarTextoWhatsapp(viagem);
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  }

  async function copiarTexto() {
    setErro(null);
    try {
      await navigator.clipboard.writeText(montarTextoWhatsapp(viagem));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setErro('Não foi possível copiar. Tente novamente.');
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={abrirWhatsapp}
          className="self-start rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:bg-emerald-700 active:scale-95"
        >
          Compartilhar no WhatsApp
        </button>
        <button
          type="button"
          onClick={copiarTexto}
          className="self-start rounded-full border-2 border-emerald-600 px-4 py-2 text-sm font-bold text-emerald-700 transition-all duration-150 hover:bg-emerald-50 active:scale-95"
        >
          {copiado ? 'Copiado!' : 'Copiar texto'}
        </button>
      </div>
      {erro && <p className="text-sm font-semibold text-red-600">{erro}</p>}
    </div>
  );
}
