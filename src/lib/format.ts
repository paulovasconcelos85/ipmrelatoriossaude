const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

function parseData(data: string): Date {
  const [ano, mes, dia] = data.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

export type StatusViagem = 'realizada' | 'em_andamento' | 'agendada';

export function calcularStatus(
  dataSaida: string,
  dataRetorno: string | null,
  hoje: Date = new Date(),
): StatusViagem {
  const saida = inicioDoDia(parseData(dataSaida));
  const retorno = dataRetorno ? inicioDoDia(parseData(dataRetorno)) : saida;
  const agora = inicioDoDia(hoje);

  if (agora < saida) return 'agendada';
  if (agora > retorno) return 'realizada';
  return 'em_andamento';
}

export function nomeMes(data: string): string {
  const d = parseData(data);
  return `${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function chaveMes(data: string): string {
  const d = parseData(data);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function diaSemanaCurto(data: string): string {
  const d = parseData(data);
  return DIAS_SEMANA[d.getDay()];
}

export function formatarPeriodo(dataSaida: string, dataRetorno: string | null): string {
  const saida = parseData(dataSaida);
  if (!dataRetorno) {
    return `${saida.getDate()} de ${MESES[saida.getMonth()]}`;
  }
  const retorno = parseData(dataRetorno);

  const mesmoDia =
    saida.getFullYear() === retorno.getFullYear() &&
    saida.getMonth() === retorno.getMonth() &&
    saida.getDate() === retorno.getDate();

  if (mesmoDia) {
    return `${saida.getDate()} de ${MESES[saida.getMonth()]}`;
  }

  const mesmoMes = saida.getFullYear() === retorno.getFullYear() && saida.getMonth() === retorno.getMonth();
  if (mesmoMes) {
    return `${saida.getDate()} a ${retorno.getDate()} de ${MESES[saida.getMonth()]}`;
  }

  const mesmoAno = saida.getFullYear() === retorno.getFullYear();
  if (mesmoAno) {
    return `${saida.getDate()} de ${MESES[saida.getMonth()]} a ${retorno.getDate()} de ${MESES[retorno.getMonth()]}`;
  }

  return `${saida.getDate()} de ${MESES[saida.getMonth()]} de ${saida.getFullYear()} a ${retorno.getDate()} de ${MESES[retorno.getMonth()]} de ${retorno.getFullYear()}`;
}
