// Gera supabase/seed.sql a partir de:
//  - ipm_system.csv (histórico do sistema IPM, 2018-2026)
//  - a lista fixa das viagens do calendário 2026 (antigo supabase/seed.sql)
//
// Não escreve no banco. Apenas produz o SQL, com normalização de nomes
// (barcos, parceiros, profissionais) e um relatório de decisões no console.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { loadCsv } = require('./parse-csv');

const ROOT = path.join(__dirname, '..', '..');
const CSV_PATH = path.join(ROOT, 'ipm_system.csv');
const OUT_PATH = path.join(ROOT, 'supabase', 'seed.sql');

// ---------------------------------------------------------------------------
// Helpers genéricos
// ---------------------------------------------------------------------------

function collapseWs(s) {
  return s.replace(/\s+/g, ' ').trim();
}

function sqlStr(v) {
  if (v === null || v === undefined) return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}

function sqlInt(v) {
  if (v === null || v === undefined || v === '') return 'NULL';
  return String(v);
}

function sqlBool(v) {
  return v ? 'true' : 'false';
}

function parseDateBr(s) {
  // dd/mm/yyyy -> yyyy-mm-dd
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((s || '').trim());
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

// Extrai o primeiro inteiro de uma string e devolve { valor, nota(resto) }
// Trata "1.234" / "12.345" como milhar (formato PT-BR), não decimal.
function parseNumericWithNote(raw) {
  const s = (raw || '').trim();
  if (s === '') return { valor: null, nota: null };
  if (/^-?\d+$/.test(s)) return { valor: parseInt(s, 10), nota: null };
  if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) return { valor: parseInt(s.replace(/\./g, ''), 10), nota: null };
  const milharMatch = /^(-?\d{1,3}(?:\.\d{3})+)\s*(.*)$/.exec(s);
  if (milharMatch) {
    return { valor: parseInt(milharMatch[1].replace(/\./g, ''), 10), nota: collapseWs(milharMatch[2]) || null };
  }
  const m = /^(-?\d+)\s*(.*)$/.exec(s);
  if (m) return { valor: parseInt(m[1], 10), nota: collapseWs(m[2]) || null };
  return { valor: null, nota: collapseWs(s) };
}

// ---------------------------------------------------------------------------
// Normalização: barcos / tipos de transporte
// ---------------------------------------------------------------------------

const BOAT_ALIASES = {
  'barco linda e esperança': 'Linda e Esperança',
  'linda e esperança': 'Linda e Esperança',
  'barco linda esperança': 'Linda e Esperança',
  'barco jj mesquita': 'JJ Mesquita',
  'jj mesquita': 'JJ Mesquita',
  'j. j. mesquita': 'JJ Mesquita',
  'barco amor e esperança': 'Amor e Esperança',
  'amor e esperança': 'Amor e Esperança',
  'amor e eperança': 'Amor e Esperança',
  'barco serguem silva': 'Serguem Silva',
  'barco cordeiro de deus': 'Cordeiro de Deus',
  'barco discovery': 'Discovery',
  'barco ferreira filho': 'Ferreira Filho',
  'ferreira filho': 'Ferreira Filho',
  'barco jesus a esperança': 'Jesus a Esperança',
  "barco joás silva xii": 'Joás Silva XII',
  'barco mãe maria': 'Mãe Maria',
  'mãe maria': 'Mãe Maria',
  'barco pró amazônia': 'Pró Amazônia',
  'barco vento do sul': 'Vento do Sul',
  'muruaga': 'Muruaga',
  'luz na floresta': 'Luz na Floresta',
};

// Meio de transporte / barco_local (calendário) -> { tipoTransporte, barco }
function resolveTransporte(rawMeio) {
  const raw = collapseWs(rawMeio || '');
  if (!raw) return { tipoTransporte: null, barco: null };
  const key = raw.toLowerCase();

  if (key === 'carro') return { tipoTransporte: 'Carro', barco: null };
  if (key === 'ônibus' || key === 'onibus') return { tipoTransporte: 'Ônibus', barco: null };

  if (BOAT_ALIASES[key]) return { tipoTransporte: 'Barco', barco: BOAT_ALIASES[key] };
  if (key === 'barco') return { tipoTransporte: 'Barco', barco: null };
  if (key.startsWith('barco ')) {
    // nome de barco não catalogado explicitamente acima
    const nome = collapseWs(raw.replace(/^barco\s+/i, ''));
    return { tipoTransporte: 'Barco', barco: nome };
  }
  // valores como "AMAZON", "EPV", "CTM" (calendário 2026) não são embarcações nem carros
  return { tipoTransporte: null, barco: null, localTexto: raw };
}

// ---------------------------------------------------------------------------
// Normalização: parceiros
// ---------------------------------------------------------------------------

const PARTNER_ALIASES = {
  'amazon outreah': 'Amazon Outreach',
  'amazon outtreach': 'Amazon Outreach',
  'northwoords church': 'Northwoods Church',
  'wp brasil': 'WP Brasil',
  'w.p.brasil': 'WP Brasil',
  'christ community church (ccc)': 'Christ Community Church - CCC',
  'calvary bible church colorado(eua)': 'Calvary Bible Church (Colorado, EUA)',
  "carpenter's way church, lufkin, texas": "Carpenter's Way Church (Lufkin, Texas)",
};

// Overrides de cidade/país para parceiros conhecidos (heurística, não exaustiva)
const PARTNER_LOCATION_OVERRIDES = {
  'Amazon Outreach': { cidade: null, pais: 'EUA' },
};

function normalizePartnerName(raw) {
  const collapsed = collapseWs(raw || '');
  if (!collapsed || collapsed === '-') return null;
  const key = collapsed.toLowerCase();
  return PARTNER_ALIASES[key] || collapsed;
}

