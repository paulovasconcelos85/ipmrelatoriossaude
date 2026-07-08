import { supabase, supabaseConfigured } from './supabase/client';

export type Lookup = { id: string; nome: string };
export type Profissional = { id: string; nome: string; cargo: string | null };
export type Voluntario = { nome: string; funcao: string | null; observacao: string | null };

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
  coordenador: string | null;
  lider_saude: string | null;
  parceiros: string[];
  /** Comunidades visitadas (preenchido manualmente no admin). */
  comunidades: string[];
  /** Voluntários que participaram da viagem (preenchido manualmente no admin). */
  voluntarios: Voluntario[];
  /** Todas as colunas numéricas de public.atendimentos, exceto viagem_id. */
  atendimentos: Record<string, number | null>;
  atendimentosObservacoes: string | null;
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
  tipos_transporte: { nome: string } | null;
  barcos: { nome: string } | null;
  coordenador: { nome: string } | null;
  lider: { nome: string } | null;
  viagem_parceiros: { posicao: number; parceiros: { nome: string } | null }[] | null;
  viagem_comunidades: { comunidades: { nome: string } | null }[] | null;
  viagem_voluntarios:
    | { funcao: string | null; observacao: string | null; profissionais: { nome: string } | null }[]
    | null;
  atendimentos: (Record<string, number | null | string> & { viagem_id: string; observacoes: string | null }) | null;
};

export async function listViagensIpm(): Promise<ViagemIpm[]> {
  if (!supabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('viagens')
    .select(
      `id, numero, ano, data_saida, data_chegada, dias_missao, tipo_missao, area, local, observacoes, cancelada,
       tipos_transporte(nome),
       barcos(nome),
       coordenador:profissionais!coordenador_id(nome),
       lider:profissionais!lider_saude_id(nome),
       viagem_parceiros(posicao, parceiros(nome)),
       viagem_comunidades(comunidades(nome)),
       viagem_voluntarios(funcao, observacao, profissionais(nome)),
       atendimentos(*)`,
    )
    .eq('origem', 'sistema_ipm')
    .order('data_saida', { ascending: false });

  if (error) {
    console.error(
      `listViagensIpm: erro ao consultar Supabase | code=${error.code} | message=${error.message} | details=${error.details} | hint=${error.hint}`,
    );
    return [];
  }
  if (!data) return [];

  return (data as unknown as ViagemRow[]).map((row) => {
    const { observacoes: atendimentosObservacoes, ...resto } = row.atendimentos ?? { observacoes: null };
    const metricas = { ...resto };
    delete metricas.viagem_id;

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
      coordenador: row.coordenador?.nome ?? null,
      lider_saude: row.lider?.nome ?? null,
      parceiros: (row.viagem_parceiros ?? [])
        .sort((a, b) => a.posicao - b.posicao)
        .map((p) => p.parceiros?.nome)
        .filter((nome): nome is string => Boolean(nome)),
      comunidades: (row.viagem_comunidades ?? [])
        .map((c) => c.comunidades?.nome)
        .filter((nome): nome is string => Boolean(nome)),
      voluntarios: (row.viagem_voluntarios ?? [])
        .filter((v) => Boolean(v.profissionais?.nome))
        .map((v) => ({
          nome: v.profissionais!.nome,
          funcao: v.funcao,
          observacao: v.observacao,
        })),
      atendimentos: metricas as Record<string, number | null>,
      atendimentosObservacoes: (atendimentosObservacoes as string | null) ?? null,
    };
  });
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
