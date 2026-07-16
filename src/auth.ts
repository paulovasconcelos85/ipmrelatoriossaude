import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';

/** Emails autorizados a entrar no admin, separados por vírgula (ex.: "mae@gmail.com,outra@outlook.com"). */
function emailsPermitidos(): string[] {
  return (process.env.ALLOWED_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google, MicrosoftEntraID],
  pages: {
    signIn: '/login',
  },
  session: {
    // Sessão de ~6 meses: a mãe do usuário loga uma vez no navegador e não precisa repetir.
    maxAge: 60 * 60 * 24 * 180,
  },
  callbacks: {
    // Só entra quem está na lista em ALLOWED_ADMIN_EMAILS — sem isso, qualquer conta Google/Microsoft
    // conseguiria acessar o admin, o que expõe dados de viagens/pessoas. Falha fechado se a lista estiver vazia.
    async signIn({ user }) {
      const permitidos = emailsPermitidos();
      if (permitidos.length === 0) return false;
      const email = user.email?.toLowerCase();
      return Boolean(email && permitidos.includes(email));
    },
  },
});
