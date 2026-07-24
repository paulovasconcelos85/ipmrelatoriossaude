-- Migração one-off: move os grupos "Outros atendimentos de saúde" e "Atividades evangelísticas"
-- de colunas fixas em public.atendimentos para o modelo dinâmico (campos_estatisticos +
-- atendimentos_extra), no mesmo padrão de migrate-atendimentos-extra.sql. Rode DEPOIS de aplicar
-- o schema.sql atualizado. Este script é seguro para rodar mais de uma vez (idempotente) até a
-- etapa final de "drop column", que é irreversível — faça um backup/export da tabela atendimentos
-- antes de rodar este arquivo.

-- 1) Catálogo: cadastra os nomes já usados hoje como colunas fixas, para o autocomplete nascer populado.
insert into public.campos_estatisticos (grupo, nome) values
  ('outros_atendimentos_saude', 'Fisioterapia'),
  ('outros_atendimentos_saude', 'Psicologia'),
  ('outros_atendimentos_saude', 'Dermatologia'),
  ('outros_atendimentos_saude', 'Fonoaudiologia'),
  ('outros_atendimentos_saude', 'Nutricionista'),
  ('outros_atendimentos_saude', 'Orientação/Assistente social'),
  ('atividades_evangelisticas', 'Atividades evangelísticas'),
  ('atividades_evangelisticas', 'Evangelismo/Palestra infantil'),
  ('atividades_evangelisticas', 'Palestra/Reunião de mulheres'),
  ('atividades_evangelisticas', 'Ministério/Palestra adolescentes'),
  ('atividades_evangelisticas', 'Palestra/Reunião de homens'),
  ('atividades_evangelisticas', 'Bíblias distribuídas'),
  ('atividades_evangelisticas', 'Evangelismo nas casas'),
  ('atividades_evangelisticas', 'Cultos/Devocional'),
  ('atividades_evangelisticas', 'Decisões por Cristo'),
  ('atividades_evangelisticas', 'Ceia do Senhor'),
  ('atividades_evangelisticas', 'Batismos')
on conflict (grupo, nome) do nothing;

-- 2) Copia os valores já preenchidos nas viagens existentes para atendimentos_extra.
insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.atendimentos_fisioterapia
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'outros_atendimentos_saude' and ce.nome = 'Fisioterapia'
where a.atendimentos_fisioterapia is not null and a.atendimentos_fisioterapia <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.atendimentos_psicologia
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'outros_atendimentos_saude' and ce.nome = 'Psicologia'
where a.atendimentos_psicologia is not null and a.atendimentos_psicologia <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.atendimentos_dermatologia
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'outros_atendimentos_saude' and ce.nome = 'Dermatologia'
where a.atendimentos_dermatologia is not null and a.atendimentos_dermatologia <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.atendimentos_fonoaudiologia
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'outros_atendimentos_saude' and ce.nome = 'Fonoaudiologia'
where a.atendimentos_fonoaudiologia is not null and a.atendimentos_fonoaudiologia <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.atendimentos_nutricionista
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'outros_atendimentos_saude' and ce.nome = 'Nutricionista'
where a.atendimentos_nutricionista is not null and a.atendimentos_nutricionista <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.orientacao_assistente_social
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'outros_atendimentos_saude' and ce.nome = 'Orientação/Assistente social'
where a.orientacao_assistente_social is not null and a.orientacao_assistente_social <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.atividades_evangelisticas
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_evangelisticas' and ce.nome = 'Atividades evangelísticas'
where a.atividades_evangelisticas is not null and a.atividades_evangelisticas <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.evangelismo_palestra_infantil
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_evangelisticas' and ce.nome = 'Evangelismo/Palestra infantil'
where a.evangelismo_palestra_infantil is not null and a.evangelismo_palestra_infantil <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.palestra_reuniao_mulheres
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_evangelisticas' and ce.nome = 'Palestra/Reunião de mulheres'
where a.palestra_reuniao_mulheres is not null and a.palestra_reuniao_mulheres <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.ministerio_palestra_adolescentes
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_evangelisticas' and ce.nome = 'Ministério/Palestra adolescentes'
where a.ministerio_palestra_adolescentes is not null and a.ministerio_palestra_adolescentes <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.palestra_reuniao_homens
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_evangelisticas' and ce.nome = 'Palestra/Reunião de homens'
where a.palestra_reuniao_homens is not null and a.palestra_reuniao_homens <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.biblias_distribuidas
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_evangelisticas' and ce.nome = 'Bíblias distribuídas'
where a.biblias_distribuidas is not null and a.biblias_distribuidas <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.evangelismo_nas_casas
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_evangelisticas' and ce.nome = 'Evangelismo nas casas'
where a.evangelismo_nas_casas is not null and a.evangelismo_nas_casas <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.cultos_devocional
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_evangelisticas' and ce.nome = 'Cultos/Devocional'
where a.cultos_devocional is not null and a.cultos_devocional <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.decisoes_por_cristo
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_evangelisticas' and ce.nome = 'Decisões por Cristo'
where a.decisoes_por_cristo is not null and a.decisoes_por_cristo <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.ceia_do_senhor
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_evangelisticas' and ce.nome = 'Ceia do Senhor'
where a.ceia_do_senhor is not null and a.ceia_do_senhor <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.batismos
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_evangelisticas' and ce.nome = 'Batismos'
where a.batismos is not null and a.batismos <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

-- 3) Remove as colunas antigas, agora substituídas pela tabela atendimentos_extra.
-- IRREVERSÍVEL — só rode depois de conferir que os dados migraram (passo 2) corretamente.
alter table public.atendimentos
  drop column if exists atendimentos_fisioterapia,
  drop column if exists atendimentos_psicologia,
  drop column if exists atendimentos_dermatologia,
  drop column if exists atendimentos_fonoaudiologia,
  drop column if exists atendimentos_nutricionista,
  drop column if exists orientacao_assistente_social,
  drop column if exists atividades_evangelisticas,
  drop column if exists evangelismo_palestra_infantil,
  drop column if exists palestra_reuniao_mulheres,
  drop column if exists ministerio_palestra_adolescentes,
  drop column if exists palestra_reuniao_homens,
  drop column if exists biblias_distribuidas,
  drop column if exists evangelismo_nas_casas,
  drop column if exists cultos_devocional,
  drop column if exists decisoes_por_cristo,
  drop column if exists ceia_do_senhor,
  drop column if exists batismos;
