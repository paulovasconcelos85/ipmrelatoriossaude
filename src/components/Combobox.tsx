'use client';

import { useEffect, useId, useRef, useState } from 'react';

/** Remove acentos e normaliza para comparação (evita duplicar "José" x "Jose", "SILVA" x "silva"...). */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

type ComboboxProps = {
  name: string;
  options: string[];
  placeholder?: string;
  className?: string;
  required?: boolean;
  /** Modo controlado: quando informado junto com onValueChange, o componente pai guarda o valor. */
  value?: string;
  onValueChange?: (valor: string) => void;
  /** Modo não controlado: valor inicial, o componente guarda seu próprio estado. */
  defaultValue?: string;
};

/**
 * Campo de texto com sugestões filtradas por clique/toque, funcionando em qualquer navegador
 * (o <datalist> nativo não é suportado no Safari do iPhone/iPad, por isso não usamos mais).
 * Permite digitar um valor novo quando não houver correspondência.
 */
export default function Combobox({
  name,
  options,
  placeholder,
  className,
  required,
  value,
  onValueChange,
  defaultValue,
}: ComboboxProps) {
  const controlado = value !== undefined;
  const [interno, setInterno] = useState(defaultValue ?? '');
  const atual = controlado ? value! : interno;

  const [aberto, setAberto] = useState(false);
  const [indiceAtivo, setIndiceAtivo] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  function atualizar(novoValor: string) {
    if (!controlado) setInterno(novoValor);
    onValueChange?.(novoValor);
  }

  const termo = normalizarTexto(atual);
  const filtradas = termo === '' ? options : options.filter((o) => normalizarTexto(o).includes(termo));
  const semCorrespondencia = atual.trim() !== '' && !options.some((o) => normalizarTexto(o) === termo);

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, []);

  function selecionar(opcao: string) {
    atualizar(opcao);
    setAberto(false);
    setIndiceAtivo(-1);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        name={name}
        value={atual}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-expanded={aberto}
        aria-controls={`${inputId}-lista`}
        onChange={(e) => {
          atualizar(e.target.value);
          setAberto(true);
          setIndiceAtivo(-1);
        }}
        onFocus={() => setAberto(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setAberto(true);
            setIndiceAtivo((i) => Math.min(i + 1, filtradas.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setIndiceAtivo((i) => Math.max(i - 1, 0));
          } else if (e.key === 'Enter') {
            if (aberto && indiceAtivo >= 0 && filtradas[indiceAtivo]) {
              e.preventDefault();
              selecionar(filtradas[indiceAtivo]);
            }
          } else if (e.key === 'Escape') {
            setAberto(false);
          }
        }}
        placeholder={placeholder}
        className={className ?? 'w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900'}
      />
      {aberto && (filtradas.length > 0 || semCorrespondencia) && (
        <div
          id={`${inputId}-lista`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-300 bg-white text-base shadow-lg"
        >
          {filtradas.map((opcao, i) => (
            <button
              key={opcao}
              type="button"
              role="option"
              aria-selected={i === indiceAtivo}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selecionar(opcao)}
              className={`block w-full px-3 py-2 text-left ${
                i === indiceAtivo ? 'bg-blue-50 text-blue-900' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {opcao}
            </button>
          ))}
          {semCorrespondencia && (
            <div className="border-t border-slate-100 px-3 py-1.5 text-xs text-slate-500">
              Nenhum cadastro encontrado — “{atual.trim()}” será criado como novo
            </div>
          )}
        </div>
      )}
    </div>
  );
}
