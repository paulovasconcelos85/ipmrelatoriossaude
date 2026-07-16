-- Substitui "Bruna Almeida e Shelley" por DUAS coordenadoras:
-- "Bruna Almeida" (já existe) e "Shelley" (criada, cargo "Coordenadora"). Idempotente.
--
-- Cobre as duas fontes de dado que existem hoje:
--   1. viagens.coordenador_id — coluna antiga, suporta só UM coordenador; fica com Bruna
--      Almeida (mantida só por compatibilidade com a view viagens_calendario).
--   2. viagem_coordenadores — tabela atual (suporta múltiplos coordenadores por viagem); só
--      existe se você já rodou o supabase/schema.sql atualizado. É aqui que as duas
--      coordenadoras ficam registradas de fato.
--
-- Não mexe em viagem_lideres_saude nem em viagem_voluntarios — só corrige o papel de
-- coordenador.

do $$
declare
  fonte_id uuid;
  alvo_bruna_id uuid;
  alvo_shelley_id uuid;
begin
  select id into fonte_id from public.profissionais where nome = 'Bruna Almeida e Shelley';
  if fonte_id is null then
    raise notice 'Profissional "Bruna Almeida e Shelley" não encontrado — nada a fazer.';
    return;
  end if;

  select id into alvo_bruna_id from public.profissionais where nome = 'Bruna Almeida';
  if alvo_bruna_id is null then
    raise exception 'Profissional "Bruna Almeida" não encontrado em public.profissionais.';
  end if;

  select id into alvo_shelley_id from public.profissionais where nome = 'Shelley';
  if alvo_shelley_id is null then
    insert into public.profissionais (nome, cargo) values ('Shelley', 'Coordenadora')
    returning id into alvo_shelley_id;
  end if;

  -- 1) Coluna antiga: só suporta um coordenador, então fica com Bruna Almeida.
  update public.viagens
  set coordenador_id = alvo_bruna_id
  where coordenador_id = fonte_id;

  -- 2) Tabela atual (viagem_coordenadores), só se ela já existir.
  if to_regclass('public.viagem_coordenadores') is not null then
    -- Adiciona Shelley em toda viagem que tinha "Bruna Almeida e Shelley", se ainda não estiver lá.
    insert into public.viagem_coordenadores (viagem_id, profissional_id, posicao)
    select vc.viagem_id, alvo_shelley_id, vc.posicao + 1
    from public.viagem_coordenadores vc
    where vc.profissional_id = fonte_id
      and not exists (
        select 1 from public.viagem_coordenadores vc2
        where vc2.viagem_id = vc.viagem_id and vc2.profissional_id = alvo_shelley_id
      );

    -- A linha da "Bruna Almeida e Shelley" vira Bruna Almeida — ou é removida, se a viagem já
    -- tiver essa Bruna Almeida cadastrada, pra não violar a chave primária.
    delete from public.viagem_coordenadores vc
    where vc.profissional_id = fonte_id
      and exists (
        select 1 from public.viagem_coordenadores vc2
        where vc2.viagem_id = vc.viagem_id and vc2.profissional_id = alvo_bruna_id
      );

    update public.viagem_coordenadores
    set profissional_id = alvo_bruna_id
    where profissional_id = fonte_id;
  end if;

  raise notice 'Concluído: "Bruna Almeida e Shelley" substituída por "Bruna Almeida" + "Shelley".';
end $$;

-- Conferência: não deve sobrar nenhuma viagem com "Bruna Almeida e Shelley" como coordenador.
select v.numero, v.data_saida, p.nome as coordenador
from public.viagens v
join public.profissionais p on p.id = v.coordenador_id
where p.nome = 'Bruna Almeida e Shelley';

-- Conferência: viagens que agora têm as duas coordenadoras (só funciona após rodar o
-- schema.sql atualizado, que cria viagem_coordenadores).
select v.numero, v.data_saida, array_agg(p.nome order by vc.posicao) as coordenadores
from public.viagem_coordenadores vc
join public.viagens v on v.id = vc.viagem_id
join public.profissionais p on p.id = vc.profissional_id
where vc.viagem_id in (
  select viagem_id from public.viagem_coordenadores
  where profissional_id in (
    select id from public.profissionais where nome in ('Bruna Almeida', 'Shelley')
  )
)
group by v.numero, v.data_saida
order by v.data_saida;
