import { supabase, supabaseConfigured } from './supabase/client';

export type Lookup = { id: string; nome: string };
export type Profissional = { id: string; nome: string; cargo: string | null };
export type Parceiro = { id: string; nome: string; cidade: string | null; pais: string | null };
export type Voluntario = { nome: string; funcao: string | null; observacao: string | null };
export type Foto = { id: string; url: string; storagePath: string; legenda: string | null; posicao: number };

export type ViagemIpm = {
  id: string;
  numero: string | null;
  ano: number | null;
  data_saida: string;
  data_chegada: string | null;
  dias_missao: number | null;
  tipo_missao: string | null;
  area: string | null;
  local: string | null;
  observacoes: string | null;
  cancelada: boolean;
  tipo_transporte: string | null;
  barco: string | null;
  coordenadores: string[];
  lideres_saude: string[];
  parceiros: string[];
  /** Comunidades visitadas (preenchido manualmente no admin). */
  comunidades: string[];
  /** Voluntários que participaram da viagem (preenchido manualmente no admin). */
  voluntarios: Voluntario[];
  /** Fotos anexadas à viagem, usadas no relatório em PDF. */
  fotos: Foto[];
  /** Todas as colunas numéricas de public.atendimentos, exceto viagem_id. */
  atendimentos: Record<string, number | null>;
  atendimentosObservacoes: string | null;
  /** IDs das FKs, usados para pré-selecionar campos no formulário de edição. */
  tipo_transporte_id: string | null;
  barco_id: string | null;
  coordenador_ids: string[];
  lider_saude_ids: string[];
  parceiro_ids: string[];
  comunidade_ids: string[];
};

type ViagemRow = {
  id: string;
  numero: string | null;
  ano: number | null;
  data_saida: string;
  data_chegada: string | null;
  dias_missao: number | null;
  tipo_missao: string | null;
  area: string | null;
  local: string | null;
  observacoes: string | null;
  cancelada: boolean;
  tipo_transporte_id: string | null;
  barco_id: string | null;
  tipos_transporte: { nome: string } | null;
  barcos: { nome: string } | null;
  viagem_coordenadores:
    | { posicao: number; profissional_id: string; profissionais: { nome: string } | null }[]
    | null;
  viagem_lideres_saude:
    | { posicao: number; profissional_id: string; profissionais: { nome: string } | null }[]
    | null;
  viagem_parceiros: { posicao: number; parceiro_id: string; parceiros: { nome: string } | null }[] | null;
  viagem_comunidades: { posicao: number; comunidade_id: string; comunidades: { nome: string } | null }[] | null;
  viagem_voluntarios:
    | { funcao: string | null; observacao: string | null; profissionais: { nome: string } | null }[]
    | null;
  atendimentos: (Record<string, number | null | string> & { viagem_id: string; observacoes: string | null }) | null;
  viagem_fotos: { id: string; storage_path: string; legenda: string | null; posicao: number }[] | null;
};

export const BUCKET_FOTOS = 'viagem-fotos';

export function urlPublicaFoto(storagePath: string): string {
  if (!supabase) return '';
  return supabase.storage.from(BUCKET_FOTOS).getPublicUrl(storagePath).data.publicUrl;
}

const SELECT_VIAGEM = `id, numero, ano, data_saida, data_chegada, dias_missao, tipo_missao, area, local, observacoes, cancelada,
       tipo_transporte_id,
       barco_id,
       tipos_transporte(nome),
       barcos(nome),
       viagem_coordenadores(posicao, profissional_id, profissionais(nome)),
       viagem_lideres_saude(posicao, profissional_id, profissionais(nome)),
       viagem_parceiros(posicao, parceiro_id, parceiros(nome)),
       viagem_comunidades(posicao, comunidade_id, comunidades(nome)),
       viagem_voluntarios(funcao, observacao, profissionais(nome)),
       atendimentos(*),
       viagem_fotos(id, storage_path, legenda, posicao)`;

