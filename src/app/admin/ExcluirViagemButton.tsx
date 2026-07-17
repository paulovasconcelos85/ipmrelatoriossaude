'use client';

import { useState, useTransition } from 'react';
import { excluirViagemIpm } from './actions';
import { confirmarExclusaoDupla } from '@/lib/confirmar';

export default function ExcluirViagemButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirmarExclusaoDupla('Excluir esta viagem e todos os dados relacionados?')) return;
          setErro(null);
          startTransition(async () => {
            try {
              await excluirViagemIpm(id);
            } catch (err) {
              setErro(err instanceof Error ? err.message : 'Erro ao excluir a viagem.');
            }
          });
        }}
        className="rounded-full border-2 border-red-300 px-4 py-2.5 text-base font-semibold text-red-700 transition-all duration-150 hover:border-red-400 hover:bg-red-50 active:scale-95 disabled:opacity-60 disabled:active:scale-100"
      >
        {pending ? 'Excluindo...' : 'Excluir'}
      </button>
      {erro && <p className="text-sm text-red-700">{erro}</p>}
    </div>
  );
}
