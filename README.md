# IPM Relatórios Saúde

Sistema de relatórios do IPM. A primeira página apresenta o **Calendário de Viagens 2026** de forma
simples, mobile-first e com letra grande/ajustável (pensado para uso por pessoas idosas).

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Sem configurar o Supabase, a página funciona normalmente usando os dados de exemplo em
`src/lib/viagens-fallback.ts` (gerados a partir da planilha original).

## Conectando ao Supabase

1. Copie `.env.local.example` para `.env.local`.
2. Preencha `NEXT_PUBLIC_SUPABASE_ANON_KEY` com a *anon key* do projeto (Supabase → Project Settings → API).
3. No SQL Editor do Supabase, rode nesta ordem:
   - `supabase/schema.sql` — cria a tabela `viagens` com leitura pública.
   - `supabase/seed.sql` — popula a tabela com os dados do calendário 2026.
4. Reinicie `npm run dev`. A página passa a buscar os dados diretamente do Supabase.

### Erro "self-signed certificate in certificate chain" ao rodar localmente

Em redes corporativas com proxy que inspeciona HTTPS (ex.: notebook do trabalho), o Node pode
rejeitar o certificado do Supabase mesmo com internet funcionando normalmente (o `curl`/navegador
funcionam porque usam o repositório de certificados do Windows, que já confia no proxy; o Node não usa
esse repositório por padrão). Nesse caso a página cai silenciosamente para os dados locais de exemplo.

Solução: rode o dev server pedindo para o Node confiar no certificado do sistema operacional:

```bash
NODE_OPTIONS="--use-system-ca" npm run dev
```

Isso não é necessário em produção (Vercel, etc.), só em redes com esse tipo de proxy.

## Estrutura

- `src/app/page.tsx` — página do calendário de viagens.
- `src/components/FontSizeControl.tsx` — botões A-/A/A+ para ajustar o tamanho da letra (fica salvo no navegador).
- `src/lib/viagens.ts` — busca os dados no Supabase, com fallback local.
- `src/lib/format.ts` — formatação de datas e cálculo do status da viagem (já aconteceu / em andamento / programada) comparando com a data atual.
- `supabase/` — SQL de schema e seed da tabela `viagens`.
