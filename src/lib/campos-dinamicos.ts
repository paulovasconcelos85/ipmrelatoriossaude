/**
 * Atualiza uma lista de campos dinâmicos (parceiros, comunidades...): descarta os
 * campos vazios e garante sempre um campo vazio no final para digitar o próximo.
 */
export function atualizarListaDinamica(atual: string[], index: number, valor: string): string[] {
  const atualizado = atual.map((v, i) => (i === index ? valor : v));
  const preenchidos = atualizado.filter((v) => v.trim() !== '');
  return [...preenchidos, ''];
}

export type LinhaEstatistica = { nome: string; quantidade: string };

const LINHA_ESTATISTICA_VAZIA: LinhaEstatistica = { nome: '', quantidade: '' };

/**
 * Mesma lógica de `atualizarListaDinamica`, mas para linhas de estatística livre (nome do item +
 * quantidade), usadas nos grupos "Atividades e procedimentos de saúde" e "Assistência social e doações".
 */
export function atualizarListaEstatisticas(
  atual: LinhaEstatistica[],
  index: number,
  campo: keyof LinhaEstatistica,
  valor: string,
): LinhaEstatistica[] {
  const atualizado = atual.map((linha, i) => (i === index ? { ...linha, [campo]: valor } : linha));
  const preenchidos = atualizado.filter((l) => l.nome.trim() !== '' || l.quantidade.trim() !== '');
  return [...preenchidos, { ...LINHA_ESTATISTICA_VAZIA }];
}

/**
 * Um "grupo" de voluntários que compartilham o mesmo cargo/função e a mesma observação
 * (ex.: várias médicas de uma vez) — em vez de repetir o cargo para cada pessoa, digita-se
 * o cargo uma vez e vários nomes na sequência.
 */
export type LinhaGrupoVoluntario = { funcao: string; nomes: string[]; observacao: string };

export function criarGrupoVoluntarioVazio(): LinhaGrupoVoluntario {
  return { funcao: '', nomes: [''], observacao: '' };
}

function grupoVoluntarioEstaVazio(g: LinhaGrupoVoluntario): boolean {
  return g.funcao.trim() === '' && g.observacao.trim() === '' && g.nomes.every((n) => n.trim() === '');
}

function normalizarGruposVoluntarios(grupos: LinhaGrupoVoluntario[]): LinhaGrupoVoluntario[] {
  const preenchidos = grupos.filter((g) => !grupoVoluntarioEstaVazio(g));
  return [...preenchidos, criarGrupoVoluntarioVazio()];
}

/** Atualiza o cargo/função ou a observação do grupo (compartilhados por todos os nomes dele). */
export function atualizarCampoGrupoVoluntario(
  atual: LinhaGrupoVoluntario[],
  index: number,
  campo: 'funcao' | 'observacao',
  valor: string,
): LinhaGrupoVoluntario[] {
  const atualizado = atual.map((g, i) => (i === index ? { ...g, [campo]: valor } : g));
  return normalizarGruposVoluntarios(atualizado);
}

/** Atualiza um dos nomes dentro do grupo (lista dinâmica, sempre com um campo vazio no final). */
export function atualizarNomeGrupoVoluntario(
  atual: LinhaGrupoVoluntario[],
  grupoIndex: number,
  nomeIndex: number,
  valor: string,
): LinhaGrupoVoluntario[] {
  const atualizado = atual.map((g, i) =>
    i === grupoIndex ? { ...g, nomes: atualizarListaDinamica(g.nomes, nomeIndex, valor) } : g,
  );
  return normalizarGruposVoluntarios(atualizado);
}

/**
 * Agrupa voluntários já salvos (uma linha por pessoa) em grupos por cargo/observação, para
 * pré-popular o formulário de edição no mesmo formato usado para digitar (cargo uma vez, vários nomes).
 */
export function agruparVoluntariosExistentes(
  voluntarios: { nome: string; funcao: string | null; observacao: string | null }[],
): LinhaGrupoVoluntario[] {
  const grupos: { funcao: string; nomes: string[]; observacao: string }[] = [];
  for (const v of voluntarios) {
    const funcao = v.funcao ?? '';
    const observacao = v.observacao ?? '';
    const existente = grupos.find((g) => g.funcao === funcao && g.observacao === observacao);
    if (existente) {
      existente.nomes.push(v.nome);
    } else {
      grupos.push({ funcao, nomes: [v.nome], observacao });
    }
  }
  if (grupos.length === 0) return [criarGrupoVoluntarioVazio()];
  return [...grupos.map((g) => ({ ...g, nomes: [...g.nomes, ''] })), criarGrupoVoluntarioVazio()];
}
