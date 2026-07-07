'use client';

import { useEffect } from 'react';

export default function ScrollToAtual() {
  useEffect(() => {
    document.getElementById('viagem-atual')?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, []);

  return null;
}
