'use client';

import { useActionState, useRef, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { adicionarFotoViagem, atualizarLegendaFoto, removerFotoViagem } from './fotos-actions';
import { confirmarExclusaoDupla } from '@/lib/confirmar';
import type { Foto } from '@/lib/viagens-ipm';

function CampoFoto({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null> }) {
  const [arrastando, setArrastando] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);

  function definirArquivo(file: File | null) {
    if (!inputRef.current) return;
    const dataTransfer = new DataTransfer();
    if (file) dataTransfer.items.add(file);
    inputRef.current.files = dataTransfer.files;

    setPreviewUrl((atual) => {
      if (atual) URL.revokeObjectURL(atual);
      return file ? URL.createObjectURL(file) : null;
    });
    setNomeArquivo(file?.name ?? null);
  }

  return (
    <div className="flex flex-1 flex-col gap-1 text-sm font-semibold text-slate-600">
      Foto
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
          const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'));
          if (file) definirArquivo(file);
        }}
        onPaste={(e) => {
          const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith('image/'));
          const file = item?.getAsFile();
          if (file) {
            e.preventDefault();
            definirArquivo(file);
          }
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-3 py-4 text-center text-xs font-normal transition-colors ${
          arrastando ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-500'
        }`}
      >
        {previewUrl ? (
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Pré-visualização" className="h-12 w-12 rounded object-cover" />
            <span className="max-w-[10rem] truncate">{nomeArquivo}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                definirArquivo(null);
              }}
              className="font-bold text-red-600 underline"
            >
              remover
            </button>
          </div>
        ) : (
          <span>Arraste uma imagem aqui, cole com Ctrl+V ou clique para escolher</span>
        )}
        <input
          ref={inputRef}
          type="file"
          name="foto"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          required
          aria-label="Foto"
          onChange={(e) => definirArquivo(e.target.files?.[0] ?? null)}
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
      className="rounded-full bg-blue-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:bg-blue-800 active:scale-95 disabled:opacity-60"
    >
      {pending ? 'Enviando...' : 'Adicionar foto'}
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
          className="self-start rounded-full bg-blue-900 px-3 py-1 text-xs font-bold text-white disabled:opacity-60"
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
      <h2 className="mb-1 text-lg font-bold text-blue-900">Fotos</h2>
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
          Legenda (opcional)
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
