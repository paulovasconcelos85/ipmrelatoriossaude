'use client';

import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { adicionarFotoViagem, atualizarLegendaFoto, removerFotoViagem } from './fotos-actions';
import { confirmarExclusaoDupla } from '@/lib/confirmar';
import type { Foto } from '@/lib/viagens-ipm';

type ArquivoPreview = { arquivo: File; url: string };

function CampoFoto({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null> }) {
  const [arrastando, setArrastando] = useState(false);
  const [arquivos, setArquivos] = useState<ArquivoPreview[]>([]);
  const arquivosRef = useRef<ArquivoPreview[]>([]);

  useEffect(() => {
    arquivosRef.current = arquivos;
  });

  const sincronizarArquivos = useCallback(
    (novos: File[]) => {
      if (!inputRef.current) return;
      const dataTransfer = new DataTransfer();
      novos.forEach((f) => dataTransfer.items.add(f));
      inputRef.current.files = dataTransfer.files;

      const atuais = arquivosRef.current;
      for (const { arquivo, url } of atuais) {
        if (!novos.includes(arquivo)) URL.revokeObjectURL(url);
      }
      setArquivos(
        novos.map(
          (arquivo) => atuais.find((a) => a.arquivo === arquivo) ?? { arquivo, url: URL.createObjectURL(arquivo) },
        ),
      );
    },
    [inputRef],
  );

  const adicionarArquivos = useCallback(
    (novos: File[]) => {
      sincronizarArquivos([...arquivosRef.current.map((a) => a.arquivo), ...novos]);
    },
    [sincronizarArquivos],
  );

  function removerArquivo(index: number) {
    sincronizarArquivos(arquivosRef.current.filter((_, i) => i !== index).map((a) => a.arquivo));
  }

  useEffect(() => {
    return () => {
      arquivosRef.current.forEach(({ url }) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    function aoColar(e: ClipboardEvent) {
      const imagens = Array.from(e.clipboardData?.items ?? [])
        .filter((i) => i.type.startsWith('image/'))
        .map((i) => i.getAsFile())
        .filter((f): f is File => f !== null);
      if (imagens.length > 0) {
        e.preventDefault();
        adicionarArquivos(imagens);
      }
    }
    document.addEventListener('paste', aoColar);
    return () => document.removeEventListener('paste', aoColar);
  }, [adicionarArquivos]);

  return (
    <div className="flex flex-1 flex-col gap-1 text-sm font-semibold text-slate-600">
      Fotos
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          const imagens = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
          if (imagens.length > 0) adicionarArquivos(imagens);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-3 py-4 text-center text-xs font-normal transition-colors ${
          arrastando ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-300 text-slate-500'
        }`}
      >
        {arquivos.length > 0 ? (
          <div className="flex w-full flex-wrap items-center gap-2">
            {arquivos.map(({ arquivo, url }, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={arquivo.name} className="h-14 w-14 rounded object-cover" />
                <button
                  type="button"
                  aria-label={`Remover ${arquivo.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removerArquivo(i);
                  }}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white"
                >
                  ×
                </button>
              </div>
            ))}
            <span className="text-slate-500">
              {arquivos.length} foto{arquivos.length > 1 ? 's' : ''} selecionada{arquivos.length > 1 ? 's' : ''} —
              clique para adicionar mais
            </span>
          </div>
        ) : (
          <span>Arraste uma ou mais imagens aqui, clique para escolher ou cole com Ctrl+V em qualquer lugar da página</span>
        )}
        <input
          ref={inputRef}
          type="file"
          name="foto"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          required
          aria-label="Fotos"
          onChange={(e) => adicionarArquivos(Array.from(e.target.files ?? []))}
          className="sr-only"
        />
      </div>
    </div>
  );
}

function BotaoEnviar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-accent-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:bg-accent-600 active:scale-95 disabled:opacity-60"
    >
      {pending ? 'Enviando...' : 'Adicionar fotos'}
    </button>
  );
}

function LegendaFoto({ viagemId, foto }: { viagemId: string; foto: Foto }) {
  const [legenda, setLegenda] = useState(foto.legenda ?? '');
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const alterada = legenda.trim() !== (foto.legenda ?? '').trim();

  function salvar() {
    setErro(null);
    startTransition(async () => {
      const resultado = await atualizarLegendaFoto(viagemId, foto.id, legenda);
      if (resultado?.erro) setErro(resultado.erro);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        type="text"
        value={legenda}
        onChange={(e) => setLegenda(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && alterada) {
            e.preventDefault();
            salvar();
          }
        }}
        placeholder="Adicionar legenda..."
        disabled={pending}
        className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-900 disabled:opacity-60"
      />
      {alterada && (
        <button
          type="button"
          disabled={pending}
          onClick={salvar}
          className="self-start rounded-full bg-accent-500 px-3 py-1 text-xs font-bold text-white disabled:opacity-60 hover:bg-accent-600"
        >
          {pending ? 'Salvando...' : 'Salvar legenda'}
        </button>
      )}
      {erro && <p className="text-xs text-red-700">{erro}</p>}
    </div>
  );
}

function BotaoRemoverFoto({ viagemId, foto }: { viagemId: string; foto: Foto }) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirmarExclusaoDupla('Excluir esta foto?')) return;
          setErro(null);
          startTransition(async () => {
            const resultado = await removerFotoViagem(viagemId, foto.id, foto.storagePath);
            if (resultado?.erro) setErro(resultado.erro);
          });
        }}
        className="rounded-full border-2 border-red-300 bg-white px-3 py-1 text-xs font-bold text-red-700 transition-all duration-150 hover:border-red-400 hover:bg-red-50 active:scale-95 disabled:opacity-60"
      >
        {pending ? 'Excluindo...' : 'Excluir'}
      </button>
      {erro && <p className="text-xs text-red-700">{erro}</p>}
    </div>
  );
}

export default function FotosViagem({ viagemId, fotos }: { viagemId: string; fotos: Foto[] }) {
  const [estado, formAction] = useActionState(adicionarFotoViagem, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const [campoFotoKey, setCampoFotoKey] = useState(0);

  return (
    <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 text-lg font-bold text-primary-900">Fotos</h2>
      <p className="mb-4 text-sm text-slate-500">
        Fotos anexadas serão usadas no relatório em PDF da viagem.
      </p>

      {fotos.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {fotos.map((foto) => (
            <div key={foto.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={foto.url}
                alt={foto.legenda ?? 'Foto da viagem'}
                className="aspect-square w-full rounded-lg object-cover"
              />
              <LegendaFoto viagemId={viagemId} foto={foto} />
              <BotaoRemoverFoto viagemId={viagemId} foto={foto} />
            </div>
          ))}
        </div>
      )}

      {estado?.erro && (
        <p className="mb-3 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          {estado.erro}
        </p>
      )}

      <form
        ref={formRef}
        action={async (formData) => {
          await formAction(formData);
          formRef.current?.reset();
          setCampoFotoKey((k) => k + 1);
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <input type="hidden" name="viagem_id" value={viagemId} />
        <CampoFoto key={campoFotoKey} inputRef={fotoInputRef} />
        <label className="flex flex-1 flex-col gap-1 text-sm font-semibold text-slate-600">
          Legenda (opcional, aplicada a todas as fotos deste envio)
          <input
            type="text"
            name="legenda"
            placeholder="Atendimento na comunidade..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
          />
        </label>
        <BotaoEnviar />
      </form>
    </section>
  );
}
