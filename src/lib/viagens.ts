import { supabase, supabaseConfigured } from './supabase/client';
import { viagensFallback } from './viagens-fallback';

export type Viagem = {
  data_saida: string;
  data_retorno: string | null;
  regiao_rio: string | null;
  responsavel_grupo: string | null;
  grupo: string | null;
  grupo_complemento: string | null;
  coordenador: string | null;
  barco_local: string | null;
  observacoes: string | null;
  cancelada: boolean;
};

export async function getViagens(): Promise<{ viagens: Viagem[]; usandoDadosLocais: boolean }> {
  if (supabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('viagens')
      .select(
        'data_saida, data_retorno, regiao_rio, responsavel_grupo, grupo, grupo_complemento, coordenador, barco_local, observacoes, cancelada',
      )
      .order('data_saida', { ascending: true });

    if (!error && data) {
      return { viagens: data as Viagem[], usandoDadosLocais: false };
    }
  }

  const ordenadas = [...viagensFallback].sort((a, b) => a.data_saida.localeCompare(b.data_saida));
  return { viagens: ordenadas, usandoDadosLocais: true };
}
