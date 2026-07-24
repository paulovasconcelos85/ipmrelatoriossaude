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
 * Uma pessoa dentro de um grupo de voluntários: nome e observação são individuais
 * (cada pessoa pode ter uma observação diferente, mesmo compartilhando o cargo).
 */
export type PessoaGrupoVoluntario = { nome: string; observacao: string };

/**
 * Um "grupo" de voluntários que compartilham o mesmo cargo/função (ex.: várias médicas de
 * uma vez) — em vez de repetir o cargo para cada pessoa, digita-se o cargo uma vez e depois
 * os nomes na sequência, cada um com sua própria observação.
 */
export type LinhaGrupoVoluntario = { funcao: string; pessoas: PessoaGrupoVoluntario[] };

function pessoaVazia(): PessoaGrupoVoluntario {
  return { nome: '', observacao: '' };
}

export function criarGrupoVoluntarioVazio(): LinhaGrupoVoluntario {
  return { funcao: '', pessoas: [pessoaVazia()] };
}

function grupoVoluntarioEstaVazio(g: LinhaGrupoVoluntario): boolean {
  return g.funcao.trim() === '' && g.pessoas.every((p) => p.nome.trim() === '' && p.observacao.trim() === '');
}

function normalizarGruposVoluntarios(grupos: LinhaGrupoVoluntario[]): LinhaGrupoVoluntario[] {
  const preenchidos = grupos.filter((g) => !grupoVoluntarioEstaVazio(g));
  return [...preenchidos, criarGrupoVoluntarioVazio()];
}

/** Atualiza o cargo/função do grupo (compartilhado por todas as pessoas dele). */
export function atualizarFuncaoGrupoVoluntario(
  atual: LinhaGrupoVoluntario[],
  index: number,
  valor: string,
): LinhaGrupoVoluntario[] {
  const atualizado = atual.map((g, i) => (i === index ? { ...g, funcao: valor } : g));
  return normalizarGruposVoluntarios(atualizado);
}

/** Atualiza o nome ou a observação de uma pessoa dentro do grupo (lista dinâmica, sempre com uma linha vazia no final). */
export function atualizarPessoaGrupoVoluntario(
  atual: LinhaGrupoVoluntario[],
  grupoIndex: number,
  pessoaIndex: number,
  campo: keyof PessoaGrupoVoluntario,
  valor: string,
): LinhaGrupoVoluntario[] {
  const atualizado = atual.map((g, i) => {
    if (i !== grupoIndex) return g;
    const pessoas = g.pessoas.map((p, pi) => (pi === pessoaIndex ? { ...p, [campo]: valor } : p));
    const preenchidas = pessoas.filter((p) => p.nome.trim() !== '' || p.observacao.trim() !== '');
    return { ...g, pessoas: [...preenchidas, pessoaVazia()] };
  });
  return normalizarGruposVoluntarios(atualizado);
}

/**
 * Agrupa voluntários já salvos (uma linha por pessoa) em grupos por cargo, para pré-popular
 * o formulário de edição no mesmo formato usado para digitar (cargo uma vez, várias pessoas,
 * cada uma com sua própria observação).
 */
export function agruparVoluntariosExistentes(
  voluntarios: { nome: string; funcao: string | null; observacao: string | null }[],
): LinhaGrupoVoluntario[] {
  const grupos: LinhaGrupoVoluntario[] = [];
  for (const v of voluntarios) {
    const funcao = v.funcao ?? '';
    let grupo = grupos.find((g) => g.funcao === funcao);
    if (!grupo) {
      grupo = { funcao, pessoas: [] };
      grupos.push(grupo);
    }
    grupo.pessoas.push({ nome: v.nome, observacao: v.observacao ?? '' });
  }
  if (grupos.length === 0) return [criarGrupoVoluntarioVazio()];
  return [...grupos.map((g) => ({ ...g, pessoas: [...g.pessoas, pessoaVazia()] })), criarGrupoVoluntarioVazio()];
}
