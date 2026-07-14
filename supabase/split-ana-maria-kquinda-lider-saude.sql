-- Substitui "Ana Maria/Kquinda" por DUAS líderes da equipe de saúde:
-- "Ana Maria dos Santos Monteiro" e "Kquinda Soares". Idempotente.
--
-- Cobre as duas fontes de dado que existem hoje:
--   1. viagens.lider_saude_id — coluna antiga, suporta só UM líder; fica com Ana Maria dos
--      Santos Monteiro (mantida só por compatibilidade com a view viagens_calendario).
--   2. viagem_lideres_saude — tabela atual (suporta múltiplos líderes por viagem); só existe
--      se você já rodou o supabase/schema.sql atualizado. É aqui que as duas líderes ficam
--      registradas de fato.
--
-- Não mexe no cadastro de "Ana Maria/Kquinda" em profissionais, nem em
-- viagem_coordenadores/viagem_voluntarios — só corrige o papel de líder de saúde.

do $$
declare
  fonte_id uuid;
  alvo_ana_id uuid;
  alvo_kquinda_id uuid;
begin
  select id into fonte_id from public.profissionais where nome = 'Ana Maria/Kquinda';
  if fonte_id is null then
    raise notice 'Profissional "Ana Maria/Kquinda" não encontrado — nada a fazer.';
    return;
  end if;

  select id into alvo_ana_id from public.profissionais where nome = 'Ana Maria dos Santos Monteiro';
  if alvo_ana_id is null then
    raise exception 'Profissional "Ana Maria dos Santos Monteiro" não encontrado em public.profissionais.';
  end if;

  select id into alvo_kquinda_id from public.profissionais where nome = 'Kquinda Soares';
  if alvo_kquinda_id is null then
    raise exception 'Profissional "Kquinda Soares" não encontrado em public.profissionais.';
  end if;

  -- 1) Coluna antiga: só suporta um líder, então fica com Ana Maria dos Santos Monteiro.
  update public.viagens
  set lider_saude_id = alvo_ana_id
  where lider_saude_id = fonte_id;

  -- 2) Tabela atual (viagem_lideres_saude), só se ela já existir.
  if to_regclass('public.viagem_lideres_saude') is not null then
    -- Adiciona Kquinda Soares em toda viagem que tinha "Ana Maria/Kquinda", se ainda não estiver lá.
    insert into public.viagem_lideres_saude (viagem_id, profissional_id, posicao)
    select vls.viagem_id, alvo_kquinda_id, vls.posicao + 1
    from public.viagem_lideres_saude vls
    where vls.profissional_id = fonte_id
      and not exists (
        select 1 from public.viagem_lideres_saude vls2
        where vls2.viagem_id = vls.viagem_id and vls2.profissional_id = alvo_kquinda_id
      );

    -- A linha da "Ana Maria/Kquinda" vira Ana Maria dos Santos Monteiro — ou é removida, se a
    -- viagem já tiver essa Ana Maria cadastrada, pra não violar a chave primária.
    delete from public.viagem_lideres_saude vls
    where vls.profissional_id = fonte_id
      and exists (
        select 1 from public.viagem_lideres_saude vls2
        where vls2.viagem_id = vls.viagem_id and vls2.profissional_id = alvo_ana_id
      );

    update public.viagem_lideres_saude
    set profissional_id = alvo_ana_id
    where profissional_id = fonte_id;
  end if;

  raise notice 'Concluído: "Ana Maria/Kquinda" substituída por "Ana Maria dos Santos Monteiro" + "Kquinda Soares".';
end $$;

-- Conferência: não deve sobrar nenhuma viagem com "Ana Maria/Kquinda" como líder de saúde.
select v.numero, v.data_saida, p.nome as lider_saude
from public.viagens v
join public.profissionais p on p.id = v.lider_saude_id
where p.nome = 'Ana Maria/Kquinda';

-- Conferência: viagens que agora têm as duas líderes (só funciona após rodar o schema.sql
-- atualizado, que cria viagem_lideres_saude).
select v.numero, v.data_saida, array_agg(p.nome order by vls.posicao) as lideres_saude
from public.viagem_lideres_saude vls
join public.viagens v on v.id = vls.viagem_id
join public.profissionais p on p.id = vls.profissional_id
where vls.viagem_id in (
  select viagem_id from public.viagem_lideres_saude
  where profissional_id in (
    select id from public.profissionais where nome in ('Ana Maria dos Santos Monteiro', 'Kquinda Soares')
  )
)
group by v.numero, v.data_saida
order by v.data_saida;
