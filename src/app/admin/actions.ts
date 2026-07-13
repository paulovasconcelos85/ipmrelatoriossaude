'use server';

import { revalidatePath } from 'next/cache';
import { supabase, supabaseConfigured } from '@/lib/supabase/client';
import { ATENDIMENTOS_CAMPOS } from '@/lib/atendimentos-fields';
import {
  textoOuNulo,
  inteiroOuNulo,
  obterOuCriarPorNome,
  resolverNomesParaIds,
  calcularDiasMissao,
  resolverVoluntarios,
} from '@/lib/form-helpers';

export type EstadoEditarViagem = { erro?: string; sucesso?: boolean; salvoEm?: number } | undefined;

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
    const barco = textoOuNulo(formData.get('barco'));
    // Coordenador/líder é um papel da pessoa nesta viagem, não a profissão dela — por isso
    // não atribuímos nenhum cargo automático ao criar o profissional por aqui. O cargo real
    // (dentista, secretária de missões...) é preenchido depois na tela de Cadastros.
    const coordenador = textoOuNulo(formData.get('coordenador'));
    const lider = textoOuNulo(formData.get('lider'));

    const nomesParceiros = formData
      .getAll('parceiros')
      .filter((v): v is string => typeof v === 'string')
      .map((v) => v.trim())
      .filter(Boolean);

    const nomesComunidades = formData
      .getAll('comunidades')
      .filter((v): v is string => typeof v === 'string')
      .map((v) => v.trim())
      .filter(Boolean);

    // Consultas independentes — resolvidas em paralelo para não somar uma volta de rede a cada uma.
    async function resolverCoordenadorELider(): Promise<[string | null, string | null]> {
      // Coordenador e líder podem ser a mesma pessoa; resolve nomes únicos primeiro para não
      // disparar duas buscas/criações concorrentes do mesmo profissional (o que geraria duplicata).
      const idsPorNome = new Map<string, string | null>();
      await Promise.all(
        Array.from(new Set([coordenador, lider].filter((v): v is string => !!v))).map(async (nome) => {
          idsPorNome.set(nome, await obterOuCriarPorNome('profissionais', nome));
        }),
      );
      return [coordenador ? (idsPorNome.get(coordenador) ?? null) : null, lider ? (idsPorNome.get(lider) ?? null) : null];
    }

    const [tipoTransporteId, barcoId, [coordenadorId, liderId], todosParceirosIds, todasComunidadesIds, voluntarios] =
      await Promise.all([
        tipoTransporte ? obterOuCriarPorNome('tipos_transporte', tipoTransporte) : Promise.resolve(null),
        barco ? obterOuCriarPorNome('barcos', barco) : Promise.resolve(null),
        resolverCoordenadorELider(),
        resolverNomesParaIds('parceiros', nomesParceiros),
        resolverNomesParaIds('comunidades', nomesComunidades),
        resolverVoluntarios(formData),
      ]);

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

    // As quatro sincronizações abaixo tocam tabelas diferentes e não dependem umas das outras —
    // rodam em paralelo para não somar uma volta de rede a cada uma.
    async function sincronizarViagemParceiros(): Promise<string | null> {
      const { error: erroRemover } = await supabase!.from('viagem_parceiros').delete().eq('viagem_id', viagemId);
      if (erroRemover) return `Viagem salva, mas houve erro ao atualizar parceiros: ${erroRemover.message}`;
      if (todosParceirosIds.length === 0) return null;
      const linhas = todosParceirosIds.map((parceiroId, i) => ({ viagem_id: viagemId, parceiro_id: parceiroId, posicao: i + 1 }));
      const { error } = await supabase!.from('viagem_parceiros').insert(linhas);
      return error ? `Viagem salva, mas houve erro ao vincular parceiros: ${error.message}` : null;
    }

    async function sincronizarViagemComunidades(): Promise<string | null> {
      const { error: erroRemover } = await supabase!.from('viagem_comunidades').delete().eq('viagem_id', viagemId);
      if (erroRemover) return `Viagem salva, mas houve erro ao atualizar comunidades: ${erroRemover.message}`;
      if (todasComunidadesIds.length === 0) return null;
      const linhas = todasComunidadesIds.map((comunidadeId, i) => ({ viagem_id: viagemId, comunidade_id: comunidadeId, posicao: i + 1 }));
      const { error } = await supabase!.from('viagem_comunidades').insert(linhas);
      return error ? `Viagem salva, mas houve erro ao vincular comunidades: ${error.message}` : null;
    }

    async function sincronizarViagemVoluntarios(): Promise<string | null> {
      const { error: erroRemover } = await supabase!.from('viagem_voluntarios').delete().eq('viagem_id', viagemId);
      if (erroRemover) return `Viagem salva, mas houve erro ao atualizar a equipe: ${erroRemover.message}`;
      if (voluntarios.length === 0) return null;
      const linhas = voluntarios.map((v) => ({ viagem_id: viagemId, ...v }));
      const { error } = await supabase!.from('viagem_voluntarios').insert(linhas);
      return error ? `Viagem salva, mas houve erro ao vincular a equipe: ${error.message}` : null;
    }

    async function sincronizarAtendimentos(): Promise<string | null> {
      const metricas: Record<string, number | null> = {};
      for (const campo of ATENDIMENTOS_CAMPOS) {
        metricas[campo.name] = inteiroOuNulo(formData.get(campo.name));
      }
      const { error } = await supabase!.from('atendimentos').upsert({ viagem_id: viagemId, ...metricas });
      return error ? `Viagem salva, mas houve erro ao salvar os atendimentos: ${error.message}` : null;
    }

    const erros = await Promise.all([
      sincronizarViagemParceiros(),
      sincronizarViagemComunidades(),
      sincronizarViagemVoluntarios(),
      sincronizarAtendimentos(),
    ]);
    const primeiroErro = erros.find((e): e is string => e !== null);
    if (primeiroErro) {
      return { erro: primeiroErro };
    }
  } catch (err) {
    return { erro: err instanceof Error ? err.message : 'Erro inesperado ao salvar a viagem.' };
  }

  revalidatePath('/admin');
  revalidatePath(`/admin/${viagemId}`);
  revalidatePath('/viagens');
  return { sucesso: true, salvoEm: Date.now() };
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
