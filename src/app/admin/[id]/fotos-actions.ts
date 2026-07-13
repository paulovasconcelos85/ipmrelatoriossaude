'use server';

import { revalidatePath } from 'next/cache';
import { supabase, supabaseConfigured } from '@/lib/supabase/client';
import { BUCKET_FOTOS } from '@/lib/viagens-ipm';

export type EstadoUploadFoto = { erro?: string } | undefined;

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const TAMANHO_MAXIMO = 8 * 1024 * 1024; // 8MB

export async function adicionarFotoViagem(
  _estadoAnterior: EstadoUploadFoto,
  formData: FormData,
): Promise<EstadoUploadFoto> {
  if (!supabaseConfigured || !supabase) {
    return { erro: 'Supabase não está configurado neste ambiente.' };
  }

  const viagemId = formData.get('viagem_id');
  if (typeof viagemId !== 'string' || !viagemId) {
    return { erro: 'Viagem inválida.' };
  }

  const arquivo = formData.get('foto');
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { erro: 'Escolha uma foto para enviar.' };
  }
  if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
    return { erro: 'Formato não suportado. Envie uma foto em JPEG, PNG, WEBP ou HEIC.' };
  }
  if (arquivo.size > TAMANHO_MAXIMO) {
    return { erro: 'Foto muito grande. O tamanho máximo é 8MB.' };
  }

  const legenda = formData.get('legenda');
  const legendaTexto = typeof legenda === 'string' && legenda.trim() !== '' ? legenda.trim() : null;

  const { count } = await supabase
    .from('viagem_fotos')
    .select('id', { count: 'exact', head: true })
    .eq('viagem_id', viagemId);
  const proximaPosicao = (count ?? 0) + 1;

  const extensao = arquivo.name.includes('.') ? arquivo.name.split('.').pop() : arquivo.type.split('/').pop();
  const caminho = `${viagemId}/${crypto.randomUUID()}.${extensao}`;

  const { error: erroUpload } = await supabase.storage.from(BUCKET_FOTOS).upload(caminho, arquivo, {
    contentType: arquivo.type,
    upsert: false,
  });
  if (erroUpload) {
    return { erro: `Não foi possível enviar a foto: ${erroUpload.message}` };
  }

  const { error: erroInsercao } = await supabase.from('viagem_fotos').insert({
    viagem_id: viagemId,
    storage_path: caminho,
    legenda: legendaTexto,
    posicao: proximaPosicao,
  });
  if (erroInsercao) {
    await supabase.storage.from(BUCKET_FOTOS).remove([caminho]);
    return { erro: `Não foi possível salvar a foto: ${erroInsercao.message}` };
  }

  revalidatePath(`/admin/${viagemId}`);
  return {};
}

export async function atualizarLegendaFoto(
  viagemId: string,
  fotoId: string,
  legenda: string,
): Promise<{ erro?: string } | undefined> {
  if (!supabaseConfigured || !supabase) return { erro: 'Supabase não está configurado neste ambiente.' };

  const legendaTexto = legenda.trim() !== '' ? legenda.trim() : null;

  const { error } = await supabase.from('viagem_fotos').update({ legenda: legendaTexto }).eq('id', fotoId);
  if (error) {
    return { erro: `Não foi possível salvar a legenda: ${error.message}` };
  }

  revalidatePath(`/admin/${viagemId}`);
  return undefined;
}

export async function removerFotoViagem(
  viagemId: string,
  fotoId: string,
  storagePath: string,
): Promise<{ erro?: string } | undefined> {
  if (!supabaseConfigured || !supabase) return { erro: 'Supabase não está configurado neste ambiente.' };

  const { error: erroExclusaoLinha } = await supabase.from('viagem_fotos').delete().eq('id', fotoId);
  if (erroExclusaoLinha) {
    return { erro: `Não foi possível excluir a foto: ${erroExclusaoLinha.message}` };
  }

  await supabase.storage.from(BUCKET_FOTOS).remove([storagePath]);

  revalidatePath(`/admin/${viagemId}`);
  return undefined;
}
