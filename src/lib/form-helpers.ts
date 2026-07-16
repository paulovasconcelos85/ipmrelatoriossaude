import { supabase } from './supabase/client';
import type { ChaveGrupoDinamico } from './atendimentos-fields';

export function textoOuNulo(valor: FormDataEntryValue | null): string | null {
  const texto = typeof valor === 'string' ? valor.trim() : '';
  return texto === '' ? null : texto;
}

export function inteiroOuNulo(valor: FormDataEntryValue | null): number | null {
  const texto = typeof valor === 'string' ? valor.trim() : '';
  if (texto === '') return null;
  const numero = parseInt(texto, 10);
  return Number.isNaN(numero) ? null : numero;
}

/**
 * Próximo número de viagem do ano, no formato "AAAA-NN" (ex.: "2026-13"), seguindo a numeração
 * já usada no histórico do sistema IPM. Olha o maior sufixo numérico já usado no ano e soma 1 —
 * não depende de contagem de linhas, então funciona mesmo com números fora de ordem ou faltando.
 */
export async function proximoNumeroViagem(ano: number): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('viagens').select('numero').eq('ano', ano).not('numero', 'is', null);
  if (error) throw error;

  let maiorSequencial = 0;
  for (const row of data ?? []) {
    const match = /^\d{4}-(\d+)$/.exec((row as { numero: string | null }).numero ?? '');
    if (match) maiorSequencial = Math.max(maiorSequencial, parseInt(match[1], 10));
  }

  return `${ano}-${String(maiorSequencial + 1).padStart(2, '0')}`;
}

