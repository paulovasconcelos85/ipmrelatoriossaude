import { gruposAtendimentoComValores } from '@/lib/atendimentos-fields';
import { formatarPeriodo } from '@/lib/format';
import type { ViagemIpm, Voluntario } from '@/lib/viagens-ipm';

export const ASSINATURAS_RELATORIO: [string, string][] = [
  ['Juciane Seleguim', 'Gestora da Secretaria de Missões Regional e Transcultural'],
  ['Maria do Carmo Rocha Pessoa', 'Secretaria de Saúde IP Manaus'],
];

export const VERSICULO_TEXTO =
  '"Porque Dele, e por meio Dele, e para Ele são todas as coisas. A glória eternamente. Amém!"';
export const VERSICULO_REFERENCIA = '(Romanos 11.36)';

export function ehViagemAmazon(viagem: ViagemIpm): boolean {
  return viagem.parceiros.some((p) => p.toLowerCase().includes('amazon'));
}

export function juntarComE(itens: string[]): string {
  if (itens.length <= 1) return itens[0] ?? '';
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

/** Parágrafo de abertura do relatório, nos moldes dos relatórios em Word usados até hoje. */
export function montarParagrafoAbertura(viagem: ViagemIpm): string {
  let texto =
    'Relatório dos atendimentos da equipe de saúde da Igreja Presbiteriana de Manaus (IP Manaus) na viagem ' +
    'missionária realizada através da Secretaria de Missões Regionais e Transculturais, sob a gestão de Juciane ' +
    'Seleguim, Gestora da Secretaria';

  if (viagem.coordenadores.length > 0) {
    texto += `, e coordenação de ${juntarComE(viagem.coordenadores)}`;
  }

  const clausulas: string[] = [];
  if (viagem.parceirosComLocal.length > 0) {
    clausulas.push(`em parceria com ${juntarComE(viagem.parceirosComLocal)}`);
  }
  if (viagem.barco) {
    clausulas.push(`no barco "${viagem.barco}"`);
  } else if (viagem.tipo_transporte) {
    clausulas.push(`por ${viagem.tipo_transporte}`);
  }
  const local = [viagem.local, viagem.area].filter(Boolean).join(', ');
  if (local) {
    clausulas.push(`em ${local}`);
  }
  const periodo = formatarPeriodo(viagem.data_saida, viagem.data_chegada);
  clausulas.push(`nos dias ${periodo}${viagem.ano ? ` de ${viagem.ano}` : ''}`);

  let paragrafo = `${texto}, ${clausulas.join(', ')}.`;

  if (viagem.comunidades.length > 0) {
    paragrafo += ` Foram atendidas as comunidades de ${juntarComE(viagem.comunidades)}.`;
  }

  return paragrafo;
}

/** Parágrafo sobre a liderança da equipe de saúde (segundo parágrafo, nos moldes dos relatórios em Word). */
export function montarParagrafoLideranca(viagem: ViagemIpm): string | null {
  if (viagem.lideres_saude.length === 0) return null;
  return `A liderança da equipe de saúde ficou a cargo de ${juntarComE(viagem.lideres_saude)}, da Igreja Presbiteriana de Manaus.`;
}

/** Pares label/valor com os dados gerais da viagem (Anexo I e texto do WhatsApp). */
export function montarDadosViagem(viagem: ViagemIpm): [string, string][] {
  const dados: [string, string][] = [];
  if (viagem.area) dados.push(['Área', viagem.area]);
  if (viagem.local) dados.push(['Local', viagem.local]);
  if (viagem.comunidades.length > 0) dados.push(['Comunidades atendidas', juntarComE(viagem.comunidades)]);
  if (viagem.dias_missao != null) dados.push(['Dias em missão', String(viagem.dias_missao)]);
  if (viagem.barco) dados.push(['Barco', viagem.barco]);
  if (viagem.tipo_transporte) dados.push(['Transporte', viagem.tipo_transporte]);
  if (viagem.coordenadores.length > 0) dados.push(['Coordenador(es)', juntarComE(viagem.coordenadores)]);
  if (viagem.lideres_saude.length > 0) dados.push(['Líder(es) de saúde', juntarComE(viagem.lideres_saude)]);
  if (viagem.lideres_equipe_parceira.length > 0) {
    dados.push(['Líder(es) da equipe parceira', juntarComE(viagem.lideres_equipe_parceira)]);
  }
  if (viagem.parceirosComLocal.length > 0) dados.push(['Parceiros', juntarComE(viagem.parceirosComLocal)]);
  return dados;
}

/** Uma linha de voluntário para a lista do Anexo I, ex.: "Fulano (médica) — observação". */
export function montarLinhaVoluntario(v: Voluntario): string {
  return [v.nome, v.funcao ? `(${v.funcao})` : null, v.observacao ? `— ${v.observacao}` : null].filter(Boolean).join(' ');
}

/** Parágrafo com o total de atendimentos e as demais atividades realizadas (evangelismo, doações etc.). */
export function montarParagrafoAtividades(viagem: ViagemIpm): string | null {
  const grupos = gruposAtendimentoComValores(viagem);
  if (grupos.length === 0) return null;

  const GRUPOS_SAUDE = ['Atendimento médico', 'Atendimento odontológico', 'Atendimento de enfermagem'];

  const totalAtendimentos = grupos
    .flatMap((g) => g.campos)
    .filter((c) => c.destaque)
    .reduce((soma, c) => soma + (typeof c.valor === 'number' ? c.valor : 0), 0);

  const outrasAtividades = grupos
    .filter((g) => !GRUPOS_SAUDE.includes(g.titulo))
    .flatMap((g) => g.campos)
    .map((c) => c.label.toLowerCase());

  const partes: string[] = [];
  if (totalAtendimentos > 0) {
    partes.push(`sendo realizados ${totalAtendimentos} atendimentos de saúde`);
  }
  if (outrasAtividades.length > 0) {
    partes.push(`outras atividades foram realizadas pelos demais voluntários presentes: ${outrasAtividades.join(', ')}`);
  }
  if (partes.length === 0) return null;

  const texto = `O objetivo desta viagem foi realizar atendimentos de saúde à população local, ${partes.join(', e ')}.`;
  return texto;
}

/** Parágrafo final de remissão aos anexos (estatística e fotos), como nos relatórios em Word. */
export const PARAGRAFO_ANEXOS = 'Todas as atividades estão registradas no Anexo I. No Anexo II, constam fotos da viagem.';

/** Monta os parágrafos do corpo do relatório (abertura, liderança, equipe, atividades e remissão aos anexos). */
export function montarParagrafosRelatorio(viagem: ViagemIpm): string[] {
  return [
    montarParagrafoAbertura(viagem),
    montarParagrafoLideranca(viagem),
    montarParagrafoAtividades(viagem),
    PARAGRAFO_ANEXOS,
  ].filter((p): p is string => Boolean(p));
}

/**
 * Texto do relatório pronto para compartilhar no WhatsApp: mesmos dados do PDF/Word (sem as
 * fotos), com negrito no formato do WhatsApp (`*assim*`) nos títulos e totais em destaque.
 */
export function montarTextoWhatsapp(viagem: ViagemIpm): string {
  const linhas: string[] = [];

  const numero = viagem.numero ? `Viagem ${viagem.numero}` : null;
  const periodo = formatarPeriodo(viagem.data_saida, viagem.data_chegada);
  const subtitulo = [numero, `${periodo}${viagem.ano ? ` de ${viagem.ano}` : ''}`].filter(Boolean).join(' · ');

  linhas.push('*Relatório de Viagem Missionária*');
  linhas.push(subtitulo);
  linhas.push('');
  linhas.push(montarParagrafoAbertura(viagem));

  const dados = montarDadosViagem(viagem);
  if (dados.length > 0) {
    linhas.push('');
    linhas.push('*Dados da viagem*');
    for (const [label, valor] of dados) {
      linhas.push(`*${label}:* ${valor}`);
    }
  }

  if (viagem.observacoes) {
    linhas.push('');
    linhas.push('*Observações*');
    linhas.push(viagem.observacoes);
  }

  linhas.push('');
  linhas.push('*Voluntários*');
  if (viagem.voluntarios.length > 0) {
    for (const v of viagem.voluntarios) {
      linhas.push(montarLinhaVoluntario(v));
    }
  } else {
    linhas.push('Ainda não registrados');
  }

  const grupos = gruposAtendimentoComValores(viagem);
  linhas.push('');
  linhas.push('*Atendimentos*');
  if (grupos.length > 0) {
    for (const grupo of grupos) {
      const destaque = grupo.campos.find((c) => c.destaque);
      const outrosCampos = grupo.campos.filter((c) => !c.destaque);
      linhas.push('');
      linhas.push(destaque ? `*${grupo.titulo}: ${destaque.valor}*` : `*${grupo.titulo}*`);
      for (const campo of outrosCampos) {
        linhas.push(`${campo.label}: ${campo.valor}`);
      }
    }
  } else {
    linhas.push('Sem atendimentos registrados nesta viagem.');
  }

  if (viagem.atendimentosObservacoes) {
    linhas.push('');
    linhas.push('*Observações dos atendimentos*');
    linhas.push(viagem.atendimentosObservacoes);
  }

  return linhas.join('\n');
}
