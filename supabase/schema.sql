-- Tabela de viagens do calendário 2026
create table if not exists public.viagens (
  id uuid primary key default gen_random_uuid(),
  data_saida date not null,
  data_retorno date,
  regiao_rio text,
  responsavel_grupo text,
  grupo text,
  grupo_complemento text,
  coordenador text,
  barco_local text,
  observacoes text,
  cancelada boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists viagens_data_saida_idx on public.viagens (data_saida);

alter table public.viagens enable row level security;

-- Leitura pública (é um calendário informativo, sem dados sensíveis)
create policy "Permitir leitura publica de viagens"
  on public.viagens
  for select
  using (true);
