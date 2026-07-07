'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'ipm-tamanho-fonte';
const PASSOS = [100, 115, 130, 150, 175];

function aplicarTamanho(indice: number) {
  document.documentElement.style.fontSize = `${PASSOS[indice]}%`;
}

export default function FontSizeControl() {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const salvo = window.localStorage.getItem(STORAGE_KEY);
    const indiceSalvo = salvo ? PASSOS.indexOf(Number(salvo)) : -1;
    const inicial = indiceSalvo >= 0 ? indiceSalvo : 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com localStorage apenas na montagem
    setIndice(inicial);
    aplicarTamanho(inicial);
  }, []);

  function mudar(novoIndice: number) {
    const limitado = Math.max(0, Math.min(PASSOS.length - 1, novoIndice));
    setIndice(limitado);
    aplicarTamanho(limitado);
    window.localStorage.setItem(STORAGE_KEY, String(PASSOS[limitado]));
  }

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Ajustar tamanho da letra">
      <button
        type="button"
        onClick={() => mudar(indice - 1)}
        disabled={indice === 0}
        aria-label="Diminuir tamanho da letra"
        className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-white/10 text-xl font-bold text-white active:bg-white/30 disabled:opacity-40"
      >
        A-
      </button>
      <button
        type="button"
        onClick={() => mudar(0)}
        aria-label="Tamanho de letra padrão"
        className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-white/10 text-base font-bold text-white active:bg-white/30"
      >
        A
      </button>
      <button
        type="button"
        onClick={() => mudar(indice + 1)}
        disabled={indice === PASSOS.length - 1}
        aria-label="Aumentar tamanho da letra"
        className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-white/10 text-2xl font-bold text-white active:bg-white/30 disabled:opacity-40"
      >
        A+
      </button>
    </div>
  );
}
