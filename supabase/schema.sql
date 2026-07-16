-- Schema profissional do IPM Relatórios Saúde
-- Substitui a tabela "viagens" simplificada anterior por um modelo normalizado,
-- construído a partir do histórico do sistema IPM (CSV) e do calendário de viagens 2026.

create extension if not exists pgcrypto;

-- Este arquivo é idempotente: pode ser rodado de novo com segurança para
-- aplicar novas tabelas/políticas sem apagar dados já existentes.

-- ---------------------------------------------------------------------------
-- Tabelas de apoio (lookups)
-- ---------------------------------------------------------------------------

create table if not exists public.tipos_transporte (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.barcos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.parceiros (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  cidade text,
  pais text,
  created_at timestamptz not null default now()
);

create table if not exists public.profissionais (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  cargo text,
  created_at timestamptz not null default now()
);

create table if not exists public.comunidades (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Viagens
-- ---------------------------------------------------------------------------

create table if not exists public.viagens (
  id uuid primary key default gen_random_uuid(),
  origem text not null check (origem in ('sistema_ipm', 'calendario_2026')),
  numero text unique,
  ano int,
  data_saida date not null,
  data_chegada date,
  dias_missao int,
  tipo_missao text,
  tipo_transporte_id uuid references public.tipos_transporte (id),
  barco_id uuid references public.barcos (id),
  area text,
  local text,
  responsavel_grupo text,
  coordenador_id uuid references public.profissionais (id),
  lider_saude_id uuid references public.profissionais (id),
  cancelada boolean not null default false,
  observacoes text,
  created_at timestamptz not null default now()
);

create index if not exists viagens_data_saida_idx on public.viagens (data_saida);
create index if not exists viagens_ano_idx on public.viagens (ano);
create index if not exists viagens_origem_idx on public.viagens (origem);

-- Parceiros por viagem (substitui parceiro_1/2/3 do CSV, preservando a ordem original)
create table if not exists public.viagem_parceiros (
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  parceiro_id uuid not null references public.parceiros (id) on delete cascade,
  posicao smallint not null default 1,
  primary key (viagem_id, parceiro_id)
);

-- Comunidades visitadas por viagem (preenchido manualmente no admin; vira estatística)
create table if not exists public.viagem_comunidades (
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  comunidade_id uuid not null references public.comunidades (id) on delete cascade,
  posicao smallint not null default 1,
  primary key (viagem_id, comunidade_id)
);

alter table public.viagem_comunidades add column if not exists posicao smallint not null default 1;

-- Coordenadores da viagem (uma viagem pode ter mais de um). Substitui viagens.coordenador_id,
-- que fica na tabela apenas para não quebrar a view de compatibilidade viagens_calendario
-- (usada só pelas viagens de origem 'calendario_2026', que não passam por este formulário).
create table if not exists public.viagem_coordenadores (
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  profissional_id uuid not null references public.profissionais (id) on delete cascade,
  posicao smallint not null default 1,
  primary key (viagem_id, profissional_id)
);

-- Líderes da equipe de saúde da viagem (idem: uma viagem pode ter mais de um).
create table if not exists public.viagem_lideres_saude (
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  profissional_id uuid not null references public.profissionais (id) on delete cascade,
  posicao smallint not null default 1,
  primary key (viagem_id, profissional_id)
);

-- Migra o coordenador/líder únicos já cadastrados para as novas tabelas (idempotente).
insert into public.viagem_coordenadores (viagem_id, profissional_id, posicao)
select id, coordenador_id, 1 from public.viagens where coordenador_id is not null
on conflict (viagem_id, profissional_id) do nothing;

insert into public.viagem_lideres_saude (viagem_id, profissional_id, posicao)
select id, lider_saude_id, 1 from public.viagens where lider_saude_id is not null
on conflict (viagem_id, profissional_id) do nothing;

-- Voluntários que participaram da viagem (preenchido manualmente no admin).
-- Função e observação são específicas da participação naquela viagem
-- (ex.: "Médica", "TSB - Odontologia", observação "Auxiliando na triagem").
create table if not exists public.viagem_voluntarios (
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  profissional_id uuid not null references public.profissionais (id) on delete cascade,
  funcao text,
  observacao text,
  primary key (viagem_id, profissional_id)
);

alter table public.viagem_voluntarios add column if not exists funcao text;
alter table public.viagem_voluntarios add column if not exists observacao text;

-- Fotos anexadas à viagem (preenchido no admin; usadas no relatório em PDF).
-- O arquivo em si fica no bucket de Storage "viagem-fotos" — esta tabela guarda
-- apenas o caminho do objeto, a legenda e a ordem de exibição.
create table if not exists public.viagem_fotos (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  storage_path text not null,
  legenda text,
  posicao smallint not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists viagem_fotos_viagem_id_idx on public.viagem_fotos (viagem_id);

-- ---------------------------------------------------------------------------
-- Atendimentos e atividades por viagem (métricas do sistema IPM)
-- ---------------------------------------------------------------------------

create table if not exists public.atendimentos (
  viagem_id uuid primary key references public.viagens (id) on delete cascade,

  -- Atendimento médico
  atendimentos_medicos int,
  criancas_medico int,
  adolescentes_medico int,
  adultos_medico int,

  -- Atendimento odontológico
  atendimentos_odontologicos int,
  criancas_odonto int,
  adolescentes_odonto int,
  adultos_odonto int,
  procedimentos_odonto int,
  kits_odonto int,

  -- Atendimento de enfermagem
  atendimentos_enfermagem int,
  criancas_enfermagem int,
  adolescentes_enfermagem int,
  adultos_enfermagem int,
  procedimentos_enfermagem int,
  consultas_enfermagem int,

  -- Outros atendimentos de saúde
  atendimentos_fisioterapia int,
  atendimentos_psicologia int,
  atendimentos_dermatologia int,
  atendimentos_fonoaudiologia int,
  atendimentos_nutricionista int,

  -- Atividades evangelísticas
  atividades_evangelisticas int,
  evangelismo_palestra_infantil int,
  palestra_reuniao_mulheres int,
  ministerio_palestra_adolescentes int,
  palestra_reuniao_homens int,
  biblias_distribuidas int,
  evangelismo_nas_casas int,
  cultos_devocional int,
  decisoes_por_cristo int,
  ceia_do_senhor int,
  batismos int,

  -- Atividades e procedimentos de saúde
  atividades_saude int,
  aerosolterapia int,
  aplicacao_fluor int,
  curativos int,
  encaminhamentos_unidade_hospitalar int,
  entrega_medicamentos int,
  escovas_cremes_dentais int,
  exame_hemoglobina_glicada int,
  exame_sifilis int,
  exame_urina int,
  exame_hanseniase int,
  hemograma_simples_mtx int,
  inalacao int,
  internacao_emergencia_urgencia int,
  kit_higiene int,
  lavagem_nasal_procedimento int,
  lavagem_ouvido int,
  manutencao_protese int,
  medicacao_ev_im int,
  medicacao_ocular int,
  medicacao_oral int,
  medicacao_topica int,
  paciente_observacao int,
  palestra_higiene_bucal int,
  pequenas_cirurgias int,
  prenatal int,
  protese int,
  retirada_gesso int,
  teste_aids int,
  teste_covid19 int,
  teste_glicemia int,
  teste_gravidez int,
  teste_doppler int,
  ultrassonografia int,
  vacinas int,
  visitas_domiciliares int,

  -- Assistência social e outras doações
  outras_atividades int,
  aconselhamento int,
  brinquedos_doados_criancas int,
  cestas_basicas int,
  corte_cabelo int,
  curso_empreendedorismo int,
  doacao_gerador int,
  doacao_oculos int,
  kit_lanche int,
  kit_criancas_escolar int,
  kit_mulheres int,
  kit_homens int,
  lembrancas int,
  orientacao_juridica int,
  orientacao_assistente_social int,
  pintura_casas int,
  pocos_perfurados int,
  produtos_cabelo int,
  sacolas_roupas int,
  treinamento_lideranca_local int,
  curso_gestao_financeira int,

  -- Observações de importação (ex.: valores originais com anotações como "231 (100)")
  observacoes text,

  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Itens de estatística livre (grupos "Atividades e procedimentos de saúde" e
-- "Assistência social e doações"): em vez de uma coluna fixa por item — inviável de
-- navegar num formulário com dezenas de opções raramente usadas —, a pessoa digita o
-- nome do item (autocompletando os já cadastrados) e a quantidade. campos_estatisticos
-- guarda o catálogo de nomes por grupo; atendimentos_extra guarda a quantidade por viagem.
-- ---------------------------------------------------------------------------

create table if not exists public.campos_estatisticos (
  id uuid primary key default gen_random_uuid(),
  grupo text not null check (grupo in ('atividades_procedimentos_saude', 'assistencia_social_doacoes')),
  nome text not null,
  created_at timestamptz not null default now(),
  unique (grupo, nome)
);

create table if not exists public.atendimentos_extra (
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  campo_estatistico_id uuid not null references public.campos_estatisticos (id) on delete restrict,
  quantidade int not null,
  primary key (viagem_id, campo_estatistico_id)
);

create index if not exists atendimentos_extra_viagem_id_idx on public.atendimentos_extra (viagem_id);
create index if not exists atendimentos_extra_campo_idx on public.atendimentos_extra (campo_estatistico_id);

-- ---------------------------------------------------------------------------
-- View de compatibilidade para a página do Calendário de Viagens 2026
-- ---------------------------------------------------------------------------

create or replace view public.viagens_calendario as
select
  v.id,
  v.origem,
  v.data_saida,
  v.data_chegada as data_retorno,
  v.area as regiao_rio,
  v.responsavel_grupo,
  (
    select p.nome from public.viagem_parceiros vp
    join public.parceiros p on p.id = vp.parceiro_id
    where vp.viagem_id = v.id
    order by vp.posicao
    limit 1
  ) as grupo,
  (
    select p.nome from public.viagem_parceiros vp
    join public.parceiros p on p.id = vp.parceiro_id
    where vp.viagem_id = v.id
    order by vp.posicao
    offset 1 limit 1
  ) as grupo_complemento,
  coord.nome as coordenador,
  coalesce(b.nome, v.local) as barco_local,
  v.observacoes,
  v.cancelada
from public.viagens v
left join public.profissionais coord on coord.id = v.coordenador_id
left join public.barcos b on b.id = v.barco_id;

-- ---------------------------------------------------------------------------
-- RLS: leitura pública (dados informativos, sem informação sensível)
-- ---------------------------------------------------------------------------

alter table public.tipos_transporte enable row level security;
alter table public.barcos enable row level security;
alter table public.parceiros enable row level security;
alter table public.profissionais enable row level security;
alter table public.comunidades enable row level security;
alter table public.viagens enable row level security;
alter table public.viagem_parceiros enable row level security;
alter table public.viagem_coordenadores enable row level security;
alter table public.viagem_lideres_saude enable row level security;
alter table public.viagem_comunidades enable row level security;
alter table public.viagem_voluntarios enable row level security;
alter table public.atendimentos enable row level security;
alter table public.viagem_fotos enable row level security;
alter table public.campos_estatisticos enable row level security;
alter table public.atendimentos_extra enable row level security;

drop policy if exists "Permitir leitura publica de tipos_transporte" on public.tipos_transporte;
create policy "Permitir leitura publica de tipos_transporte" on public.tipos_transporte for select using (true);

drop policy if exists "Permitir leitura publica de barcos" on public.barcos;
create policy "Permitir leitura publica de barcos" on public.barcos for select using (true);

drop policy if exists "Permitir leitura publica de parceiros" on public.parceiros;
create policy "Permitir leitura publica de parceiros" on public.parceiros for select using (true);

drop policy if exists "Permitir leitura publica de profissionais" on public.profissionais;
create policy "Permitir leitura publica de profissionais" on public.profissionais for select using (true);

drop policy if exists "Permitir leitura publica de comunidades" on public.comunidades;
create policy "Permitir leitura publica de comunidades" on public.comunidades for select using (true);

drop policy if exists "Permitir leitura publica de viagens" on public.viagens;
create policy "Permitir leitura publica de viagens" on public.viagens for select using (true);

drop policy if exists "Permitir leitura publica de viagem_parceiros" on public.viagem_parceiros;
create policy "Permitir leitura publica de viagem_parceiros" on public.viagem_parceiros for select using (true);

drop policy if exists "Permitir leitura publica de viagem_coordenadores" on public.viagem_coordenadores;
create policy "Permitir leitura publica de viagem_coordenadores" on public.viagem_coordenadores for select using (true);

drop policy if exists "Permitir leitura publica de viagem_lideres_saude" on public.viagem_lideres_saude;
create policy "Permitir leitura publica de viagem_lideres_saude" on public.viagem_lideres_saude for select using (true);

drop policy if exists "Permitir leitura publica de viagem_comunidades" on public.viagem_comunidades;
create policy "Permitir leitura publica de viagem_comunidades" on public.viagem_comunidades for select using (true);

drop policy if exists "Permitir leitura publica de viagem_voluntarios" on public.viagem_voluntarios;
create policy "Permitir leitura publica de viagem_voluntarios" on public.viagem_voluntarios for select using (true);

drop policy if exists "Permitir leitura publica de atendimentos" on public.atendimentos;
create policy "Permitir leitura publica de atendimentos" on public.atendimentos for select using (true);

drop policy if exists "Permitir leitura publica de viagem_fotos" on public.viagem_fotos;
create policy "Permitir leitura publica de viagem_fotos" on public.viagem_fotos for select using (true);

drop policy if exists "Permitir leitura publica de campos_estatisticos" on public.campos_estatisticos;
create policy "Permitir leitura publica de campos_estatisticos" on public.campos_estatisticos for select using (true);

drop policy if exists "Permitir leitura publica de atendimentos_extra" on public.atendimentos_extra;
create policy "Permitir leitura publica de atendimentos_extra" on public.atendimentos_extra for select using (true);

-- ---------------------------------------------------------------------------
-- RLS: escrita pública (temporário, enquanto não há autenticação de admin)
-- Necessário para as páginas "Nova viagem" e "/admin" (edição/exclusão).
-- ---------------------------------------------------------------------------

drop policy if exists "Permitir escrita publica de tipos_transporte" on public.tipos_transporte;
create policy "Permitir escrita publica de tipos_transporte" on public.tipos_transporte for all using (true) with check (true);

drop policy if exists "Permitir escrita publica de barcos" on public.barcos;
create policy "Permitir escrita publica de barcos" on public.barcos for all using (true) with check (true);

drop policy if exists "Permitir escrita publica de parceiros" on public.parceiros;
create policy "Permitir escrita publica de parceiros" on public.parceiros for all using (true) with check (true);

drop policy if exists "Permitir escrita publica de profissionais" on public.profissionais;
create policy "Permitir escrita publica de profissionais" on public.profissionais for all using (true) with check (true);

drop policy if exists "Permitir escrita publica de comunidades" on public.comunidades;
create policy "Permitir escrita publica de comunidades" on public.comunidades for all using (true) with check (true);

drop policy if exists "Permitir escrita publica de viagens" on public.viagens;
create policy "Permitir escrita publica de viagens" on public.viagens for all using (true) with check (true);

drop policy if exists "Permitir escrita publica de viagem_parceiros" on public.viagem_parceiros;
create policy "Permitir escrita publica de viagem_parceiros" on public.viagem_parceiros for all using (true) with check (true);

drop policy if exists "Permitir escrita publica de viagem_coordenadores" on public.viagem_coordenadores;
create policy "Permitir escrita publica de viagem_coordenadores" on public.viagem_coordenadores for all using (true) with check (true);

drop policy if exists "Permitir escrita publica de viagem_lideres_saude" on public.viagem_lideres_saude;
create policy "Permitir escrita publica de viagem_lideres_saude" on public.viagem_lideres_saude for all using (true) with check (true);

drop policy if exists "Permitir escrita publica de viagem_comunidades" on public.viagem_comunidades;
create policy "Permitir escrita publica de viagem_comunidades" on public.viagem_comunidades for all using (true) with check (true);

drop policy if exists "Permitir escrita publica de viagem_voluntarios" on public.viagem_voluntarios;
create policy "Permitir escrita publica de viagem_voluntarios" on public.viagem_voluntarios for all using (true) with check (true);

drop policy if exists "Permitir escrita publica de atendimentos" on public.atendimentos;
create policy "Permitir escrita publica de atendimentos" on public.atendimentos for all using (true) with check (true);

drop policy if exists "Permitir escrita publica de viagem_fotos" on public.viagem_fotos;
create policy "Permitir escrita publica de viagem_fotos" on public.viagem_fotos for all using (true) with check (true);

drop policy if exists "Permitir escrita publica de campos_estatisticos" on public.campos_estatisticos;
create policy "Permitir escrita publica de campos_estatisticos" on public.campos_estatisticos for all using (true) with check (true);

drop policy if exists "Permitir escrita publica de atendimentos_extra" on public.atendimentos_extra;
create policy "Permitir escrita publica de atendimentos_extra" on public.atendimentos_extra for all using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Storage: bucket público para as fotos das viagens
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('viagem-fotos', 'viagem-fotos', true)
on conflict (id) do nothing;

drop policy if exists "Permitir leitura publica do bucket viagem-fotos" on storage.objects;
create policy "Permitir leitura publica do bucket viagem-fotos" on storage.objects
  for select using (bucket_id = 'viagem-fotos');

drop policy if exists "Permitir upload publico no bucket viagem-fotos" on storage.objects;
create policy "Permitir upload publico no bucket viagem-fotos" on storage.objects
  for insert with check (bucket_id = 'viagem-fotos');

drop policy if exists "Permitir exclusao publica no bucket viagem-fotos" on storage.objects;
create policy "Permitir exclusao publica no bucket viagem-fotos" on storage.objects
  for delete using (bucket_id = 'viagem-fotos');
