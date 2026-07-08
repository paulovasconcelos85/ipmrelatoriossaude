'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabase, supabaseConfigured } from '@/lib/supabase/client';
import { ATENDIMENTOS_CAMPOS } from '@/lib/atendimentos-fields';

export type EstadoNovaViagem = { erro?: string } | undefined;

function textoOuNulo(valor: FormDataEntryValue | null): string | null {
  const texto = typeof valor === 'string' ? valor.trim() : '';
  return texto === '' ? null : texto;
}

function inteiroOuNulo(valor: FormDataEntryValue | null): number | null {
  const texto = typeof valor === 'string' ? valor.trim() : '';
  if (texto === '') return null;
  const numero = parseInt(texto, 10);
  return Number.isNaN(numero) ? null : numero;
}

async function obterOuCriarPorNome(
  tabela: 'barcos' | 'profissionais' | 'parceiros',
  nome: string,
  extra?: Record<string, unknown>,
): Promise<string | null> {
  if (!supabase) return null;
  const nomeLimpo = nome.trim();
  if (!nomeLimpo) return null;

  const { data: existente } = await supabase
    .from(tabela)
    .select('id')
    .eq('nome', nomeLimpo)
    .maybeSingle();
  if (existente) return existente.id as string;

  const { data: criado, error } = await supabase
    .from(tabela)
    .insert({ nome: nomeLimpo, ...extra })
    .select('id')
    .single();
  if (error) throw error;
  return criado.id as string;
}

export async function criarViagemIpm(
  _estadoAnterior: EstadoNovaViagem,
  formData: FormData,
): Promise<EstadoNovaViagem> {
  if (!supabaseConfigured || !supabase) {
    return { erro: 'Supabase não está configurado neste ambiente.' };
  }

  const dataSaida = textoOuNulo(formData.get('data_saida'));
  if (!dataSaida) {
    return { erro: 'Informe a data de saída.' };
  }

  try {
    const dataChegada = textoOuNulo(formData.get('data_chegada'));
    const diasMissao = inteiroOuNulo(formData.get('dias_missao'));
    const tipoMissao = textoOuNulo(formData.get('tipo_missao'));
    const area = textoOuNulo(formData.get('area'));
    const local = textoOuNulo(formData.get('local'));
    const observacoes = textoOuNulo(formData.get('observacoes'));
    const ano = parseInt(dataSaida.slice(0, 4), 10);

    const tipoTransporteId = textoOuNulo(formData.get('tipo_transporte_id'));

    const novoBarco = textoOuNulo(formData.get('novo_barco'));
    const barcoId = novoBarco
      ? await obterOuCriarPorNome('barcos', novoBarco)
      : textoOuNulo(formData.get('barco_id'));

    const novoCoordenador = textoOuNulo(formData.get('novo_coordenador'));
    const coordenadorId = novoCoordenador
      ? await obterOuCriarPorNome('profissionais', novoCoordenador, { cargo: 'Coordenador' })
      : textoOuNulo(formData.get('coordenador_id'));

    const novoLider = textoOuNulo(formData.get('novo_lider'));
    const liderId = novoLider
      ? await obterOuCriarPorNome('profissionais', novoLider, { cargo: 'Líder da Equipe de Saúde' })
      : textoOuNulo(formData.get('lider_saude_id'));

    const parceirosExistentesIds = formData.getAll('parceiros').filter((v): v is string => typeof v === 'string' && v !== '');
    const novosParceirosTexto = textoOuNulo(formData.get('novos_parceiros'));
    const novosParceirosNomes = novosParceirosTexto
      ? novosParceirosTexto.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const novosParceirosIds: string[] = [];
    for (const nome of novosParceirosNomes) {
      const id = await obterOuCriarPorNome('parceiros', nome);
      if (id) novosParceirosIds.push(id);
    }

    const todosParceirosIds = [...parceirosExistentesIds, ...novosParceirosIds];

    const { data: viagemCriada, error: erroViagem } = await supabase
      .from('viagens')
      .insert({
        origem: 'sistema_ipm',
        numero: null,
        ano,
        data_saida: dataSaida,
        data_chegada: dataChegada,
        dias_missao: diasMissao,
        tipo_missao: tipoMissao,
        tipo_transporte_id: tipoTransporteId,
        barco_id: barcoId,
        area,
        local,
        coordenador_id: coordenadorId,
        lider_saude_id: liderId,
        cancelada: false,
        observacoes,
      })
      .select('id')
      .single();

    if (erroViagem || !viagemCriada) {
      return { erro: `Não foi possível salvar a viagem: ${erroViagem?.message ?? 'erro desconhecido'}` };
    }

    const viagemId = viagemCriada.id as string;

    if (todosParceirosIds.length > 0) {
      const linhas = todosParceirosIds.map((parceiroId, i) => ({
        viagem_id: viagemId,
        parceiro_id: parceiroId,
        posicao: i + 1,
      }));
      const { error: erroParceiros } = await supabase.from('viagem_parceiros').insert(linhas);
      if (erroParceiros) {
        return { erro: `Viagem salva, mas houve erro ao vincular parceiros: ${erroParceiros.message}` };
      }
    }

    const metricas: Record<string, number | null> = {};
    for (const campo of ATENDIMENTOS_CAMPOS) {
      metricas[campo.name] = inteiroOuNulo(formData.get(campo.name));
    }

    const { error: erroAtendimentos } = await supabase.from('atendimentos').insert({
      viagem_id: viagemId,
      ...metricas,
    });
    if (erroAtendimentos) {
      return { erro: `Viagem salva, mas houve erro ao salvar os atendimentos: ${erroAtendimentos.message}` };
    }
  } catch (err) {
    return { erro: err instanceof Error ? err.message : 'Erro inesperado ao salvar a viagem.' };
  }

  revalidatePath('/viagens');
  redirect('/viagens');
}
