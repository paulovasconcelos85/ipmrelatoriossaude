import { supabase } from './supabase/client';

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

/** Dias em missão, calculado a partir do período (inclusive nas duas pontas). */
export function calcularDiasMissao(dataSaida: string, dataChegada: string | null): number | null {
  if (!dataChegada) return null;
  const saida = new Date(`${dataSaida}T00:00:00`);
  const chegada = new Date(`${dataChegada}T00:00:00`);
  const diffMs = chegada.getTime() - saida.getTime();
  if (diffMs < 0) return null;
  return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

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
    .eq('nome', nomeLimpo)
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
 * Lê as linhas dinâmicas de "Profissionais que foram na viagem" (nome, cargo/função,
 * observação) do FormData e resolve cada nome para um profissional (existente ou novo).
 * Descarta linhas sem nome; se o mesmo profissional aparecer mais de uma vez, mantém a última.
 */
export async function resolverVoluntarios(
  formData: FormData,
): Promise<{ profissional_id: string; funcao: string | null; observacao: string | null }[]> {
  const nomes = formData.getAll('voluntario_nome');
  const funcoes = formData.getAll('voluntario_funcao');
  const observacoes = formData.getAll('voluntario_observacao');

  const porProfissional = new Map<string, { profissional_id: string; funcao: string | null; observacao: string | null }>();

  for (let i = 0; i < nomes.length; i++) {
    const nome = textoOuNulo(nomes[i] ?? null);
    if (!nome) continue;

    const funcao = textoOuNulo(funcoes[i] ?? null);
    const observacao = textoOuNulo(observacoes[i] ?? null);
    const profissionalId = await obterOuCriarPorNome('profissionais', nome, { cargo: funcao ?? undefined });
    if (!profissionalId) continue;

    porProfissional.set(profissionalId, { profissional_id: profissionalId, funcao, observacao });
  }

  return Array.from(porProfissional.values());
}