function extractPartnerLocation(nome) {
  if (PARTNER_LOCATION_OVERRIDES[nome]) return PARTNER_LOCATION_OVERRIDES[nome];
  let cidade = null;
  let pais = null;
  const parenMatch = /\(([^)]+)\)\s*$/.exec(nome);
  if (parenMatch) {
    const inside = parenMatch[1];
    if (/eua/i.test(inside)) {
      pais = 'EUA';
      const cityPart = inside.replace(/,?\s*eua/i, '').trim();
      if (cityPart) cidade = cityPart;
    } else if (inside.includes(',')) {
      cidade = collapseWs(inside);
    } else {
      cidade = inside;
    }
  } else if (/,\s*eua\s*$/i.test(nome)) {
    pais = 'EUA';
    cidade = null;
  }
  return { cidade, pais };
}

// ---------------------------------------------------------------------------
// Normalização: profissionais (coordenador / líder da equipe de saúde)
// ---------------------------------------------------------------------------

function fixTitleSpacing(s) {
  return s
    .replace(/^Pr\.(?=\S)/i, 'Pr. ')
    .replace(/^Pr\s+(?=\S)/i, 'Pr. ')
    .replace(/^Dr\.(?=\S)/i, 'Dr. ')
    .replace(/^Dra\.(?=\S)/i, 'Dra. ')
    .replace(/^Ev\.(?=\S)/i, 'Ev. ')
    .replace(/^DR,\s*/i, 'Dr. ')
    .replace(/^Dr,\s*/i, 'Dr. ');
}

const PERSON_ALIASES = {
  // Djailson Rodrigues aparece com muitas grafias/abreviações ao longo dos anos
  'dr.djailson': 'Dr. Djailson Rodrigues',
  'dr. djailson': 'Dr. Djailson Rodrigues',
  'djailson rodrigues': 'Dr. Djailson Rodrigues',
  'dr, djailson rodruges': 'Dr. Djailson Rodrigues',
  'dr. djailson rodruges': 'Dr. Djailson Rodrigues',

  'pr. emerson': 'Pr. Emerson Torres',
  'pr emerson': 'Pr. Emerson Torres',
  'pr. emerson torres': 'Pr. Emerson Torres',

  'ev. josé carlos': 'Ev. José Carlos',
  'evangelista josé carlos': 'Ev. José Carlos',

  'ev. assis viana': 'Ev. Assis Viana',
  'evangelista assis viana': 'Ev. Assis Viana',

  'pr. rogerio trindade': 'Pr. Rogério Trindade',
  'pr. rogério trindade': 'Pr. Rogério Trindade',
  'rogério trindade': 'Pr. Rogério Trindade',

  'evangelista arício junior': 'Ev. Arício Junior',
  'evangelista débora mesquita': 'Ev. Débora Mesquita',
};

function normalizePersonName(raw, roleColumn) {
  let collapsed = collapseWs(raw || '');
  if (!collapsed || collapsed === '-') return null;
  collapsed = fixTitleSpacing(collapsed);
  const key = collapsed.toLowerCase();
  const canonical = PERSON_ALIASES[key] || collapsed;
  return canonical;
}

// ---------------------------------------------------------------------------
// Mapeamento das colunas de métricas (14..102 no CSV) -> colunas do banco
// ---------------------------------------------------------------------------

