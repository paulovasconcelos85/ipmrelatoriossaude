-- Substitui "Assit Social Kquinda Soares" por "Kquinda Soares" em todos os papéis
-- (coordenador, líder de saúde, voluntário) e apaga o cadastro duplicado. Idempotente.

do $$
declare
  fonte_id uuid;
  alvo_id uuid;
begin
  select id into fonte_id from public.profissionais where nome = 'Assit Social Kquinda Soares';
  if fonte_id is null then
    raise notice 'Profissional "Assit Social Kquinda Soares" não encontrado — nada a fazer.';
    return;
  end if;

  select id into alvo_id from public.profissionais where nome = 'Kquinda Soares';
  if alvo_id is null then
    raise exception 'Profissional "Kquinda Soares" não encontrado em public.profissionais.';
  end if;

  -- Colunas antigas (um só valor por viagem).
  update public.viagens set coordenador_id = alvo_id where coordenador_id = fonte_id;
  update public.viagens set lider_saude_id = alvo_id where lider_saude_id = fonte_id;

  -- Tabelas atuais (múltiplos por viagem) — remove o duplicado antes de trocar, pra não
  -- violar a chave primária (viagem_id, profissional_id) quando a viagem já tem as duas.
  if to_regclass('public.viagem_coordenadores') is not null then
    delete from public.viagem_coordenadores vc
    where vc.profissional_id = fonte_id
      and exists (select 1 from public.viagem_coordenadores vc2 where vc2.viagem_id = vc.viagem_id and vc2.profissional_id = alvo_id);
    update public.viagem_coordenadores set profissional_id = alvo_id where profissional_id = fonte_id;
  end if;

  if to_regclass('public.viagem_lideres_saude') is not null then
    delete from public.viagem_lideres_saude vls
    where vls.profissional_id = fonte_id
      and exists (select 1 from public.viagem_lideres_saude vls2 where vls2.viagem_id = vls.viagem_id and vls2.profissional_id = alvo_id);
    update public.viagem_lideres_saude set profissional_id = alvo_id where profissional_id = fonte_id;
  end if;

  delete from public.viagem_voluntarios vv
  where vv.profissional_id = fonte_id
    and exists (select 1 from public.viagem_voluntarios vv2 where vv2.viagem_id = vv.viagem_id and vv2.profissional_id = alvo_id);
  update public.viagem_voluntarios set profissional_id = alvo_id where profissional_id = fonte_id;

  -- Cadastro duplicado, agora sem nenhuma referência.
  delete from public.profissionais where id = fonte_id;

  raise notice 'Concluído: "Assit Social Kquinda Soares" substituído por "Kquinda Soares".';
end $$;
