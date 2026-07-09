/**
 * Atualiza uma lista de campos dinâmicos (parceiros, comunidades...): descarta os
 * campos vazios e garante sempre um campo vazio no final para digitar o próximo.
 */
export function atualizarListaDinamica(atual: string[], index: number, valor: string): string[] {
  const atualizado = atual.map((v, i) => (i === index ? valor : v));
  const preenchidos = atualizado.filter((v) => v.trim() !== '');
  return [...preenchidos, ''];
}

export type LinhaVoluntario = { nome: string; funcao: string; observacao: string };

const LINHA_VOLUNTARIO_VAZIA: LinhaVoluntario = { nome: '', funcao: '', observacao: '' };

/** Mesma lógica de `atualizarListaDinamica`, mas para linhas com 3 campos (nome, cargo/função, observação). */
export function atualizarListaVoluntarios(
  atual: LinhaVoluntario[],
  index: number,
  campo: keyof LinhaVoluntario,
  valor: string,
): LinhaVoluntario[] {
  const atualizado = atual.map((linha, i) => (i === index ? { ...linha, [campo]: valor } : linha));
  const preenchidos = atualizado.filter(
    (l) => l.nome.trim() !== '' || l.funcao.trim() !== '' || l.observacao.trim() !== '',
  );
  return [...preenchidos, { ...LINHA_VOLUNTARIO_VAZIA }];
}
