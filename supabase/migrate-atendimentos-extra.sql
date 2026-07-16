-- Migração one-off: move os grupos "Atividades e procedimentos de saúde" e "Assistência
-- social e doações" de colunas fixas em public.atendimentos para o novo modelo dinâmico
-- (campos_estatisticos + atendimentos_extra). Rode DEPOIS de aplicar o schema.sql atualizado.
-- Este script é seguro para rodar mais de uma vez (idempotente) até a etapa final de "drop column",
-- que é irreversível — faça um backup/export da tabela atendimentos antes de rodar este arquivo.

-- 1) Catálogo: cadastra os nomes já usados hoje como colunas fixas, para o autocomplete nascer populado.
insert into public.campos_estatisticos (grupo, nome) values
  ('atividades_procedimentos_saude', 'Atividades de saúde'),
  ('atividades_procedimentos_saude', 'Aerosolterapia'),
  ('atividades_procedimentos_saude', 'Aplicação de flúor'),
  ('atividades_procedimentos_saude', 'Curativos'),
  ('atividades_procedimentos_saude', 'Encaminh. p/ Unidade Hospitalar'),
  ('atividades_procedimentos_saude', 'Entrega de medicamentos'),
  ('atividades_procedimentos_saude', 'Escovas e cremes dentais'),
  ('atividades_procedimentos_saude', 'Exame de hemoglobina glicada'),
  ('atividades_procedimentos_saude', 'Exame de sífilis'),
  ('atividades_procedimentos_saude', 'Exame de urina'),
  ('atividades_procedimentos_saude', 'Exame de hanseníase'),
  ('atividades_procedimentos_saude', 'Hemograma simples MTX'),
  ('atividades_procedimentos_saude', 'Inalação'),
  ('atividades_procedimentos_saude', 'Internação Emergência/Urgência'),
  ('atividades_procedimentos_saude', 'Kit de higiene'),
  ('atividades_procedimentos_saude', 'Lavagem nasal com procedimento'),
  ('atividades_procedimentos_saude', 'Lavagem de ouvido'),
  ('atividades_procedimentos_saude', 'Manutenção de prótese'),
  ('atividades_procedimentos_saude', 'Medicação EV/IM'),
  ('atividades_procedimentos_saude', 'Medicação ocular'),
  ('atividades_procedimentos_saude', 'Medicação oral'),
  ('atividades_procedimentos_saude', 'Medicação tópica'),
  ('atividades_procedimentos_saude', 'Paciente em observação'),
  ('atividades_procedimentos_saude', 'Palestra de higiene bucal'),
  ('atividades_procedimentos_saude', 'Pequenas cirurgias'),
  ('atividades_procedimentos_saude', 'Prenatal'),
  ('atividades_procedimentos_saude', 'Prótese'),
  ('atividades_procedimentos_saude', 'Retirada de gesso'),
  ('atividades_procedimentos_saude', 'Teste AIDS'),
  ('atividades_procedimentos_saude', 'Teste de Covid-19'),
  ('atividades_procedimentos_saude', 'Teste de glicemia'),
  ('atividades_procedimentos_saude', 'Teste de gravidez'),
  ('atividades_procedimentos_saude', 'Teste Doppler'),
  ('atividades_procedimentos_saude', 'Ultrassonografia'),
  ('atividades_procedimentos_saude', 'Vacinas'),
  ('atividades_procedimentos_saude', 'Visitas domiciliares'),
  ('assistencia_social_doacoes', 'Outras atividades'),
  ('assistencia_social_doacoes', 'Aconselhamento'),
  ('assistencia_social_doacoes', 'Brinquedos doados para crianças'),
  ('assistencia_social_doacoes', 'Cestas básicas'),
  ('assistencia_social_doacoes', 'Corte de cabelo'),
  ('assistencia_social_doacoes', 'Curso de Empreendedorismo'),
  ('assistencia_social_doacoes', 'Doação de gerador'),
  ('assistencia_social_doacoes', 'Doação de óculos'),
  ('assistencia_social_doacoes', 'Kit de lanche'),
  ('assistencia_social_doacoes', 'Kit para crianças/escolar'),
  ('assistencia_social_doacoes', 'Kit para mulheres'),
  ('assistencia_social_doacoes', 'Kit para homens'),
  ('assistencia_social_doacoes', 'Lembranças'),
  ('assistencia_social_doacoes', 'Orientação jurídica'),
  ('assistencia_social_doacoes', 'Pintura de casas'),
  ('assistencia_social_doacoes', 'Poços perfurados'),
  ('assistencia_social_doacoes', 'Produtos de cabelo'),
  ('assistencia_social_doacoes', 'Sacolas de roupas'),
  ('assistencia_social_doacoes', 'Treinamento de liderança local'),
  ('assistencia_social_doacoes', 'Curso de Gestão Financeira')