/** Dias em missão, calculado a partir do período (inclusive nas duas pontas). */
export function calcularDiasMissao(dataSaida: string, dataChegada: string | null): number | null {
  if (!dataChegada) return null;
  const saida = new Date(`${dataSaida}T00:00:00`);
  const chegada = new Date(`${dataChegada}T00:00:00`);
  const diffMs = chegada.getTime() - saida.getTime();
  if (diffMs < 0) return null;
  return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Busca por nome ignorando maiúsculas/minúsculas (`ilike`), para não criar um cadastro duplicado
 * quando a mesma pessoa/entidade é digitada com capitalização diferente (ex.: "maria" x "Maria").
 */
export async function obterOuCriarPorNome(
  tabela: 'barcos' | 'profissionais' | 'parceiros' | 'tipos_transporte' | 'comunidades',
  nome: string,
  extra?: Record<string, unknown>,
): Promise<string | null> {
  if (!supabase) return null;
  const nomeLimpo = nome.trim();
  if (!nomeLimpo) return null;

  const { data: existente } = await supabase
    .from(tabela)
    .select('id')
    .ilike('nome', nomeLimpo)
    .maybeSingle();
  if (existente) return existente.id as string;

  const { data: criado, error } = await supabase
    .from(tabela)
    .insert({ nome: nomeLimpo, ...extra })
    .select('id')
    .single();
  if (error) throw error;
  return criado.id as string;
}

/**
 * Resolve uma lista de nomes digitados (podem repetir) para IDs de uma tabela de apoio,
 * criando os que não existem. Resolve nomes únicos em paralelo — evita disparar duas
 * buscas/criações concorrentes para o mesmo nome, o que poderia gerar duplicata.
 */
export async function resolverNomesParaIds(
  tabela: 'barcos' | 'profissionais' | 'parceiros' | 'tipos_transporte' | 'comunidades',
  nomes: string[],
): Promise<string[]> {
  const nomesUnicos = Array.from(new Set(nomes.map((n) => n.trim()).filter(Boolean)));
  const idsPorNome = new Map<string, string | null>();
  await Promise.all(
    nomesUnicos.map(async (nome) => {
      idsPorNome.set(nome, await obterOuCriarPorNome(tabela, nome));
    }),
  );
  return nomes.map((n) => n.trim()).filter(Boolean).map((n) => idsPorNome.get(n)).filter((id): id is string => !!id);
}

/**
 * Como `resolverNomesParaIds`, mas para vários grupos de nomes de uma vez (ex.: coordenadores
 * e líderes de saúde), resolvendo o conjunto combinado de nomes únicos primeiro. Evita que a
 * mesma pessoa, aparecendo em dois grupos (ex.: coordenadora que também é líder de saúde),
 * dispare duas buscas/criações concorrentes do mesmo profissional — o que geraria duplicata.
 */
export async function resolverGruposNomesParaIds(
  tabela: 'barcos' | 'profissionais' | 'parceiros' | 'tipos_transporte' | 'comunidades',
  grupos: string[][],
): Promise<string[][]> {
  const nomesUnicos = Array.from(new Set(grupos.flat().map((n) => n.trim()).filter(Boolean)));
  const idsPorNome = new Map<string, string | null>();
  await Promise.all(
    nomesUnicos.map(async (nome) => {
      idsPorNome.set(nome, await obterOuCriarPorNome(tabela, nome));
    }),
  );
  return grupos.map((nomes) =>
    nomes
      .map((n) => n.trim())
      .filter(Boolean)
      .map((n) => idsPorNome.get(n))
      .filter((id): id is string => !!id),
  );
}

/**
 * Busca (ou cria) um item de estatística livre (ex.: "Curativos") dentro de um grupo dinâmico
 * (atividades e procedimentos de saúde / assistência social e doações). Mesma lógica de
 * `obterOuCriarPorNome`, mas com o nome escopado por grupo — o mesmo nome pode existir em
 * grupos diferentes sem conflitar.
 */
export async function obterOuCriarCampoEstatistico(grupo: ChaveGrupoDinamico, nome: string): Promise<string | null> {
  if (!supabase) return null;
  const nomeLimpo = nome.trim();
  if (!nomeLimpo) return null;

  const { data: existente } = await supabase
    .from('campos_estatisticos')
    .select('id')
    .eq('grupo', grupo)
    .ilike('nome', nomeLimpo)
    .maybeSingle();
  if (existente) return existente.id as string;

  const { data: criado, error } = await supabase
    .from('campos_estatisticos')
    .insert({ grupo, nome: nomeLimpo })
    .select('id')
    .single();
  if (error) throw error;
  return criado.id as string;
}

/**
 * Lê as linhas dinâmicas (nome do item + quantidade) de um grupo de estatística livre do FormData
 * e resolve cada nome para um campo_estatistico (existente ou novo). Descarta linhas sem nome ou
 * com quantidade zerada; se o mesmo item aparecer mais de uma vez, mantém a última quantidade.
 */
export async function resolverItensEstatisticos(
  formData: FormData,
  grupo: ChaveGrupoDinamico,
  campoNome: string,
  campoQtd: string,
): Promise<{ campo_estatistico_id: string; quantidade: number }[]> {
  const nomes = formData.getAll(campoNome);
  const quantidades = formData.getAll(campoQtd);

  const linhas: { nome: string; quantidade: number }[] = [];
  for (let i = 0; i < nomes.length; i++) {
    const nome = textoOuNulo(nomes[i] ?? null);
    const quantidade = inteiroOuNulo(quantidades[i] ?? null);
    if (!nome || !quantidade) continue;
    linhas.push({ nome, quantidade });
  }

  const nomesUnicos = Array.from(new Set(linhas.map((l) => l.nome)));
  const idsPorNome = new Map<string, string | null>();
  await Promise.all(
    nomesUnicos.map(async (nome) => {
      idsPorNome.set(nome, await obterOuCriarCampoEstatistico(grupo, nome));
    }),
  );

  const porCampo = new Map<string, number>();
  for (const linha of linhas) {
    const id = idsPorNome.get(linha.nome);
    if (!id) continue;
    porCampo.set(id, linha.quantidade);
  }

  return Array.from(porCampo.entries()).map(([campo_estatistico_id, quantidade]) => ({
    campo_estatistico_id,
    quantidade,
  }));
}

/**
 * Lê as linhas dinâmicas de "Profissionais que foram na viagem" (nome, cargo/função,
 * observação) do FormData e resolve cada nome para um profissional (existente ou novo).
 * Descarta linhas sem nome; se o mesmo profissional aparecer mais de uma vez, mantém a última.
 * Nomes únicos são resolvidos em paralelo pelo mesmo motivo de `resolverNomesParaIds`.
 */
export async function resolverVoluntarios(
  formData: FormData,
): Promise<{ profissional_id: string; funcao: string | null; observacao: string | null }[]> {
  const nomes = formData.getAll('voluntario_nome');
  const funcoes = formData.getAll('voluntario_funcao');
  const observacoes = formData.getAll('voluntario_observacao');

  const linhas: { nome: string; funcao: string | null; observacao: string | null }[] = [];
  for (let i = 0; i < nomes.length; i++) {
    const nome = textoOuNulo(nomes[i] ?? null);
    if (!nome) continue;
    linhas.push({ nome, funcao: textoOuNulo(funcoes[i] ?? null), observacao: textoOuNulo(observacoes[i] ?? null) });
  }

  const nomesUnicos = Array.from(new Set(linhas.map((l) => l.nome)));
  const idsPorNome = new Map<string, string | null>();
  await Promise.all(
    nomesUnicos.map(async (nome) => {
      const funcao = linhas.find((l) => l.nome === nome)?.funcao;
      idsPorNome.set(nome, await obterOuCriarPorNome('profissionais', nome, { cargo: funcao ?? undefined }));
    }),
  );

  const porProfissional = new Map<string, { profissional_id: string; funcao: string | null; observacao: string | null }>();
  for (const linha of linhas) {
    const profissionalId = idsPorNome.get(linha.nome);
    if (!profissionalId) continue;
    porProfissional.set(profissionalId, {
      profissional_id: profissionalId,
      funcao: linha.funcao,
      observacao: linha.observacao,
    });
  }

  return Array.from(porProfissional.values());
}
