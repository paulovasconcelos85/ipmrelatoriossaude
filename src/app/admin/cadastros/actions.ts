'use server';

import { revalidatePath } from 'next/cache';
import { supabase, supabaseConfigured } from '@/lib/supabase/client';
import { textoOuNulo } from '@/lib/form-helpers';

export type EstadoCadastro = { erro?: string } | undefined;

type TabelaSimples = 'tipos_transporte' | 'barcos' | 'comunidades';

function mensagemErro(error: { message: string; code?: string }): string {
  if (error.code === '23505') return 'Já existe um registro com esse nome.';
  if (error.code === '23503') return 'Não é possível excluir: este registro está em uso em uma ou mais viagens.';
  return error.message;
}

// --- Tabelas simples (só nome): tipos_transporte, barcos, comunidades ---

export async function criarRegistroSimples(
  tabela: TabelaSimples,
  _estado: EstadoCadastro,
  formData: FormData,
): Promise<EstadoCadastro> {
  if (!supabaseConfigured || !supabase) return { erro: 'Supabase não está configurado neste ambiente.' };

  const nome = textoOuNulo(formData.get('nome'));
  if (!nome) return { erro: 'Informe um nome.' };

  const { error } = await supabase.from(tabela).insert({ nome });
  if (error) return { erro: mensagemErro(error) };

  revalidatePath('/admin/cadastros');
  return undefined;
}

export async function atualizarRegistroSimples(
  tabela: TabelaSimples,
  _estado: EstadoCadastro,
  formData: FormData,
): Promise<EstadoCadastro> {
  if (!supabaseConfigured || !supabase) return { erro: 'Supabase não está configurado neste ambiente.' };

  const id = textoOuNulo(formData.get('id'));
  const nome = textoOuNulo(formData.get('nome'));
  if (!id || !nome) return { erro: 'Dados inválidos.' };

  const { error } = await supabase.from(tabela).update({ nome }).eq('id', id);
  if (error) return { erro: mensagemErro(error) };

  revalidatePath('/admin/cadastros');
  return undefined;
}

export async function excluirRegistroSimples(tabela: TabelaSimples, id: string): Promise<void> {
  if (!supabaseConfigured || !supabase) return;

  const { error } = await supabase.from(tabela).delete().eq('id', id);
  if (error) throw new Error(mensagemErro(error));

  revalidatePath('/admin/cadastros');
}

// --- Parceiros (nome, cidade, país) ---

export async function criarParceiro(_estado: EstadoCadastro, formData: FormData): Promise<EstadoCadastro> {
  if (!supabaseConfigured || !supabase) return { erro: 'Supabase não está configurado neste ambiente.' };

  const nome = textoOuNulo(formData.get('nome'));
  if (!nome) return { erro: 'Informe um nome.' };
  const cidade = textoOuNulo(formData.get('cidade'));
  const pais = textoOuNulo(formData.get('pais'));

  const { error } = await supabase.from('parceiros').insert({ nome, cidade, pais });
  if (error) return { erro: mensagemErro(error) };

  revalidatePath('/admin/cadastros');
  return undefined;
}

export async function atualizarParceiro(_estado: EstadoCadastro, formData: FormData): Promise<EstadoCadastro> {
  if (!supabaseConfigured || !supabase) return { erro: 'Supabase não está configurado neste ambiente.' };

  const id = textoOuNulo(formData.get('id'));
  const nome = textoOuNulo(formData.get('nome'));
  if (!id || !nome) return { erro: 'Dados inválidos.' };
  const cidade = textoOuNulo(formData.get('cidade'));
  const pais = textoOuNulo(formData.get('pais'));

  const { error } = await supabase.from('parceiros').update({ nome, cidade, pais }).eq('id', id);
  if (error) return { erro: mensagemErro(error) };

  revalidatePath('/admin/cadastros');
  return undefined;
}

export async function excluirParceiro(id: string): Promise<void> {
  if (!supabaseConfigured || !supabase) return;

  const { error } = await supabase.from('parceiros').delete().eq('id', id);
  if (error) throw new Error(mensagemErro(error));

  revalidatePath('/admin/cadastros');
}

// --- Profissionais (nome, cargo) ---

export async function criarProfissional(_estado: EstadoCadastro, formData: FormData): Promise<EstadoCadastro> {
  if (!supabaseConfigured || !supabase) return { erro: 'Supabase não está configurado neste ambiente.' };

  const nome = textoOuNulo(formData.get('nome'));
  if (!nome) return { erro: 'Informe um nome.' };
  const cargo = textoOuNulo(formData.get('cargo'));

  const { error } = await supabase.from('profissionais').insert({ nome, cargo });
  if (error) return { erro: mensagemErro(error) };

  revalidatePath('/admin/cadastros');
  return undefined;
}

export async function atualizarProfissional(_estado: EstadoCadastro, formData: FormData): Promise<EstadoCadastro> {
  if (!supabaseConfigured || !supabase) return { erro: 'Supabase não está configurado neste ambiente.' };

  const id = textoOuNulo(formData.get('id'));
  const nome = textoOuNulo(formData.get('nome'));
  if (!id || !nome) return { erro: 'Dados inválidos.' };
  const cargo = textoOuNulo(formData.get('cargo'));

  const { error } = await supabase.from('profissionais').update({ nome, cargo }).eq('id', id);
  if (error) return { erro: mensagemErro(error) };

  revalidatePath('/admin/cadastros');
  return undefined;
}

export async function excluirProfissional(id: string): Promise<void> {
  if (!supabaseConfigured || !supabase) return;

  const { error } = await supabase.from('profissionais').delete().eq('id', id);
  if (error) throw new Error(mensagemErro(error));

  revalidatePath('/admin/cadastros');
}
