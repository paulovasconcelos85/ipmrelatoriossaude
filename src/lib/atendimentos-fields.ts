export type AtendimentoField = {
  name: string;
  label: string;
  /** Marca o total do grupo (ex.: total de atendimentos médicos), para destacar visualmente dos números por faixa etária. */
  destaque?: boolean;
};

/** Chave de agrupamento usada em campos_estatisticos.grupo/atendimentos_extra para os grupos dinâmicos. */
export type ChaveGrupoDinamico =
  | 'atividades_procedimentos_saude'
  | 'assistencia_social_doacoes'
  | 'especialidades_medicas'
  | 'outros_atendimentos_saude'
  | 'atividades_evangelisticas';

export type AtendimentoGrupo = {
  titulo: string;
  campos: AtendimentoField[];
  /** Marca os grupos principais (médico, odontológico, enfermagem) para destaque visual no formulário. */
  destaque?: boolean;
  /** Soma automática: os `parcelas` são somados e preenchem o campo `total` a cada alteração (a pessoa pode sobrescrever depois). */
  somaAutomatica?: { total: string; parcelas: string[] };
  /**
   * Torna o grupo dinâmico: em vez de colunas fixas, a pessoa digita o nome do item (autocompletando os já
   * cadastrados em campos_estatisticos, ou cadastrando um novo) e a quantidade ao lado. Os valores ficam em
   * atendimentos_extra em vez de colunas fixas de public.atendimentos — pensado para grupos com dezenas de
   * opções raramente usadas, onde listar tudo fixo dificulta achar o campo certo. `campos` aqui vira só a
   * lista de nomes padrão usada para popular campos_estatisticos na migração inicial.
   */
  dinamico?: { chave: ChaveGrupoDinamico; campoNome: string; campoQtd: string };
  /**
   * Lista dinâmica adicional dentro de um grupo que também tem campos fixos (ex.: "Atendimento
   * médico" continua com o total e as faixas etárias, mas ganha uma quebra por especialidade,
   * onde o nome é digitado — autocompletando as já cadastradas em campos_estatisticos, ou
   * cadastrando uma nova — e a quantidade ao lado). Os valores ficam em atendimentos_extra.
   */
  dinamicoExtra?: { chave: ChaveGrupoDinamico; campoNome: string; campoQtd: string; titulo: string };
};

