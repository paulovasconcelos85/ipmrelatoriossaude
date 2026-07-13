'use client';

import { useActionState, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { criarParceiro, atualizarParceiro, excluirParceiro } from './actions';
import { confirmarExclusaoDupla } from '@/lib/confirmar';
import type { Parceiro } from '@/lib/viagens-ipm';

function BotaoSalvar({ texto }: { texto: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-blue-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:bg-blue-800 active:scale-95 disabled:opacity-60 disabled:active:scale-100"
    >
      {pending ? 'Salvando...' : texto}
    </button>
  );
}

function LinhaEditavel({ item }: { item: Parceiro }) {
  const [estado, formAction] = useActionState(atualizarParceiro, undefined);
  const [pendingExclusao, startTransition] = useTransition();
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);

  return (
    <li className="border-b border-slate-100 py-2 last:border-0">
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={item.id} />
        <input
          type="text"
          name="nome"
          defaultValue={item.nome}
          placeholder="Nome"
          className="min-w-40 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
        />
        <input
          type="text"
          name="cidade"
          defaultValue={item.cidade ?? ''}
          placeholder="Cidade"
          className="w-32 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
        />
        <input
          type="text"
          name="pais"
          defaultValue={item.pais ?? ''}
          placeholder="País"
          className="w-28 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
        />
        <BotaoSalvar texto="Salvar" />
        <button
          type="button"
          disabled={pendingExclusao}
          onClick={() => {
            if (!confirmarExclusaoDupla(`Excluir "${item.nome}"?`)) return;
            setErroExclusao(null);
            startTransition(async () => {
              const resultado = await excluirParceiro(item.id);
              if (resultado?.erro) setErroExclusao(resultado.erro);
            });
          }}
          className="rounded-full border-2 border-red-300 px-4 py-1.5 text-sm font-bold text-red-700 transition-all duration-150 hover:border-red-400 hover:bg-red-50 active:scale-95 disabled:opacity-60 disabled:active:scale-100"
        >
          Excluir
        </button>
      </form>
      {estado?.erro && <p className="mt-1 text-xs text-red-700">{estado.erro}</p>}
      {erroExclusao && <p className="mt-1 text-xs text-red-700">{erroExclusao}</p>}
    </li>
  );
}

export default function ListaParceiros({ itens }: { itens: Parceiro[] }) {
  const [estado, formAction] = useActionState(criarParceiro, undefined);

  return (
    <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-blue-900">Parceiros</h2>

      <ul className="mb-4 flex flex-col">
        {itens.length === 0 && <li className="py-2 text-sm text-slate-400">Nenhum registro ainda.</li>}
        {itens.map((item) => (
          <LinhaEditavel key={item.id} item={item} />
        ))}
      </ul>

      <form key={itens.length} action={formAction} className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
        <input
          type="text"
          name="nome"
          placeholder="Nome do parceiro"
          className="min-w-40 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
        />
        <input
          type="text"
          name="cidade"
          placeholder="Cidade"
          className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
        />
        <input
          type="text"
          name="pais"
          placeholder="País"
          className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
        />
        <BotaoSalvar texto="Adicionar" />
      </form>
      {estado?.erro && <p className="mt-2 text-xs text-red-700">{estado.erro}</p>}
    </section>
  );
}
