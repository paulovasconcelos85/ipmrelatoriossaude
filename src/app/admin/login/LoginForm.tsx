'use client';

import { useActionState } from 'react';
import { loginAdmin, type EstadoLogin } from './actions';

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<EstadoLogin, FormData>(loginAdmin, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <div className="flex flex-col gap-1">
        <label htmlFor="senha" className="text-sm font-semibold text-slate-700">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          required
          autoFocus
          className="rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      {state?.erro && <p className="text-sm font-semibold text-red-600">{state.erro}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-blue-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:bg-blue-800 active:scale-95 disabled:opacity-60"
      >
        {pending ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
