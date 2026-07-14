-- Reaponta "Ana Maria Monteiro" e "Ana Maria Santos" para "Ana Maria dos Santos Monteiro"
-- como líder da equipe de saúde. Idempotente: pode rodar de novo sem efeito colateral.
--
-- Cobre as duas fontes de dado que existem hoje:
--   1. viagens.lider_saude_id — coluna antiga, mantida só por compatibilidade com a view
--      viagens_calendario (viagens de origem 'calendario_2026').
--   2. viagem_lideres_saude — tabela atual (suporta múltiplos líderes por viagem); só existe
--      se você já rodou o supabase/schema.sql atualizado.
--
-- Não mexe nem apaga os cadastros de "Ana Maria Monteiro"/"Ana Maria Santos" em profissionais,
-- nem em viagem_coordenadores/viagem_voluntarios — só corrige o papel de líder de saúde.

do $$
declare
  alvo_id uuid;
  fonte_ids uuid[];
begin
  select id into alvo_id from public.profissionais where nome = 'Ana Maria dos Santos Monteiro';
  if alvo_id is null then
    raise exception 'Profissional "Ana Maria dos Santos Monteiro" não encontrado em public.profissionais.';
  end if;

  select array_agg(id) into fonte_ids
  from public.profissionais
  where nome in ('Ana Maria Monteiro', 'Ana Maria Santos');

  if fonte_ids is null then
    raise notice 'Nenhuma das homônimas ("Ana Maria Monteiro"/"Ana Maria Santos") foi encontrada — nada a fazer.';
    return;
  end if;

  -- 1) Coluna antiga (viagens.lider_saude_id).
  update public.viagens
  set lider_saude_id = alvo_id
  where lider_saude_id = any(fonte_ids);

  -- 2) Tabela atual (viagem_lideres_saude), só se ela já existir.
  if to_regclass('public.viagem_lideres_saude') is not null then
    -- Remove antes os casos em que a viagem já tem as duas (a homônima e a "certa") como
    -- líderes ao mesmo tempo, pra não violar a chave primária (viagem_id, profissional_id).
    delete from public.viagem_lideres_saude vls
    where vls.profissional_id = any(fonte_ids)
      and exists (
        select 1 from public.viagem_lideres_saude vls2
        where vls2.viagem_id = vls.viagem_id and vls2.profissional_id = alvo_id
      );

    update public.viagem_lideres_saude
    set profissional_id = alvo_id
    where profissional_id = any(fonte_ids);
  end if;

  raise notice 'Concluído: viagens/viagem_lideres_saude repontadas para "Ana Maria dos Santos Monteiro".';
end $$;

-- Conferência: não deve sobrar nenhuma viagem com as homônimas como líder de saúde.
select v.numero, v.data_saida, p.nome as lider_saude
from public.viagens v
join public.profissionais p on p.id = v.lider_saude_id
where p.nome in ('Ana Maria Monteiro', 'Ana Maria Santos');
