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

  const arquivos = formData.getAll('foto').filter((v): v is File => v instanceof File && v.size > 0);
  if (arquivos.length === 0) {
    return { erro: 'Escolha ao menos uma foto para enviar.' };
  }
  for (const arquivo of arquivos) {
    if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
      return { erro: `Formato não suportado em "${arquivo.name}". Envie fotos em JPEG, PNG, WEBP ou HEIC.` };
    }
    if (arquivo.size > TAMANHO_MAXIMO) {
      return { erro: `"${arquivo.name}" é muito grande. O tamanho máximo é 8MB por foto.` };
    }
  }

  const legenda = formData.get('legenda');
  const legendaTexto = typeof legenda === 'string' && legenda.trim() !== '' ? legenda.trim() : null;

  const { count } = await supabase
    .from('viagem_fotos')
    .select('id', { count: 'exact', head: true })
    .eq('viagem_id', viagemId);
  const proximaPosicao = (count ?? 0) + 1;

  // Envios de cada arquivo são independentes entre si — rodam em paralelo.
  const envios = await Promise.all(
    arquivos.map(async (arquivo, i) => {
      const extensao = arquivo.name.includes('.') ? arquivo.name.split('.').pop() : arquivo.type.split('/').pop();
      const caminho = `${viagemId}/${crypto.randomUUID()}.${extensao}`;
      const { error: erro } = await supabase!.storage.from(BUCKET_FOTOS).upload(caminho, arquivo, {
        contentType: arquivo.type,
        upsert: false,
      });
      return { caminho, posicao: proximaPosicao + i, erro };
    }),
  );

  const enviadas = envios.filter((e) => !e.erro);
  const falhas = envios.filter((e) => e.erro);

  if (enviadas.length > 0) {
    const { error: erroInsercao } = await supabase.from('viagem_fotos').insert(
      enviadas.map((e) => ({
        viagem_id: viagemId,
        storage_path: e.caminho,
        legenda: legendaTexto,
        posicao: e.posicao,
      })),
    );
    if (erroInsercao) {
      await supabase.storage.from(BUCKET_FOTOS).remove(enviadas.map((e) => e.caminho));
      return { erro: `Não foi possível salvar as fotos: ${erroInsercao.message}` };
    }
  }

  revalidatePath(`/admin/${viagemId}`);

  if (falhas.length > 0) {
    return { erro: `${falhas.length} de ${arquivos.length} foto(s) não puderam ser enviadas. Tente novamente com elas.` };
  }
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
