import { signIn } from '@/auth';

const MENSAGENS_ERRO: Record<string, string> = {
  AccessDenied: 'Este e-mail não tem acesso ao admin. Fale com quem administra o sistema.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const destino = next && next.startsWith('/') ? next : '/';
  const mensagemErro = error ? (MENSAGENS_ERRO[error] ?? 'Não foi possível entrar. Tente novamente.') : null;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-xl font-extrabold text-blue-900">Acesso restrito</h1>
        <p className="mb-6 text-sm text-slate-500">Entre com sua conta Google ou Microsoft para continuar.</p>

        {mensagemErro && (
          <p className="mb-4 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
            {mensagemErro}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <form
            action={async () => {
              'use server';
              await signIn('google', { redirectTo: destino });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-slate-200 bg-white px-4 py-3 text-base font-bold text-slate-700 shadow-sm transition-all duration-150 hover:bg-slate-50 active:scale-95"
            >
              Entrar com Google
            </button>
          </form>

          <form
            action={async () => {
              'use server';
              await signIn('microsoft-entra-id', { redirectTo: destino });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-slate-200 bg-white px-4 py-3 text-base font-bold text-slate-700 shadow-sm transition-all duration-150 hover:bg-slate-50 active:scale-95"
            >
              Entrar com Microsoft
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