export const ATENDIMENTOS_GRUPOS: AtendimentoGrupo[] = [
  {
    titulo: 'Atendimento médico',
    destaque: true,
    somaAutomatica: {
      total: 'atendimentos_medicos',
      parcelas: ['criancas_medico', 'adolescentes_medico', 'adultos_medico'],
    },
    dinamicoExtra: {
      chave: 'especialidades_medicas',
      campoNome: 'especialidade_medica_nome',
      campoQtd: 'especialidade_medica_qtd',
      titulo: 'Atendimentos por especialidade',
    },
    campos: [
      { name: 'atendimentos_medicos', label: 'Atendimentos médicos', destaque: true },
      { name: 'criancas_medico', label: 'Crianças' },
      { name: 'adolescentes_medico', label: 'Adolescentes' },
      { name: 'adultos_medico', label: 'Adultos' },
    ],
  },
  {
    titulo: 'Atendimento odontológico',
    destaque: true,
    somaAutomatica: {
      total: 'atendimentos_odontologicos',
      parcelas: ['criancas_odonto', 'adolescentes_odonto', 'adultos_odonto'],
    },
    campos: [
      { name: 'atendimentos_odontologicos', label: 'Atendimentos odontológicos', destaque: true },
      { name: 'criancas_odonto', label: 'Crianças' },
      { name: 'adolescentes_odonto', label: 'Adolescentes' },
      { name: 'adultos_odonto', label: 'Adultos' },
      { name: 'procedimentos_odonto', label: 'Procedimentos odonto' },
      { name: 'kits_odonto', label: 'Kits odonto' },
    ],
  },
  {
    titulo: 'Atendimento de enfermagem',
    destaque: true,
    somaAutomatica: {
      total: 'atendimentos_enfermagem',
      parcelas: ['criancas_enfermagem', 'adolescentes_enfermagem', 'adultos_enfermagem'],
    },
    campos: [
      { name: 'atendimentos_enfermagem', label: 'Atendimentos de enfermagem', destaque: true },
      { name: 'criancas_enfermagem', label: 'Crianças' },
      { name: 'adolescentes_enfermagem', label: 'Adolescentes' },
      { name: 'adultos_enfermagem', label: 'Adultos' },
      { name: 'procedimentos_enfermagem', label: 'Procedimentos de enfermagem' },
      { name: 'consultas_enfermagem', label: 'Consultas de enfermagem' },
    ],
  },
  {
    titulo: 'Outros atendimentos de saúde',
    dinamico: {
      chave: 'outros_atendimentos_saude',
      campoNome: 'outro_atendimento_saude_item_nome',
      campoQtd: 'outro_atendimento_saude_item_qtd',
    },
    campos: [
      { name: 'atendimentos_fisioterapia', label: 'Fisioterapia' },
      { name: 'atendimentos_psicologia', label: 'Psicologia' },
      { name: 'atendimentos_dermatologia', label: 'Dermatologia' },
      { name: 'atendimentos_fonoaudiologia', label: 'Fonoaudiologia' },
      { name: 'atendimentos_nutricionista', label: 'Nutricionista' },
      { name: 'orientacao_assistente_social', label: 'Orientação/Assistente social' },
    ],
  },
  {
    titulo: 'Atividades evangelísticas',
    dinamico: {
      chave: 'atividades_evangelisticas',
      campoNome: 'atividade_evangelistica_item_nome',
      campoQtd: 'atividade_evangelistica_item_qtd',
    },
    campos: [
      { name: 'atividades_evangelisticas', label: 'Atividades evangelísticas' },
      { name: 'evangelismo_palestra_infantil', label: 'Evangelismo/Palestra infantil' },
      { name: 'palestra_reuniao_mulheres', label: 'Palestra/Reunião de mulheres' },
      { name: 'ministerio_palestra_adolescentes', label: 'Ministério/Palestra adolescentes' },
      { name: 'palestra_reuniao_homens', label: 'Palestra/Reunião de homens' },
      { name: 'biblias_distribuidas', label: 'Bíblias distribuídas' },
      { name: 'evangelismo_nas_casas', label: 'Evangelismo nas casas' },
      { name: 'cultos_devocional', label: 'Cultos/Devocional' },
      { name: 'decisoes_por_cristo', label: 'Decisões por Cristo' },
      { name: 'ceia_do_senhor', label: 'Ceia do Senhor' },
      { name: 'batismos', label: 'Batismos' },
    ],
  },
  {
    titulo: 'Atividades e procedimentos de saúde',
    dinamico: {
      chave: 'atividades_procedimentos_saude',
      campoNome: 'atividade_saude_item_nome',
      campoQtd: 'atividade_saude_item_qtd',
    },
    campos: [
      { name: 'atividades_saude', label: 'Atividades de saúde' },
      { name: 'aerosolterapia', label: 'Aerosolterapia' },
      { name: 'aplicacao_fluor', label: 'Aplicação de flúor' },
      { name: 'curativos', label: 'Curativos' },
      { name: 'encaminhamentos_unidade_hospitalar', label: 'Encaminh. p/ Unidade Hospitalar' },
      { name: 'entrega_medicamentos', label: 'Entrega de medicamentos' },
      { name: 'escovas_cremes_dentais', label: 'Escovas e cremes dentais' },
      { name: 'exame_hemoglobina_glicada', label: 'Exame de hemoglobina glicada' },
      { name: 'exame_sifilis', label: 'Exame de sífilis' },
      { name: 'exame_urina', label: 'Exame de urina' },
      { name: 'exame_hanseniase', label: 'Exame de hanseníase' },
      { name: 'hemograma_simples_mtx', label: 'Hemograma simples MTX' },
      { name: 'inalacao', label: 'Inalação' },
      { name: 'internacao_emergencia_urgencia', label: 'Internação Emergência/Urgência' },
      { name: 'kit_higiene', label: 'Kit de higiene' },
      { name: 'lavagem_nasal_procedimento', label: 'Lavagem nasal com procedimento' },
      { name: 'lavagem_ouvido', label: 'Lavagem de ouvido' },
      { name: 'manutencao_protese', label: 'Manutenção de prótese' },
      { name: 'medicacao_ev_im', label: 'Medicação EV/IM' },
      { name: 'medicacao_ocular', label: 'Medicação ocular' },
      { name: 'medicacao_oral', label: 'Medicação oral' },
      { name: 'medicacao_topica', label: 'Medicação tópica' },
      { name: 'paciente_observacao', label: 'Paciente em observação' },
      { name: 'palestra_higiene_bucal', label: 'Palestra de higiene bucal' },
      { name: 'pequenas_cirurgias', label: 'Pequenas cirurgias' },
      { name: 'prenatal', label: 'Prenatal' },
      { name: 'protese', label: 'Prótese' },
      { name: 'retirada_gesso', label: 'Retirada de gesso' },
      { name: 'teste_aids', label: 'Teste AIDS' },
      { name: 'teste_covid19', label: 'Teste de Covid-19' },
      { name: 'teste_glicemia', label: 'Teste de glicemia' },
      { name: 'teste_gravidez', label: 'Teste de gravidez' },
      { name: 'teste_doppler', label: 'Teste Doppler' },
      { name: 'ultrassonografia', label: 'Ultrassonografia' },
      { name: 'vacinas', label: 'Vacinas' },
      { name: 'visitas_domiciliares', label: 'Visitas domiciliares' },
    ],
  },
  {
    titulo: 'Assistência social e doações',
    dinamico: {
      chave: 'assistencia_social_doacoes',
      campoNome: 'assistencia_social_item_nome',
      campoQtd: 'assistencia_social_item_qtd',
    },
    campos: [
      { name: 'outras_atividades', label: 'Outras atividades' },
      { name: 'aconselhamento', label: 'Aconselhamento' },
      { name: 'brinquedos_doados_criancas', label: 'Brinquedos doados para crianças' },
      { name: 'cestas_basicas', label: 'Cestas básicas' },
      { name: 'corte_cabelo', label: 'Corte de cabelo' },
      { name: 'curso_empreendedorismo', label: 'Curso de Empreendedorismo' },
      { name: 'doacao_gerador', label: 'Doação de gerador' },
      { name: 'doacao_oculos', label: 'Doação de óculos' },
      { name: 'kit_lanche', label: 'Kit de lanche' },
      { name: 'kit_criancas_escolar', label: 'Kit para crianças/escolar' },
      { name: 'kit_mulheres', label: 'Kit para mulheres' },
      { name: 'kit_homens', label: 'Kit para homens' },
      { name: 'lembrancas', label: 'Lembranças' },
      { name: 'orientacao_juridica', label: 'Orientação jurídica' },
      { name: 'pintura_casas', label: 'Pintura de casas' },
      { name: 'pocos_perfurados', label: 'Poços perfurados' },
      { name: 'produtos_cabelo', label: 'Produtos de cabelo' },
      { name: 'sacolas_roupas', label: 'Sacolas de roupas' },
      { name: 'treinamento_lideranca_local', label: 'Treinamento de liderança local' },
      { name: 'curso_gestao_financeira', label: 'Curso de Gestão Financeira' },
    ],
  },
];

