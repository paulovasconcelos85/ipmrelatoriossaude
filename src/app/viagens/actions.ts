'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabase, supabaseConfigured } from '@/lib/supabase/client';
import { ATENDIMENTOS_CAMPOS, ATENDIMENTOS_GRUPOS } from '@/lib/atendimentos-fields';
import {
  textoOuNulo,
  inteiroOuNulo,
  obterOuCriarPorNome,
  resolverGruposNomesParaIds,
  resolverItensEstatisticos,
  calcularDiasMissao,
  proximoNumeroViagem,
  resolverVoluntarios,
} from '@/lib/form-helpers';

export type EstadoNovaViagem = { erro?: string } | undefined;

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
    const diasMissao = calcularDiasMissao(dataSaida, dataChegada);
    const tipoMissao = textoOuNulo(formData.get('tipo_missao'));
    const area = textoOuNulo(formData.get('area'));
    const local = textoOuNulo(formData.get('local'));
    const observacoes = textoOuNulo(formData.get('observacoes'));
    const ano = parseInt(dataSaida.slice(0, 4), 10);

    const tipoTransporte = textoOuNulo(formData.get('tipo_transporte'));
    const tipoTransporteId = tipoTransporte ? await obterOuCriarPorNome('tipos_transporte', tipoTransporte) : null;

    const barco = textoOuNulo(formData.get('barco'));
    const barcoId = barco ? await obterOuCriarPorNome('barcos', barco) : null;

    // Coordenador/líder é um papel da pessoa nesta viagem, não a profissão dela — por isso
    // não atribuímos nenhum cargo automático ao criar o profissional por aqui. O cargo real
    // (dentista, secretária de missões...) é preenchido depois na tela de Cadastros.
    const nomesCoordenadores = formData
      .getAll('coordenadores')
      .filter((v): v is string => typeof v === 'string')
      .map((v) => v.trim())
      .filter(Boolean);

    const nomesLideres = formData
      .getAll('lideres_saude')
      .filter((v): v is string => typeof v === 'string')
      .map((v) => v.trim())
      .filter(Boolean);

    const nomesLideresEquipeParceira = formData
      .getAll('lideres_equipe_parceira')
      .filter((v): v is string => typeof v === 'string')
      .map((v) => v.trim())
      .filter(Boolean);

    const [coordenadorIds, liderIds, liderEquipeParceiraIds] = await resolverGruposNomesParaIds('profissionais', [
      nomesCoordenadores,
      nomesLideres,
      nomesLideresEquipeParceira,
    ]);

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
    const numero = await proximoNumeroViagem(ano);

    const { data: viagemCriada, error: erroViagem } = await supabase
      .from('viagens')
      .insert({
        origem: 'sistema_ipm',
        numero,
        ano,
        data_saida: dataSaida,
        data_chegada: dataChegada,
        dias_missao: diasMissao,
        tipo_missao: tipoMissao,
        tipo_transporte_id: tipoTransporteId,
        barco_id: barcoId,
        area,
        local,
        cancelada: false,
        observacoes,
      })
      .select('id')
      .single();

    if (erroViagem || !viagemCriada) {
      return { erro: `Não foi possível salvar a viagem: ${erroViagem?.message ?? 'erro desconhecido'}` };
    }

    const viagemId = viagemCriada.id as string;

    if (coordenadorIds.length > 0) {
      const linhas = coordenadorIds.map((profissionalId, i) => ({
        viagem_id: viagemId,
        profissional_id: profissionalId,
        posicao: i + 1,
      }));
      const { error: erroCoordenadores } = await supabase.from('viagem_coordenadores').insert(linhas);
      if (erroCoordenadores) {
        return { erro: `Viagem salva, mas houve erro ao vincular coordenadores: ${erroCoordenadores.message}` };
      }
    }

    if (liderIds.length > 0) {
      const linhas = liderIds.map((profissionalId, i) => ({
        viagem_id: viagemId,
        profissional_id: profissionalId,
        posicao: i + 1,
      }));
      const { error: erroLideres } = await supabase.from('viagem_lideres_saude').insert(linhas);
      if (erroLideres) {
        return { erro: `Viagem salva, mas houve erro ao vincular líderes de saúde: ${erroLideres.message}` };
      }
    }

    if (liderEquipeParceiraIds.length > 0) {
      const linhas = liderEquipeParceiraIds.map((profissionalId, i) => ({
        viagem_id: viagemId,
        profissional_id: profissionalId,
        posicao: i + 1,
      }));
      const { error: erroLideresEquipeParceira } = await supabase.from('viagem_lideres_equipe_parceira').insert(linhas);
      if (erroLideresEquipeParceira) {
        return {
          erro: `Viagem salva, mas houve erro ao vincular líderes da equipe parceira: ${erroLideresEquipeParceira.message}`,
        };
      }
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

    const { error: erroAtendimentos } = await supabase.from('atendimentos').insert({
      viagem_id: viagemId,
      ...metricas,
    });
    if (erroAtendimentos) {
      return { erro: `Viagem salva, mas houve erro ao salvar os atendimentos: ${erroAtendimentos.message}` };
    }

    const itensExtras: { campo_estatistico_id: string; quantidade: number }[] = [];
    for (const grupo of ATENDIMENTOS_GRUPOS) {
      const dinamicos = [grupo.dinamico, grupo.dinamicoExtra].filter((d): d is NonNullable<typeof d> => Boolean(d));
      for (const dinamico of dinamicos) {
        const itens = await resolverItensEstatisticos(formData, dinamico.chave, dinamico.campoNome, dinamico.campoQtd);
        itensExtras.push(...itens);
      }
    }
    if (itensExtras.length > 0) {
      const linhas = itensExtras.map((item) => ({ viagem_id: viagemId, ...item }));
      const { error: erroExtras } = await supabase.from('atendimentos_extra').insert(linhas);
      if (erroExtras) {
        return { erro: `Viagem salva, mas houve erro ao salvar os itens extras: ${erroExtras.message}` };
      }
    }
  } catch (err) {
    return { erro: err instanceof Error ? err.message : 'Erro inesperado ao salvar a viagem.' };
  }

  revalidatePath('/viagens');
  revalidatePath('/');
  redirect('/');
}