const METRIC_COLUMNS = [
  ['Atendimentos médicos', 'atendimentos_medicos'],
  ['Crianças (med)', 'criancas_medico'],
  ['Adolescentes (med)', 'adolescentes_medico'],
  ['Adultos (med)', 'adultos_medico'],
  ['Atendimentos odontológicos', 'atendimentos_odontologicos'],
  ['Crianças (odonto)', 'criancas_odonto'],
  ['Adolescentes (odonto)', 'adolescentes_odonto'],
  ['Adultos (odonto)', 'adultos_odonto'],
  ['Procedimentos odonto', 'procedimentos_odonto'],
  ['Kits odonto', 'kits_odonto'],
  ['Atendimentos de enfermagem', 'atendimentos_enfermagem'],
  ['Crianças (enf)', 'criancas_enfermagem'],
  ['Adolescentes (enf)', 'adolescentes_enfermagem'],
  ['Adultos(enf)', 'adultos_enfermagem'],
  ['Procedimentos de enfermagem', 'procedimentos_enfermagem'],
  ['Consultas de enfermagem', 'consultas_enfermagem'],
  ['Atendimentos fisioterapia', 'atendimentos_fisioterapia'],
  ['Atendimentos psicologia', 'atendimentos_psicologia'],
  ['Atendimentos dermatologia', 'atendimentos_dermatologia'],
  ['Atendimento fonoaudiologia', 'atendimentos_fonoaudiologia'],
  ['Atendimento nutricionista', 'atendimentos_nutricionista'],
  ['Atividades evangelísticas', 'atividades_evangelisticas'],
  ['Evangelismo/Palestra infantil', 'evangelismo_palestra_infantil'],
  ['Palestra/Reunião de mulheres', 'palestra_reuniao_mulheres'],
  ['Ministério/Palestra Adolesc', 'ministerio_palestra_adolescentes'],
  ['Palestra/Reunião de homens', 'palestra_reuniao_homens'],
  ['Bíblias', 'biblias_distribuidas'],
  ['Evangelismo nas casas', 'evangelismo_nas_casas'],
  ['Cultos/Devocional', 'cultos_devocional'],
  ['Decisão por Cristo', 'decisoes_por_cristo'],
  ['Ceia do Senhor', 'ceia_do_senhor'],
  ['Batismo', 'batismos'],
  ['Atividades de saúde', 'atividades_saude'],
  ['Aerosolterapia', 'aerosolterapia'],
  ['Aplicação de Fluor', 'aplicacao_fluor'],
  ['Curativos', 'curativos'],
  ['Encaminh. p/Unidade Hospitalar', 'encaminhamentos_unidade_hospitalar'],
  ['Entrega de medicamentos', 'entrega_medicamentos'],
  ['Escovas e cremes dentais', 'escovas_cremes_dentais'],
  ['Exame de hemoglobina glicada', 'exame_hemoglobina_glicada'],
  ['Exame de sífilis', 'exame_sifilis'],
  ['Exame de urina', 'exame_urina'],
  ['Exame de hanseníase', 'exame_hanseniase'],
  ['Hemograma simples MTX', 'hemograma_simples_mtx'],
  ['Inalação', 'inalacao'],
  ['Internação Emergência/Urgência', 'internacao_emergencia_urgencia'],
  ['Kit de higiene', 'kit_higiene'],
  ['Lavagem Nasal com Procedimento', 'lavagem_nasal_procedimento'],
  ['Lavagem de ouvido', 'lavagem_ouvido'],
  ['Manutenção de Prótese', 'manutencao_protese'],
  ['Medicação EV/IM', 'medicacao_ev_im'],
  ['Medicação Ocular', 'medicacao_ocular'],
  ['Medicação Oral', 'medicacao_oral'],
  ['Medicação Tópica', 'medicacao_topica'],
  ['Paciente em Observação', 'paciente_observacao'],
  ['Palestra de higiene bucal', 'palestra_higiene_bucal'],
  ['Pequenas Cirurgias', 'pequenas_cirurgias'],
  ['Prenatal', 'prenatal'],
  ['Prótese', 'protese'],
  ['Retirada de gesso', 'retirada_gesso'],
  ['Teste AIDS', 'teste_aids'],
  ['Teste de Covid-19', 'teste_covid19'],
  ['Teste de glicemia', 'teste_glicemia'],
  ['Teste de gravidez', 'teste_gravidez'],
  ['Teste Doppler', 'teste_doppler'],
  ['Ultrassonografia', 'ultrassonografia'],
  ['Vacinas', 'vacinas'],
  ['Visitas domiciliares', 'visitas_domiciliares'],
  ['Outras atividades', 'outras_atividades'],
  ['Aconselhamento', 'aconselhamento'],
  ['Brinquedos doados para crianças', 'brinquedos_doados_criancas'],
  ['Cestas basicas', 'cestas_basicas'],
  ['Corte de cabelo', 'corte_cabelo'],
  ['Curso de Empreendedorismo', 'curso_empreendedorismo'],
  ['Doação de gerador', 'doacao_gerador'],
  ['Doação de óculos', 'doacao_oculos'],
  ['Kit de lanche', 'kit_lanche'],
  ['Kit para crianças/escolar', 'kit_criancas_escolar'],
  ['Kit para mulheres', 'kit_mulheres'],
  ['Kit para homens', 'kit_homens'],
  ['Lembranças', 'lembrancas'],
  ['Orientação Jurídica', 'orientacao_juridica'],
  ['Orientação/ Assistente Social', 'orientacao_assistente_social'],
  ['Pintura de casas', 'pintura_casas'],
  ['Poços', 'pocos_perfurados'],
  ['Produtos de cabelo', 'produtos_cabelo'],
  ['Sacolas de roupas', 'sacolas_roupas'],
  ['Treinamento de liderança local', 'treinamento_lideranca_local'],
  ['Curso de Gestão Financeira', 'curso_gestao_financeira'],
];

// ---------------------------------------------------------------------------
// Grupos dinâmicos ("Atividades e procedimentos de saúde" e "Assistência social e
// doações"): essas colunas não existem mais em public.atendimentos — viram linhas em
// atendimentos_extra, referenciando campos_estatisticos pelo nome usado no formulário
// (não pelo cabeçalho do CSV, que às vezes difere levemente). Precisa ficar em sincronia
// com os dois grupos marcados `dinamico` em src/lib/atendimentos-fields.ts.
// ---------------------------------------------------------------------------