function mapRow(row: ViagemRow): ViagemIpm {
  const { observacoes: atendimentosObservacoes, ...resto } = row.atendimentos ?? { observacoes: null };
  const metricas = { ...resto };
  delete metricas.viagem_id;

  const coordenadoresOrdenados = (row.viagem_coordenadores ?? []).slice().sort((a, b) => a.posicao - b.posicao);
  const lideresOrdenados = (row.viagem_lideres_saude ?? []).slice().sort((a, b) => a.posicao - b.posicao);
  const parceirosOrdenados = (row.viagem_parceiros ?? []).slice().sort((a, b) => a.posicao - b.posicao);
  const comunidadesOrdenadas = (row.viagem_comunidades ?? []).slice().sort((a, b) => a.posicao - b.posicao);
  const fotosOrdenadas = (row.viagem_fotos ?? []).slice().sort((a, b) => a.posicao - b.posicao);

  return {
    id: row.id,
    numero: row.numero,
    ano: row.ano,
    data_saida: row.data_saida,
    data_chegada: row.data_chegada,
    dias_missao: row.dias_missao,
    tipo_missao: row.tipo_missao,
    area: row.area,
    local: row.local,
    observacoes: row.observacoes,
    cancelada: row.cancelada,
    tipo_transporte: row.tipos_transporte?.nome ?? null,
    barco: row.barcos?.nome ?? null,
    coordenadores: coordenadoresOrdenados
      .map((c) => c.profissionais?.nome)
      .filter((nome): nome is string => Boolean(nome)),
    lideres_saude: lideresOrdenados.map((l) => l.profissionais?.nome).filter((nome): nome is string => Boolean(nome)),
    parceiros: parceirosOrdenados.map((p) => p.parceiros?.nome).filter((nome): nome is string => Boolean(nome)),
    comunidades: comunidadesOrdenadas.map((c) => c.comunidades?.nome).filter((nome): nome is string => Boolean(nome)),
    voluntarios: (row.viagem_voluntarios ?? [])
      .filter((v) => Boolean(v.profissionais?.nome))
      .map((v) => ({
        nome: v.profissionais!.nome,
        funcao: v.funcao,
        observacao: v.observacao,
      })),
    fotos: fotosOrdenadas.map((f) => ({
      id: f.id,
      url: urlPublicaFoto(f.storage_path),
      storagePath: f.storage_path,
      legenda: f.legenda,
      posicao: f.posicao,
    })),
    atendimentos: metricas as Record<string, number | null>,
    atendimentosObservacoes: (atendimentosObservacoes as string | null) ?? null,
    tipo_transporte_id: row.tipo_transporte_id,
    barco_id: row.barco_id,
    coordenador_ids: coordenadoresOrdenados.map((c) => c.profissional_id),
    lider_saude_ids: lideresOrdenados.map((l) => l.profissional_id),
    parceiro_ids: parceirosOrdenados.map((p) => p.parceiro_id),
    comunidade_ids: comunidadesOrdenadas.map((c) => c.comunidade_id),
  };
}

export async function listViagensIpm(): Promise<ViagemIpm[]> {
  if (!supabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('viagens')
    .select(SELECT_VIAGEM)
    .eq('origem', 'sistema_ipm')
    .order('data_saida', { ascending: false });

  if (error) {
    console.error(
      `listViagensIpm: erro ao consultar Supabase | code=${error.code} | message=${error.message} | details=${error.details} | hint=${error.hint}`,
    );
    return [];
  }
  if (!data) return [];

  return (data as unknown as ViagemRow[]).map(mapRow);
}

export async function getViagemIpmPorId(id: string): Promise<ViagemIpm | null> {
  if (!supabaseConfigured || !supabase) return null;

  const { data, error } = await supabase.from('viagens').select(SELECT_VIAGEM).eq('id', id).maybeSingle();

  if (error) {
    console.error(`getViagemIpmPorId: erro ao consultar Supabase`, error);
    return null;
  }
  if (!data) return null;

  return mapRow(data as unknown as ViagemRow);
}

async function listLookup(table: string): Promise<Lookup[]> {
  if (!supabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.from(table).select('id, nome').order('nome');
  if (error) {
    console.error(`listLookup(${table}): erro ao consultar Supabase`, error);
    return [];
  }
  if (!data) return [];
  return data as Lookup[];
}

export const listTiposTransporte = () => listLookup('tipos_transporte');
export const listBarcos = () => listLookup('barcos');
export const listParceiros = () => listLookup('parceiros');
export const listComunidades = () => listLookup('comunidades');

export async function listProfissionais(): Promise<Profissional[]> {
  if (!supabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.from('profissionais').select('id, nome, cargo').order('nome');
  if (error) {
    console.error('listProfissionais: erro ao consultar Supabase', error);
    return [];
  }
  if (!data) return [];
  return data as Profissional[];
}

/** Lista de parceiros com os campos completos (cidade/país), usada na tela de cadastros. */
export async function listParceirosCompletos(): Promise<Parceiro[]> {
  if (!supabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.from('parceiros').select('id, nome, cidade, pais').order('nome');
  if (error) {
    console.error('listParceirosCompletos: erro ao consultar Supabase', error);
    return [];
  }
  if (!data) return [];
  return data as Parceiro[];
}

/**
 * Valores já usados em `viagens.tipo_missao`/`area`/`local` (colunas de texto livre,
 * sem tabela de apoio própria). Usado para sugerir autocompletar nos formulários,
 * permitindo digitar um valor novo quando não houver correspondência.
 */
async function listValoresDistintos(coluna: 'tipo_missao' | 'area' | 'local'): Promise<string[]> {
  if (!supabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.from('viagens').select(coluna).not(coluna, 'is', null);
  if (error) {
    console.error(`listValoresDistintos(${coluna}): erro ao consultar Supabase`, error);
    return [];
  }
  if (!data) return [];
  const valores = new Set<string>();
  for (const row of data as unknown as Record<string, string | null>[]) {
    const valor = row[coluna];
    if (valor) valores.add(valor);
  }
  return Array.from(valores).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export const listTiposMissao = () => listValoresDistintos('tipo_missao');
export const listAreas = () => listValoresDistintos('area');
export const listLocais = () => listValoresDistintos('local');

/** Funções/cargos já usados em `viagem_voluntarios.funcao` (ex.: "médica", "TSB - odontologia"). */
export async function listFuncoesVoluntario(): Promise<string[]> {
  if (!supabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.from('viagem_voluntarios').select('funcao').not('funcao', 'is', null);
  if (error) {
    console.error('listFuncoesVoluntario: erro ao consultar Supabase', error);
    return [];
  }
  if (!data) return [];
  const valores = new Set<string>();
  for (const row of data as unknown as { funcao: string | null }[]) {
    if (row.funcao) valores.add(row.funcao);
  }
  return Array.from(valores).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
