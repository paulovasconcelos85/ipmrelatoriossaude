import { gruposAtendimentoComValores } from '@/lib/atendimentos-fields';
import { formatarPeriodo } from '@/lib/format';
import type { ViagemIpm } from '@/lib/viagens-ipm';

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
  if (viagem.lideres_saude.length > 0) {
    clausulas.push(`liderança de ${juntarComE(viagem.lideres_saude)}`);
  }
  if (viagem.barco) {
    clausulas.push(`no barco "${viagem.barco}"`);
  }
  const periodo = formatarPeriodo(viagem.data_saida, viagem.data_chegada);
  clausulas.push(`nos dias ${periodo}${viagem.ano ? ` de ${viagem.ano}` : ''}`);

  return `${texto}, ${clausulas.join(', ')}.`;
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

  const dados: [string, string][] = [];
  if (viagem.area) dados.push(['Área', viagem.area]);
  if (viagem.local) dados.push(['Local', viagem.local]);
  if (viagem.comunidades.length > 0) dados.push(['Comunidades visitadas', viagem.comunidades.join(', ')]);
  if (viagem.dias_missao != null) dados.push(['Dias em missão', String(viagem.dias_missao)]);
  if (viagem.tipo_transporte) dados.push(['Transporte', viagem.tipo_transporte]);
  if (viagem.coordenadores.length > 0) dados.push(['Coordenador(es)', viagem.coordenadores.join(', ')]);
  if (viagem.lideres_saude.length > 0) dados.push(['Líder(es) de saúde', viagem.lideres_saude.join(', ')]);
  if (viagem.parceirosComLocal.length > 0) dados.push(['Parceiros', viagem.parceirosComLocal.join(', ')]);

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
      const complemento = [v.funcao ? `(${v.funcao})` : null, v.observacao ? `— ${v.observacao}` : null]
        .filter(Boolean)
        .join(' ');
      linhas.push(complemento ? `${v.nome} ${complemento}` : v.nome);
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
