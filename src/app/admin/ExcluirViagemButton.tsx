'use client';

import { useState, useTransition } from 'react';
import { excluirViagemIpm } from './actions';

export default function ExcluirViagemButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm('Excluir esta viagem e todos os dados relacionados? Essa ação não pode ser desfeita.')) return;
          setErro(null);
          startTransition(async () => {
            try {
              await excluirViagemIpm(id);
            } catch (err) {
              setErro(err instanceof Error ? err.message : 'Erro ao excluir a viagem.');
            }
          });
        }}
        className="rounded-full border-2 border-red-300 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-60"
      >
        {pending ? 'Excluindo...' : 'Excluir'}
      </button>
      {erro && <p className="text-xs text-red-700">{erro}</p>}
    </div>
  );
}