on conflict (grupo, nome) do nothing;

-- 2) Copia os valores já preenchidos nas viagens existentes para atendimentos_extra.
insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.atividades_saude
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Atividades de saúde'
where a.atividades_saude is not null and a.atividades_saude <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.aerosolterapia
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Aerosolterapia'
where a.aerosolterapia is not null and a.aerosolterapia <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.aplicacao_fluor
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Aplicação de flúor'
where a.aplicacao_fluor is not null and a.aplicacao_fluor <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.curativos
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Curativos'
where a.curativos is not null and a.curativos <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.encaminhamentos_unidade_hospitalar
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Encaminh. p/ Unidade Hospitalar'
where a.encaminhamentos_unidade_hospitalar is not null and a.encaminhamentos_unidade_hospitalar <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.entrega_medicamentos
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Entrega de medicamentos'
where a.entrega_medicamentos is not null and a.entrega_medicamentos <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.escovas_cremes_dentais
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Escovas e cremes dentais'
where a.escovas_cremes_dentais is not null and a.escovas_cremes_dentais <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.exame_hemoglobina_glicada
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Exame de hemoglobina glicada'
where a.exame_hemoglobina_glicada is not null and a.exame_hemoglobina_glicada <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.exame_sifilis
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Exame de sífilis'
where a.exame_sifilis is not null and a.exame_sifilis <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.exame_urina
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Exame de urina'
where a.exame_urina is not null and a.exame_urina <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.exame_hanseniase
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Exame de hanseníase'
where a.exame_hanseniase is not null and a.exame_hanseniase <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.hemograma_simples_mtx
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Hemograma simples MTX'
where a.hemograma_simples_mtx is not null and a.hemograma_simples_mtx <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.inalacao
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Inalação'
where a.inalacao is not null and a.inalacao <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.internacao_emergencia_urgencia
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Internação Emergência/Urgência'
where a.internacao_emergencia_urgencia is not null and a.internacao_emergencia_urgencia <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.kit_higiene
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Kit de higiene'
where a.kit_higiene is not null and a.kit_higiene <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.lavagem_nasal_procedimento
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Lavagem nasal com procedimento'
where a.lavagem_nasal_procedimento is not null and a.lavagem_nasal_procedimento <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.lavagem_ouvido
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Lavagem de ouvido'
where a.lavagem_ouvido is not null and a.lavagem_ouvido <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.manutencao_protese
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Manutenção de prótese'
where a.manutencao_protese is not null and a.manutencao_protese <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.medicacao_ev_im
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Medicação EV/IM'
where a.medicacao_ev_im is not null and a.medicacao_ev_im <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.medicacao_ocular
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Medicação ocular'
where a.medicacao_ocular is not null and a.medicacao_ocular <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.medicacao_oral
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Medicação oral'
where a.medicacao_oral is not null and a.medicacao_oral <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.medicacao_topica
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Medicação tópica'
where a.medicacao_topica is not null and a.medicacao_topica <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.paciente_observacao
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Paciente em observação'
where a.paciente_observacao is not null and a.paciente_observacao <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.palestra_higiene_bucal
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Palestra de higiene bucal'
where a.palestra_higiene_bucal is not null and a.palestra_higiene_bucal <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.pequenas_cirurgias
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Pequenas cirurgias'
where a.pequenas_cirurgias is not null and a.pequenas_cirurgias <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.prenatal
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Prenatal'
where a.prenatal is not null and a.prenatal <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.protese
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Prótese'
where a.protese is not null and a.protese <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.retirada_gesso
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Retirada de gesso'
where a.retirada_gesso is not null and a.retirada_gesso <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.teste_aids
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Teste AIDS'
where a.teste_aids is not null and a.teste_aids <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.teste_covid19
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Teste de Covid-19'
where a.teste_covid19 is not null and a.teste_covid19 <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.teste_glicemia
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Teste de glicemia'
where a.teste_glicemia is not null and a.teste_glicemia <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.teste_gravidez
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Teste de gravidez'
where a.teste_gravidez is not null and a.teste_gravidez <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.teste_doppler
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Teste Doppler'
where a.teste_doppler is not null and a.teste_doppler <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.ultrassonografia
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Ultrassonografia'
where a.ultrassonografia is not null and a.ultrassonografia <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.vacinas
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Vacinas'
where a.vacinas is not null and a.vacinas <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.visitas_domiciliares
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'atividades_procedimentos_saude' and ce.nome = 'Visitas domiciliares'
where a.visitas_domiciliares is not null and a.visitas_domiciliares <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.outras_atividades
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'assistencia_social_doacoes' and ce.nome = 'Outras atividades'
where a.outras_atividades is not null and a.outras_atividades <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.aconselhamento
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'assistencia_social_doacoes' and ce.nome = 'Aconselhamento'
where a.aconselhamento is not null and a.aconselhamento <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.brinquedos_doados_criancas
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'assistencia_social_doacoes' and ce.nome = 'Brinquedos doados para crianças'
where a.brinquedos_doados_criancas is not null and a.brinquedos_doados_criancas <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.cestas_basicas
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'assistencia_social_doacoes' and ce.nome = 'Cestas básicas'
where a.cestas_basicas is not null and a.cestas_basicas <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.corte_cabelo
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'assistencia_social_doacoes' and ce.nome = 'Corte de cabelo'
where a.corte_cabelo is not null and a.corte_cabelo <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.curso_empreendedorismo
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'assistencia_social_doacoes' and ce.nome = 'Curso de Empreendedorismo'
where a.curso_empreendedorismo is not null and a.curso_empreendedorismo <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.doacao_gerador
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'assistencia_social_doacoes' and ce.nome = 'Doação de gerador'
where a.doacao_gerador is not null and a.doacao_gerador <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.doacao_oculos
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'assistencia_social_doacoes' and ce.nome = 'Doação de óculos'
where a.doacao_oculos is not null and a.doacao_oculos <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.kit_lanche
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'assistencia_social_doacoes' and ce.nome = 'Kit de lanche'
where a.kit_lanche is not null and a.kit_lanche <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.kit_criancas_escolar
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'assistencia_social_doacoes' and ce.nome = 'Kit para crianças/escolar'
where a.kit_criancas_escolar is not null and a.kit_criancas_escolar <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.kit_mulheres
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'assistencia_social_doacoes' and ce.nome = 'Kit para mulheres'
where a.kit_mulheres is not null and a.kit_mulheres <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.kit_homens
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'assistencia_social_doacoes' and ce.nome = 'Kit para homens'
where a.kit_homens is not null and a.kit_homens <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.lembrancas
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'assistencia_social_doacoes' and ce.nome = 'Lembranças'
where a.lembrancas is not null and a.lembrancas <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.orientacao_juridica
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'assistencia_social_doacoes' and ce.nome = 'Orientação jurídica'
where a.orientacao_juridica is not null and a.orientacao_juridica <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.pintura_casas
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'assistencia_social_doacoes' and ce.nome = 'Pintura de casas'
where a.pintura_casas is not null and a.pintura_casas <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.pocos_perfurados
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'assistencia_social_doacoes' and ce.nome = 'Poços perfurados'
where a.pocos_perfurados is not null and a.pocos_perfurados <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.produtos_cabelo
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'assistencia_social_doacoes' and ce.nome = 'Produtos de cabelo'
where a.produtos_cabelo is not null and a.produtos_cabelo <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.sacolas_roupas
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'assistencia_social_doacoes' and ce.nome = 'Sacolas de roupas'
where a.sacolas_roupas is not null and a.sacolas_roupas <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.treinamento_lideranca_local
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'assistencia_social_doacoes' and ce.nome = 'Treinamento de liderança local'
where a.treinamento_lideranca_local is not null and a.treinamento_lideranca_local <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade)
select a.viagem_id, ce.id, a.curso_gestao_financeira
from public.atendimentos a
join public.campos_estatisticos ce on ce.grupo = 'assistencia_social_doacoes' and ce.nome = 'Curso de Gestão Financeira'
where a.curso_gestao_financeira is not null and a.curso_gestao_financeira <> 0
on conflict (viagem_id, campo_estatistico_id) do nothing;