/** Campos com coluna fixa em public.atendimentos — exclui os grupos dinâmicos (guardados em atendimentos_extra). */
export const ATENDIMENTOS_CAMPOS = ATENDIMENTOS_GRUPOS.filter((g) => !g.dinamico).flatMap((g) => g.campos);

export type ItemEstatisticoExtra = { grupo: string; nome: string; quantidade: number };

/** Agrupa os atendimentos de uma viagem por grupo, mantendo só os campos com valor > 0. */
export function gruposAtendimentoComValores(viagem: {
  atendimentos: Record<string, number | null>;
  atendimentosExtras: ItemEstatisticoExtra[];
}) {
  return ATENDIMENTOS_GRUPOS.map((grupo) => {
    const camposFixos = grupo.dinamico
      ? viagem.atendimentosExtras
          .filter((item) => item.grupo === grupo.dinamico!.chave)
          .map((item) => ({ label: item.nome, valor: item.quantidade, destaque: false }))
      : grupo.campos
          .map((campo) => ({ label: campo.label, valor: viagem.atendimentos[campo.name], destaque: campo.destaque }))
          .filter((c) => typeof c.valor === 'number' && c.valor > 0);

    const camposExtra = grupo.dinamicoExtra
      ? viagem.atendimentosExtras
          .filter((item) => item.grupo === grupo.dinamicoExtra!.chave)
          .map((item) => ({ label: item.nome, valor: item.quantidade, destaque: false }))
      : [];

    return { titulo: grupo.titulo, campos: [...camposFixos, ...camposExtra] };
  }).filter((g) => g.campos.length > 0);
}