const DYNAMIC_METRIC_GROUPS = {
  atividades_saude: ['atividades_procedimentos_saude', 'Atividades de saúde'],
  aerosolterapia: ['atividades_procedimentos_saude', 'Aerosolterapia'],
  aplicacao_fluor: ['atividades_procedimentos_saude', 'Aplicação de flúor'],
  curativos: ['atividades_procedimentos_saude', 'Curativos'],
  encaminhamentos_unidade_hospitalar: ['atividades_procedimentos_saude', 'Encaminh. p/ Unidade Hospitalar'],
  entrega_medicamentos: ['atividades_procedimentos_saude', 'Entrega de medicamentos'],
  escovas_cremes_dentais: ['atividades_procedimentos_saude', 'Escovas e cremes dentais'],
  exame_hemoglobina_glicada: ['atividades_procedimentos_saude', 'Exame de hemoglobina glicada'],
  exame_sifilis: ['atividades_procedimentos_saude', 'Exame de sífilis'],
  exame_urina: ['atividades_procedimentos_saude', 'Exame de urina'],
  exame_hanseniase: ['atividades_procedimentos_saude', 'Exame de hanseníase'],
  hemograma_simples_mtx: ['atividades_procedimentos_saude', 'Hemograma simples MTX'],
  inalacao: ['atividades_procedimentos_saude', 'Inalação'],
  internacao_emergencia_urgencia: ['atividades_procedimentos_saude', 'Internação Emergência/Urgência'],
  kit_higiene: ['atividades_procedimentos_saude', 'Kit de higiene'],
  lavagem_nasal_procedimento: ['atividades_procedimentos_saude', 'Lavagem nasal com procedimento'],
  lavagem_ouvido: ['atividades_procedimentos_saude', 'Lavagem de ouvido'],
  manutencao_protese: ['atividades_procedimentos_saude', 'Manutenção de prótese'],
  medicacao_ev_im: ['atividades_procedimentos_saude', 'Medicação EV/IM'],
  medicacao_ocular: ['atividades_procedimentos_saude', 'Medicação ocular'],
  medicacao_oral: ['atividades_procedimentos_saude', 'Medicação oral'],
  medicacao_topica: ['atividades_procedimentos_saude', 'Medicação tópica'],
  paciente_observacao: ['atividades_procedimentos_saude', 'Paciente em observação'],
  palestra_higiene_bucal: ['atividades_procedimentos_saude', 'Palestra de higiene bucal'],
  pequenas_cirurgias: ['atividades_procedimentos_saude', 'Pequenas cirurgias'],
  prenatal: ['atividades_procedimentos_saude', 'Prenatal'],
  protese: ['atividades_procedimentos_saude', 'Prótese'],
  retirada_gesso: ['atividades_procedimentos_saude', 'Retirada de gesso'],
  teste_aids: ['atividades_procedimentos_saude', 'Teste AIDS'],
  teste_covid19: ['atividades_procedimentos_saude', 'Teste de Covid-19'],
  teste_glicemia: ['atividades_procedimentos_saude', 'Teste de glicemia'],
  teste_gravidez: ['atividades_procedimentos_saude', 'Teste de gravidez'],
  teste_doppler: ['atividades_procedimentos_saude', 'Teste Doppler'],
  ultrassonografia: ['atividades_procedimentos_saude', 'Ultrassonografia'],
  vacinas: ['atividades_procedimentos_saude', 'Vacinas'],
  visitas_domiciliares: ['atividades_procedimentos_saude', 'Visitas domiciliares'],
  outras_atividades: ['assistencia_social_doacoes', 'Outras atividades'],
  aconselhamento: ['assistencia_social_doacoes', 'Aconselhamento'],
  brinquedos_doados_criancas: ['assistencia_social_doacoes', 'Brinquedos doados para crianças'],
  cestas_basicas: ['assistencia_social_doacoes', 'Cestas básicas'],
  corte_cabelo: ['assistencia_social_doacoes', 'Corte de cabelo'],
  curso_empreendedorismo: ['assistencia_social_doacoes', 'Curso de Empreendedorismo'],
  doacao_gerador: ['assistencia_social_doacoes', 'Doação de gerador'],
  doacao_oculos: ['assistencia_social_doacoes', 'Doação de óculos'],
  kit_lanche: ['assistencia_social_doacoes', 'Kit de lanche'],
  kit_criancas_escolar: ['assistencia_social_doacoes', 'Kit para crianças/escolar'],
  kit_mulheres: ['assistencia_social_doacoes', 'Kit para mulheres'],
  kit_homens: ['assistencia_social_doacoes', 'Kit para homens'],
  lembrancas: ['assistencia_social_doacoes', 'Lembranças'],
  orientacao_juridica: ['assistencia_social_doacoes', 'Orientação jurídica'],
  pintura_casas: ['assistencia_social_doacoes', 'Pintura de casas'],
  pocos_perfurados: ['assistencia_social_doacoes', 'Poços perfurados'],
  produtos_cabelo: ['assistencia_social_doacoes', 'Produtos de cabelo'],
  sacolas_roupas: ['assistencia_social_doacoes', 'Sacolas de roupas'],
  treinamento_lideranca_local: ['assistencia_social_doacoes', 'Treinamento de liderança local'],
  curso_gestao_financeira: ['assistencia_social_doacoes', 'Curso de Gestão Financeira'],
};

// ---------------------------------------------------------------------------
// Registries (deduplicação em memória, preservando ordem de primeira aparição)
// ---------------------------------------------------------------------------

function makeRegistry() {
  const order = [];
  const map = new Map();
  return {
    add(key, extra) {
      if (!key) return null;
      if (!map.has(key)) {
        map.set(key, { key, ...extra, count: 0 });
        order.push(key);
      }
      const entry = map.get(key);
      entry.count += 1;
      return entry;
    },
    get(key) {
      return map.get(key);
    },
    values() {
      return order.map((k) => map.get(k));
    },
  };
}

const tiposTransporte = makeRegistry();
const barcos = makeRegistry();
const parceiros = makeRegistry();
const profissionais = makeRegistry();

tiposTransporte.add('Barco');
tiposTransporte.add('Carro');
tiposTransporte.add('Ônibus');

// ---------------------------------------------------------------------------
// 1) Carrega e processa o CSV histórico (sistema IPM)
// ---------------------------------------------------------------------------

const { header, dataRows } = loadCsv(CSV_PATH);
const idx = (name) => header.indexOf(name);

const COL = {
  ano: idx('Ano'),
  nr: idx('Nr.'),
  saida: idx('Data de saída'),
  chegada: idx('Data de chegada'),
  dias: idx('Dias em missão'),
  tipoMissao: idx('Tipo de missão'),
  meioTransporte: idx('Meio de transporte'),
  area: idx('Área'),
  local: idx('Local'),
  p1: idx('parceiro_1'),
  p2: idx('parceiro_2'),
  p3: idx('parceiro_3'),
  coordenador: idx('Coordenador'),
  liderSaude: idx('Líder da equipe de saúde'),
};

const metricColIndexes = METRIC_COLUMNS.map(([csvName]) => idx(csvName));

const viagensSistema = [];

