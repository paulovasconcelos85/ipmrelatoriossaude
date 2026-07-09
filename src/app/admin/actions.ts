'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabase, supabaseConfigured } from '@/lib/supabase/client';
import { ATENDIMENTOS_CAMPOS } from '@/lib/atendimentos-fields';
import {
  textoOuNulo,
  inteiroOuNulo,
  obterOuCriarPorNome,
  calcularDiasMissao,
  resolverVoluntarios,
} from '@/lib/form-helpers';

export type EstadoEditarViagem = { erro?: string } | undefined;

export async function atualizarViagemIpm(
  _estadoAnterior: EstadoEditarViagem,
  formData: FormData,
): Promise<EstadoEditarViagem> {
  if (!supabaseConfigured || !supabase) {
    return { erro: 'Supabase não está configurado neste ambiente.' };
  }

  const viagemId = textoOuNulo(formData.get('viagem_id'));
  if (!viagemId) {
    return { erro: 'Viagem inválida.' };
  }

  const dataSaida = textoOuNulo(formData.get('data_saida'));
  if (!dataSaida) {
    return { erro: 'Informe a data de saída.' };
  }

  try {
    const dataChegada = textoOuNulo(formData.get('data_chegada'));
    const diasMissao = calcularDiasMissao(dataSaida, dataChegada);
    const tipoMissao = textoOuNulo(formData.get('tipo_missao'));
    const area = textoOuNulo(formData.get('area'));
    const local = textoOuNulo(formData.get('local'));
    const observacoes = textoOuNulo(formData.get('observacoes'));
    const cancelada = formData.get('cancelada') === 'on';
    const ano = parseInt(dataSaida.slice(0, 4), 10);

    const tipoTransporte = textoOuNulo(formData.get('tipo_transporte'));
    const tipoTransporteId = tipoTransporte ? await obterOuCriarPorNome('tipos_transporte', tipoTransporte) : null;

    const barco = textoOuNulo(formData.get('barco'));
    const barcoId = barco ? await obterOuCriarPorNome('barcos', barco) : null;

    // Coordenador/líder é um papel da pessoa nesta viagem, não a profissão dela — por isso
    // não atribuímos nenhum cargo automático ao criar o profissional por aqui. O cargo real
    // (dentista, secretária de missões...) é preenchido depois na tela de Cadastros.
    const coordenador = textoOuNulo(formData.get('coordenador'));
    const coordenadorId = coordenador ? await obterOuCriarPorNome('profissionais', coordenador) : null;

    const lider = textoOuNulo(formData.get('lider'));
    const liderId = lider ? await obterOuCriarPorNome('profissionais', lider) : null;

    const nomesParceiros = formData
      .getAll('parceiros')
      .filter((v): v is string => typeof v === 'string')
      .map((v) => v.trim())
      .filter(Boolean);

    const todosParceirosIds: string[] = [];
    for (const nome of nomesParceiros) {
      const id = await obterOuCriarPorNome('parceiros', nome);
      if (id) todosParceirosIds.push(id);
    }

    const nomesComunidades = formData
      .getAll('comunidades')
      .filter((v): v is string => typeof v === 'string')
      .map((v) => v.trim())
      .filter(Boolean);

    const todasComunidadesIds: string[] = [];
    for (const nome of nomesComunidades) {
      const id = await obterOuCriarPorNome('comunidades', nome);
      if (id) todasComunidadesIds.push(id);
    }

    const voluntarios = await resolverVoluntarios(formData);

    const { error: erroViagem } = await supabase
      .from('viagens')
      .update({
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
        cancelada,
        observacoes,
      })
      .eq('id', viagemId);

    if (erroViagem) {
      return { erro: `Não foi possível salvar a viagem: ${erroViagem.message}` };
    }

    const { error: erroRemoverParceiros } = await supabase
      .from('viagem_parceiros')
      .delete()
      .eq('viagem_id', viagemId);
    if (erroRemoverParceiros) {
      return { erro: `Viagem salva, mas houve erro ao atualizar parceiros: ${erroRemoverParceiros.message}` };
    }

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

    const { error: erroRemoverComunidades } = await supabase
      .from('viagem_comunidades')
      .delete()
      .eq('viagem_id', viagemId);
    if (erroRemoverComunidades) {
      return { erro: `Viagem salva, mas houve erro ao atualizar comunidades: ${erroRemoverComunidades.message}` };
    }

    if (todasComunidadesIds.length > 0) {
      const linhas = todasComunidadesIds.map((comunidadeId, i) => ({
        viagem_id: viagemId,
        comunidade_id: comunidadeId,
        posicao: i + 1,
      }));
      const { error: erroComunidades } = await supabase.from('viagem_comunidades').insert(linhas);
      if (erroComunidades) {
        return { erro: `Viagem salva, mas houve erro ao vincular comunidades: ${erroComunidades.message}` };
      }
    }

    const { error: erroRemoverVoluntarios } = await supabase
      .from('viagem_voluntarios')
      .delete()
      .eq('viagem_id', viagemId);
    if (erroRemoverVoluntarios) {
      return { erro: `Viagem salva, mas houve erro ao atualizar a equipe: ${erroRemoverVoluntarios.message}` };
    }

    if (voluntarios.length > 0) {
      const linhas = voluntarios.map((v) => ({ viagem_id: viagemId, ...v }));
      const { error: erroVoluntarios } = await supabase.from('viagem_voluntarios').insert(linhas);
      if (erroVoluntarios) {
        return { erro: `Viagem salva, mas houve erro ao vincular a equipe: ${erroVoluntarios.message}` };
      }
    }

    const metricas: Record<string, number | null> = {};
    for (const campo of ATENDIMENTOS_CAMPOS) {
      metricas[campo.name] = inteiroOuNulo(formData.get(campo.name));
    }

    const { error: erroAtendimentos } = await supabase
      .from('atendimentos')
      .upsert({ viagem_id: viagemId, ...metricas });
    if (erroAtendimentos) {
      return { erro: `Viagem salva, mas houve erro ao salvar os atendimentos: ${erroAtendimentos.message}` };
    }
  } catch (err) {
    return { erro: err instanceof Error ? err.message : 'Erro inesperado ao salvar a viagem.' };
  }

  revalidatePath('/admin');
  revalidatePath('/viagens');
  redirect('/admin');
}

export async function excluirViagemIpm(viagemId: string): Promise<void> {
  if (!supabaseConfigured || !supabase) return;

  const { error } = await supabase.from('viagens').delete().eq('id', viagemId);
  if (error) {
    throw new Error(`Não foi possível excluir a viagem: ${error.message}`);
  }

  revalidatePath('/admin');
  revalidatePath('/viagens');
}
