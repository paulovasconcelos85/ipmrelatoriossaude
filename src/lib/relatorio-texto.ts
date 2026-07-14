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
  if (viagem.parceiros.length > 0) {
    clausulas.push(`em parceria com ${juntarComE(viagem.parceiros)}`);
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