for (const row of dataRows) {
  const numero = collapseWs(row[COL.nr]);
  const ano = parseInt(row[COL.ano], 10);
  const dataSaida = parseDateBr(row[COL.saida]);
  const dataChegada = parseDateBr(row[COL.chegada]);
  const diasRaw = collapseWs(row[COL.dias]);
  const dias = diasRaw === '' ? null : parseInt(diasRaw, 10);
  const tipoMissao = collapseWs(row[COL.tipoMissao]) || null;

  const { tipoTransporte, barco } = resolveTransporte(row[COL.meioTransporte]);
  if (tipoTransporte) tiposTransporte.add(tipoTransporte);
  const barcoKey = barco ? `barco:${barco.toLowerCase()}` : null;
  if (barco) barcos.add(barcoKey, { nome: barco });

  const area = collapseWs(row[COL.area]) || null;
  const local = collapseWs(row[COL.local]) || null;

  const coordNome = normalizePersonName(row[COL.coordenador], 'coordenador');
  const coordKey = coordNome ? `pessoa:${coordNome.toLowerCase()}` : null;
  if (coordNome) profissionais.add(coordKey, { nome: coordNome, cargo: 'Coordenador' });

  const liderNome = normalizePersonName(row[COL.liderSaude], 'lider_saude');
  const liderKey = liderNome ? `pessoa:${liderNome.toLowerCase()}` : null;
  if (liderNome) profissionais.add(liderKey, { nome: liderNome, cargo: 'Líder da Equipe de Saúde' });

  const partnerEntries = [];
  [row[COL.p1], row[COL.p2], row[COL.p3]].forEach((raw, i) => {
    const nome = normalizePartnerName(raw);
    if (!nome) return;
    const key = `parceiro:${nome.toLowerCase()}`;
    const { cidade, pais } = extractPartnerLocation(nome);
    parceiros.add(key, { nome, cidade, pais });
    partnerEntries.push({ key, posicao: i + 1 });
  });

  const metrics = {};
  let metricsNotes = [];
  METRIC_COLUMNS.forEach(([csvName, dbName], i) => {
    const raw = row[metricColIndexes[i]];
    const { valor, nota } = parseNumericWithNote(raw);
    metrics[dbName] = valor;
    if (nota) metricsNotes.push(`${csvName}: "${raw.trim()}"`);
  });

  viagensSistema.push({
    origem: 'sistema_ipm',
    numero,
    ano,
    dataSaida,
    dataChegada,
    dias,
    tipoMissao,
    tipoTransporte,
    barcoKey,
    area,
    local,
    responsavelGrupo: null,
    coordKey,
    liderKey,
    cancelada: false,
    observacoes: null,
    partnerEntries,
    metrics,
    metricsObservacoes: metricsNotes.length ? metricsNotes.join('; ') : null,
  });
}

// ---------------------------------------------------------------------------
// 2) Viagens do calendário 2026 (dados fixos, antes hardcoded em seed.sql)
// ---------------------------------------------------------------------------