-- 3) Remove as colunas antigas, agora substituídas pela tabela atendimentos_extra.
-- IRREVERSÍVEL — só rode depois de conferir que os dados migraram (passo 2) corretamente.
alter table public.atendimentos
  drop column if exists atividades_saude,
  drop column if exists aerosolterapia,
  drop column if exists aplicacao_fluor,
  drop column if exists curativos,
  drop column if exists encaminhamentos_unidade_hospitalar,
  drop column if exists entrega_medicamentos,
  drop column if exists escovas_cremes_dentais,
  drop column if exists exame_hemoglobina_glicada,
  drop column if exists exame_sifilis,
  drop column if exists exame_urina,
  drop column if exists exame_hanseniase,
  drop column if exists hemograma_simples_mtx,
  drop column if exists inalacao,
  drop column if exists internacao_emergencia_urgencia,
  drop column if exists kit_higiene,
  drop column if exists lavagem_nasal_procedimento,
  drop column if exists lavagem_ouvido,
  drop column if exists manutencao_protese,
  drop column if exists medicacao_ev_im,
  drop column if exists medicacao_ocular,
  drop column if exists medicacao_oral,
  drop column if exists medicacao_topica,
  drop column if exists paciente_observacao,
  drop column if exists palestra_higiene_bucal,
  drop column if exists pequenas_cirurgias,
  drop column if exists prenatal,
  drop column if exists protese,
  drop column if exists retirada_gesso,
  drop column if exists teste_aids,
  drop column if exists teste_covid19,
  drop column if exists teste_glicemia,
  drop column if exists teste_gravidez,
  drop column if exists teste_doppler,
  drop column if exists ultrassonografia,
  drop column if exists vacinas,
  drop column if exists visitas_domiciliares,
  drop column if exists outras_atividades,
  drop column if exists aconselhamento,
  drop column if exists brinquedos_doados_criancas,
  drop column if exists cestas_basicas,
  drop column if exists corte_cabelo,
  drop column if exists curso_empreendedorismo,
  drop column if exists doacao_gerador,
  drop column if exists doacao_oculos,
  drop column if exists kit_lanche,
  drop column if exists kit_criancas_escolar,
  drop column if exists kit_mulheres,
  drop column if exists kit_homens,
  drop column if exists lembrancas,
  drop column if exists orientacao_juridica,
  drop column if exists pintura_casas,
  drop column if exists pocos_perfurados,
  drop column if exists produtos_cabelo,
  drop column if exists sacolas_roupas,
  drop column if exists treinamento_lideranca_local,
  drop column if exists curso_gestao_financeira;