const CALENDARIO_2026 = [
  ['2026-05-01', '2026-05-03', 'Rio Negro', 'Cláudia Câmara', 'Viagem das Equipes', null, 'Pr. Ivan Laray', 'LUZ NA FLORESTA', 'Somente margem direita', false],
  ['2026-05-08', '2026-05-10', 'Estrada', 'Kinda', 'Avanço Missionário', null, 'Pr. Emerson', 'ÔNIBUS', 'Acertar o local com Pr. Emerson', false],
  ['2026-05-16', '2026-05-23', 'Rio Solimões', 'AO', 'Creekside Church (Lutz, Flórida)', null, 'Pr. Emerson', 'AMAZON', null, false],
  ['2026-05-17', '2026-05-23', 'CANCELADA', 'Bruno', 'WP BRASIL Agência Missionária', null, 'Pr. Emerson', 'J. J. MESQUITA', null, true],
  ['2026-05-24', '2026-05-30', 'Anori', 'Pr. Dilvan/Pr.Jay', 'Igreja Maranhão', null, 'Pr. Rogério', 'J. J. MESQUITA', 'Somente Evangelismo, Não havera atendimento', false],
  ['2026-05-29', '2026-05-29', 'Rio Negro', 'Juciane', 'Universitários', null, 'Pr. Raimundo Wilson', 'Luz na Floresta', 'Entrega de filtros Projeto Água Limpa', false],
  ['2026-05-30', '2026-06-05', 'Rio Unini', 'AO', 'First Baptist Church (Tyler, Texas)', null, 'Pr. Ivan / Ev. Assis', 'AMAZON', null, false],
  ['2026-05-31', '2026-06-06', 'Rio Negro', 'Dra. Aila', 'Igreja Presbiteriana Mosaico (Anapólis/GO)', null, 'Pr. Ivan', 'J. J. MESQUITA', 'Equipe tem 04 médicos e 03 dentistas', false],
  ['2026-06-12', '2026-06-14', 'Rio Negro', 'Debora Mesquita', 'Viagem das Equipes', null, 'Pr. Raimundo', 'LUZ NA FLORESTA', 'Somente margem esquerda', false],
  ['2026-06-12', '2026-06-18', 'CANCELADA', 'Pr. Edson', 'Igreja Presbiteriana Independente', null, 'Pr. Flávio / Dara', 'J.J. MESQUITA', null, true],
  ['2026-06-12', '2026-06-19', 'Rio Uatumã', 'AO', 'Citizens Church Family (Plano, Texas)', 'First Baptist Church of Palmetto (Palmetto, Flórida)', 'Pr. Paulo / Ev. José Carlos', 'AMAZON', null, false],
  ['2026-06-13', '2026-06-20', 'URUCARÁ', 'AO', 'New Beginnings Church (Longview, Texas)', 'First Baptist Church Burleson (Burleson, Texas)', 'Pr. Paulo / Ev. Arício Jr.', 'AMAZON / POÇO', 'POÇO', false],
  ['2026-06-14', '2026-06-24', 'UNINI', 'Branquinho', 'Igreja Sal da Terra', null, 'Pr. Ivan', 'Ferreira Filho', '20 PESSOAS', false],
  ['2026-06-19', '2026-06-21', 'Estrada', 'Juciane Seleguim', 'Avanço Missionário', null, 'Pr. Paulo Belan', 'ÔNIBUS', 'Acertar o local com Pr. Paulo Belan', false],
  ['2026-06-19', '2026-06-25', 'BERURI', 'AO', 'South Spring Baptist Church (Tyler, Texas)', 'Northwestern College (Orange City, Iowa)', 'Pr. Franklin', 'AMAZON', null, false],
  ['2026-06-21', '2026-06-26', 'Rio Negro', 'SUE / Pr. Thiago', 'Community Reformed - Sue', null, 'Pr. Rogério', 'J.J. MESQUITA', '13 AMERICANOS', false],
  ['2026-06-28', '2026-07-04', 'Rio Negro', 'Lucee Price', 'Northland Church', null, 'Pr. Raimundo', 'J.J. MESQUITA', null, false],
  ['2026-07-03', '2026-07-09', 'MAUÉS', 'AO', 'Coppell Bible Church (Coppell, Texas)', null, 'Pr. Daniel Carvalho', 'AMAZON', 'Equipe grande', false],
  ['2026-07-03', '2026-07-05', 'Rio Negro', null, 'Viagem das Equipes', null, 'Pr. Ivan Laray', 'LUZ NA FLORESTA', 'Somente margem direita', false],
  ['2026-07-11', '2026-07-18', 'URUCARÁ', 'Pr. Ryan - AO', 'New Hope Baptist Church (Cedar Park, Texas)', null, 'Pr. Paulo / Ev. Arício', 'AMAZON', null, false],
  ['2026-07-12', '2026-07-18', 'Rio Solimões', 'Fernanda', 'MACKENZIE', null, 'Pr. Emerson', 'J.J. MESQUITA', null, false],
  ['2026-07-17', '2026-07-23', 'Rio Andirá', 'AO', "Carpenter's Way Church (Lufkin, Texas)", null, 'Pr. Mário', 'AMAZON', 'Dra. Vanessa', false],
  ['2026-07-20', '2026-07-25', 'Rio Amazonas', 'Yuri / Opção 3', 'Igreja Presbiteriana Esperança (Vitória/ES)', null, 'Ev. Silvio', 'J.J. MESQUITA', '22 pessoas - 05 médicos e 01 dentista', false],
  ['2026-07-25', '2026-08-01', 'BADAJÓS/Solimões', 'AO', 'Bethel Bible Church', null, 'Pr. Rogério', 'AMAZON', null, false],
  ['2026-07-26', '2026-08-01', 'Rio Negro', 'Sandra', 'TAMPA BAY', null, 'Pr. Raimundo', 'J.J. MESQUITA', null, false],
  ['2026-07-26', '2026-08-02', 'SUPREMO', 'Juciane', 'SMRT', null, null, 'EPV', null, false],
  ['2026-08-07', '2026-08-09', 'Rio Negro', 'Cláudia Camara', 'Viagem das Equipes', null, 'Pr. Raimundo', 'LUZ NA FLORESTA', 'Somente margem esquerda', false],
  ['2026-08-14', '2026-08-16', 'Estrada', 'Kinda', 'Avanço Missionário', null, 'Pr. Emerson', 'ÔNIBUS', 'Acertar o local com Pr. Emerson', false],
  ['2026-08-09', '2026-08-15', 'CANCELADA', 'Pr. Thiago', 'RCA', null, 'Evang. Silvio', 'J.J. MESQUITA', null, true],
  ['2026-08-22', '2026-08-22', 'Manaus', 'Juci/Lia/Carina', 'Crianças Igreja sede', null, 'Pr. Eustáquio', 'EPV', '1º Corrida Missionária Kids', false],
  ['2026-08-29', '2026-08-29', 'Manuas', 'Claudia', 'Membros da igreja', null, 'Pr. Eustáquio', 'EPV', 'Culto de Missões', false],
  ['2026-08-29', '2026-09-06', 'Nhamundá / Riozinho', 'Pr. Thiago', 'First Reformed Orange City', null, null, 'LUZ NA FLORESTA', null, false],
  ['2026-09-04', '2026-09-06', 'Rio Negro', 'Claudia Camera', 'Viagem das Equipes', null, 'Pr. Ivan Laray', 'LUZ NA FLORESTA', 'Somente margem direita', false],
  ['2026-09-11', '2026-09-13', 'CONFERÊNCIA', 'Juciane', 'SMRT', null, 'Pr. Eustáquio', 'EPV', null, false],
  ['2026-09-13', '2026-09-15', 'Rio Negro', 'SMRT', 'VIAGEM DE VISÃO', null, 'Pr. Francisco', 'J. J. MESQUITA', null, false],
  ['2026-09-14', '2026-09-18', 'CTM', 'Pr. Eustáquio / SMRT', 'CAPACITAÇÃO / PASTORES', null, null, 'CTM', null, false],
  ['2026-09-18', '2026-09-20', 'Manacapuru', 'Pr. Thiago / SMRT', 'CAPACITAÇÃO / Manacapuru', null, null, null, null, false],
  ['2026-09-27', '2026-10-03', 'ITAPEAÇU', 'Caio', 'CCC', null, 'Ev. Silvio', 'J. J. MESQUITA', null, false],
  ['2026-10-04', '2026-10-10', 'Rio Negro / ME', 'Lucee Price', 'NORTHLAND', null, 'Pr. Raimundo', 'J.J. MESQUITA', null, false],
  ['2026-10-11', '2026-10-17', 'Rio Negro / MD', 'Dr. David', 'CALVARY', null, 'Pr. Ivan', 'J. J. MESQUITA', null, false],
  ['2026-10-18', '2026-10-24', 'Rio Negro / ME', null, 'STONE', null, 'Pr. Raimundo', 'J. J. MESQUITA', null, false],
  ['2026-10-30', '2026-11-01', 'Rio Negro', 'Débora Mesquita', 'Viagem das Equipes', null, 'Pr. Raimundo', 'LUZ NA FLORESTA', 'Somente margem esquerda', false],
  ['2026-11-13', '2026-11-15', 'Rio Negro', 'Cláudia Câmara', 'Viagem das Equipes', null, 'Pr. Ivan Laray', 'LUZ NA FLORESTA', 'Somente margem direita', false],
  ['2026-11-20', '2026-11-22', 'Estrada', 'Kinda', 'Avanço Missionário', null, 'Pr. Paulo Belan', 'ÔNIBUS', 'Acertar o local com Pr. Paulo Belan', false],
  ['2026-11-27', '2026-11-29', 'Rio Negro', 'Cláudia Câmara', 'Viagem das Equipes', null, 'Pr. Raimundo', 'LUZ NA FLORESTA', 'Somente margem esquerda', false],
  ['2026-12-04', '2026-12-06', 'Rio Negro', 'Debora Mesquita', 'Viagem das Equipes', null, 'Pr. Ivan Laray', 'LUZ NA FLORESTA', 'Somente margem direita', false],
  ['2026-12-11', '2026-12-12', 'Estrada', 'Kinda', 'Avanço Missionário', null, 'Pr. Emerson', 'ÔNIBUS', 'Acertar o local com Pr. Emerson', false],
  ['2026-12-18', '2026-12-19', 'Rio Negro', 'Debora Mesquita', 'Viagem das Equipes', null, 'Pr. Raimundo', 'LUZ NA FLORESTA', 'Somente margem esquerda', false],
  ['2026-12-28', '2027-01-03', null, 'AO', 'A CONFIRMAR - TYLER', null, null, 'AMAZON', null, false],
];

const viagensCalendario = [];

for (const [
  dataSaida, dataChegada, regiaoRio, responsavelGrupo, grupo, grupoComplemento,
  coordenador, barcoLocal, observacoes, cancelada,
] of CALENDARIO_2026) {
  const { tipoTransporte, barco, localTexto } = resolveTransporte(barcoLocal);
  if (tipoTransporte) tiposTransporte.add(tipoTransporte);
  const barcoKey = barco ? `barco:${barco.toLowerCase()}` : null;
  if (barco) barcos.add(barcoKey, { nome: barco });

  const coordNome = normalizePersonName(coordenador, 'coordenador');
  const coordKey = coordNome ? `pessoa:${coordNome.toLowerCase()}` : null;
  if (coordNome) profissionais.add(coordKey, { nome: coordNome, cargo: 'Coordenador' });

  const partnerEntries = [];
  [grupo, grupoComplemento].forEach((raw, i) => {
    const nome = normalizePartnerName(raw);
    if (!nome) return;
    const key = `parceiro:${nome.toLowerCase()}`;
    const { cidade, pais } = extractPartnerLocation(nome);
    parceiros.add(key, { nome, cidade, pais });
    partnerEntries.push({ key, posicao: i + 1 });
  });

  const area = regiaoRio && regiaoRio !== 'CANCELADA' ? regiaoRio : (regiaoRio === 'CANCELADA' ? null : regiaoRio);

  viagensCalendario.push({
    origem: 'calendario_2026',
    numero: null,
    ano: 2026,
    dataSaida,
    dataChegada,
    dias: null,
    tipoMissao: null,
    tipoTransporte,
    barcoKey,
    area,
    local: localTexto || (barcoLocal && !barco ? barcoLocal : null),
    responsavelGrupo: responsavelGrupo || null,
    coordKey,
    liderKey: null,
    cancelada,
    observacoes,
    partnerEntries,
    metrics: null,
    metricsObservacoes: null,
  });
}

// ---------------------------------------------------------------------------
// Geração do SQL
// ---------------------------------------------------------------------------

const out = [];
out.push('-- Seed gerado a partir de ipm_system.csv (histórico 2018-2026) e do');
out.push('-- calendário de viagens 2026. Gerado por scripts/import/generate-seed.js.');
out.push('');
out.push('delete from public.atendimentos;');
out.push('delete from public.viagem_parceiros;');
out.push('delete from public.viagens;');
out.push('delete from public.profissionais;');
out.push('delete from public.parceiros;');
out.push('delete from public.barcos;');
out.push('delete from public.tipos_transporte;');
out.push('');

// tipos_transporte
out.push('insert into public.tipos_transporte (nome) values');
out.push(tiposTransporte.values().map((t) => `  (${sqlStr(t.key)})`).join(',\n') + ';');
out.push('');

// barcos
out.push('insert into public.barcos (nome) values');
out.push(barcos.values().map((b) => `  (${sqlStr(b.nome)})`).join(',\n') + ';');
out.push('');

// parceiros
out.push('insert into public.parceiros (nome, cidade, pais) values');
out.push(parceiros.values().map((p) => `  (${sqlStr(p.nome)}, ${sqlStr(p.cidade)}, ${sqlStr(p.pais)})`).join(',\n') + ';');
out.push('');

// profissionais
out.push('insert into public.profissionais (nome, cargo) values');
out.push(profissionais.values().map((p) => `  (${sqlStr(p.nome)}, ${sqlStr(p.cargo)})`).join(',\n') + ';');
out.push('');

// viagens: cada linha recebe um UUID gerado em JS, reaproveitado nos INSERTs
// de viagem_parceiros e atendimentos (evita depender de RETURNING/matching por data).
const allViagens = [...viagensSistema, ...viagensCalendario];
allViagens.forEach((v) => {
  v.id = crypto.randomUUID();
});

out.push('-- Viagens (histórico do sistema IPM + calendário 2026)');
out.push('insert into public.viagens');
out.push('  (id, origem, numero, ano, data_saida, data_chegada, dias_missao, tipo_missao,');
out.push('   tipo_transporte_id, barco_id, area, local, responsavel_grupo,');
out.push('   coordenador_id, lider_saude_id, cancelada, observacoes)');
out.push('values');

const viagensRows = allViagens.map((v) => {
  const tipoTransporteSub = v.tipoTransporte
    ? `(select id from public.tipos_transporte where nome = ${sqlStr(v.tipoTransporte)})`
    : 'NULL';
  const barco = v.barcoKey ? barcos.get(v.barcoKey) : null;
  const barcoSub = barco
    ? `(select id from public.barcos where nome = ${sqlStr(barco.nome)})`
    : 'NULL';
  const coord = v.coordKey ? profissionais.get(v.coordKey) : null;
  const coordSub = coord
    ? `(select id from public.profissionais where nome = ${sqlStr(coord.nome)})`
    : 'NULL';
  const lider = v.liderKey ? profissionais.get(v.liderKey) : null;
  const liderSub = lider
    ? `(select id from public.profissionais where nome = ${sqlStr(lider.nome)})`
    : 'NULL';

  return `  (${sqlStr(v.id)}, ${sqlStr(v.origem)}, ${sqlStr(v.numero)}, ${sqlInt(v.ano)}, ${sqlStr(v.dataSaida)}, ${sqlStr(v.dataChegada)}, ${sqlInt(v.dias)}, ${sqlStr(v.tipoMissao)}, ${tipoTransporteSub}, ${barcoSub}, ${sqlStr(v.area)}, ${sqlStr(v.local)}, ${sqlStr(v.responsavelGrupo)}, ${coordSub}, ${liderSub}, ${sqlBool(v.cancelada)}, ${sqlStr(v.observacoes)})`;
});

out.push(viagensRows.join(',\n') + ';');
out.push('');

// viagem_parceiros
const parceiroRows = [];
allViagens.forEach((v) => {
  v.partnerEntries.forEach(({ key, posicao }) => {
    const p = parceiros.get(key);
    parceiroRows.push(
      `  (${sqlStr(v.id)}, (select id from public.parceiros where nome = ${sqlStr(p.nome)}), ${posicao})`,
    );
  });
});
if (parceiroRows.length) {
  out.push('-- Parceiros por viagem');
  out.push('insert into public.viagem_parceiros (viagem_id, parceiro_id, posicao) values');
  out.push(parceiroRows.join(',\n') + ';');
  out.push('');
}

// atendimentos (só para viagens do sistema IPM, que têm métricas)
// Colunas fixas: exclui os grupos dinâmicos, que viram atendimentos_extra abaixo.
const metricDbNames = METRIC_COLUMNS.map(([, dbName]) => dbName).filter((dbName) => !DYNAMIC_METRIC_GROUPS[dbName]);
const atendimentoRows = [];
viagensSistema.forEach((v) => {
  const values = metricDbNames.map((dbName) => sqlInt(v.metrics[dbName]));
  atendimentoRows.push(
    `  (${sqlStr(v.id)}, ${values.join(', ')}, ${sqlStr(v.metricsObservacoes)})`,
  );
});
if (atendimentoRows.length) {
  out.push('-- Atendimentos e atividades (métricas do sistema IPM)');
  out.push(`insert into public.atendimentos (viagem_id, ${metricDbNames.join(', ')}, observacoes) values`);
  out.push(atendimentoRows.join(',\n') + ';');
  out.push('');
}

// campos_estatisticos: catálogo dos itens dos grupos dinâmicos (nasce populado com os
// nomes usados historicamente, para o autocomplete já vir útil).
const camposEstatisticosRows = Object.values(DYNAMIC_METRIC_GROUPS).map(
  ([grupo, nome]) => `  (${sqlStr(grupo)}, ${sqlStr(nome)})`,
);
out.push('-- Catálogo de itens dos grupos dinâmicos de atendimentos');
out.push('insert into public.campos_estatisticos (grupo, nome) values');
out.push(camposEstatisticosRows.join(',\n') + '\non conflict (grupo, nome) do nothing;');
out.push('');

// atendimentos_extra: quantidade de cada item dos grupos dinâmicos, por viagem do sistema IPM.
const atendimentosExtraRows = [];
viagensSistema.forEach((v) => {
  Object.entries(DYNAMIC_METRIC_GROUPS).forEach(([dbName, [grupo, nome]]) => {
    const quantidade = v.metrics[dbName];
    if (quantidade === null || quantidade === undefined || quantidade === 0) return;
    atendimentosExtraRows.push(
      `  (${sqlStr(v.id)}, (select id from public.campos_estatisticos where grupo = ${sqlStr(grupo)} and nome = ${sqlStr(nome)}), ${sqlInt(quantidade)})`,
    );
  });
});
if (atendimentosExtraRows.length) {
  out.push('-- Itens dos grupos dinâmicos de atendimentos, por viagem');
  out.push('insert into public.atendimentos_extra (viagem_id, campo_estatistico_id, quantidade) values');
  out.push(atendimentosExtraRows.join(',\n') + ';');
  out.push('');
}

fs.writeFileSync(OUT_PATH, out.join('\n'), 'utf8');
console.log('Seed gerado em:', OUT_PATH);
console.log('tipos_transporte:', tiposTransporte.values().length);
console.log('barcos:', barcos.values().length);
console.log('parceiros:', parceiros.values().length);
console.log('profissionais:', profissionais.values().length);
console.log('viagens sistema_ipm:', viagensSistema.length);
console.log('viagens calendario_2026:', viagensCalendario.length);
