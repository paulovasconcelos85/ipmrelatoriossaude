'use client';

import { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import type { ViagemIpm } from '@/lib/viagens-ipm';

const TODOS = 'todos';

function opcoesUnicas(viagens: ViagemIpm[], pick: (v: ViagemIpm) => string | null): string[] {
  return [...new Set(viagens.map(pick).filter((x): x is string => Boolean(x)))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  );
}

function Select({
  label,
  value,
  onChange,
  opcoes,
  todosLabel = 'Todos',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  opcoes: string[];
  todosLabel?: string;
}) {
  return (
    <label className="flex min-w-[170px] shrink-0 flex-col gap-1 text-xs font-semibold text-slate-500">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900"
      >
        <option value={TODOS}>{todosLabel}</option>
        {opcoes.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

type LinhaStat = { label: string; valor: number; destaque?: boolean };

// Paleta alinhada com a tela (azul-900/700/100 e cinza-slate do Tailwind).
const COR_AZUL_900: [number, number, number] = [30, 58, 138];
const COR_AZUL_700: [number, number, number] = [29, 78, 216];
const COR_AZUL_100: [number, number, number] = [219, 234, 254];
const COR_AZUL_200: [number, number, number] = [191, 219, 254];
const COR_SLATE_50: [number, number, number] = [248, 250, 252];
const COR_SLATE_200: [number, number, number] = [226, 232, 240];
const COR_SLATE_400: [number, number, number] = [148, 163, 184];
const COR_SLATE_500: [number, number, number] = [100, 116, 139];
const COR_SLATE_900: [number, number, number] = [15, 23, 42];

const MARGEM = 14;
const LARGURA_PAGINA = 210;
const ALTURA_UTIL_PAGINA = 282;
const LARGURA_UTIL = LARGURA_PAGINA - MARGEM * 2;

function abrirPdfEstatisticas(filtrosAtivos: [string, string][], linhas: LinhaStat[]) {
  const doc = new jsPDF();

  // Cabeçalho
  doc.setFillColor(...COR_AZUL_900);
  doc.rect(0, 0, LARGURA_PAGINA, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('Relatório de Estatísticas', MARGEM, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('IPM Maria · Viagens e Atendimentos', MARGEM, 22);
  doc.setFontSize(8);
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, LARGURA_PAGINA - MARGEM, 22, { align: 'right' });

  let y = 40;

  // Filtros aplicados (como "pills")
  doc.setTextColor(...COR_SLATE_500);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('FILTROS APLICADOS', MARGEM, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (filtrosAtivos.length === 0) {
    doc.setTextColor(...COR_SLATE_400);
    doc.text('Nenhum — considerando todas as viagens', MARGEM, y);
    y += 8;
  } else {
    let x = MARGEM;
    const alturaPill = 7;
    filtrosAtivos.forEach(([label, valor]) => {
      const texto = `${label}: ${valor}`;
      const largura = doc.getTextWidth(texto) + 6;
      if (x + largura > LARGURA_PAGINA - MARGEM) {
        x = MARGEM;
        y += alturaPill + 2;
      }
      doc.setFillColor(...COR_AZUL_100);
      doc.roundedRect(x, y - 5, largura, alturaPill, 3, 3, 'F');
      doc.setTextColor(...COR_AZUL_700);
      doc.text(texto, x + 3, y);
      x += largura + 3;
    });
    y += alturaPill + 6;
  }

  // Grade de estatísticas (cards, 3 por linha)
  const colunas = 3;
  const gap = 4;
  const larguraTile = (LARGURA_UTIL - gap * (colunas - 1)) / colunas;
  const alturaTile = 24;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COR_SLATE_900);
  doc.text('Estatísticas', MARGEM, y);
  y += 7;

  linhas.forEach((linha, i) => {
    const col = i % colunas;
    if (col === 0 && i > 0) y += alturaTile + gap;
    if (y + alturaTile > ALTURA_UTIL_PAGINA) {
      doc.addPage();
      y = 20;
    }
    const x = MARGEM + col * (larguraTile + gap);

    doc.setFillColor(...(linha.destaque ? COR_AZUL_100 : COR_SLATE_50));
    doc.roundedRect(x, y, larguraTile, alturaTile, 2, 2, 'F');
    if (linha.destaque) {
      doc.setDrawColor(...COR_AZUL_200);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, y, larguraTile, alturaTile, 2, 2, 'S');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...(linha.destaque ? COR_AZUL_700 : COR_SLATE_500));
    const linhasLabel = doc.splitTextToSize(linha.label, larguraTile - 6);
    doc.text(linhasLabel, x + 4, y + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...(linha.destaque ? COR_AZUL_900 : COR_SLATE_900));
    doc.text(linha.valor.toLocaleString('pt-BR'), x + 4, y + alturaTile - 5);
  });

  // Rodapé
  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p);
    doc.setDrawColor(...COR_SLATE_200);
    doc.setLineWidth(0.2);
    doc.line(MARGEM, 290, LARGURA_PAGINA - MARGEM, 290);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COR_SLATE_400);
    doc.text('IPM Maria', MARGEM, 294);
    doc.text(`Página ${p} de ${paginas}`, LARGURA_PAGINA - MARGEM, 294, { align: 'right' });
  }

  const url = URL.createObjectURL(doc.output('blob'));
  window.open(url, '_blank');
}

function StatTile({ label, valor, destaque }: { label: string; valor: number; destaque?: boolean }) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-xl px-3 py-3 ${
        destaque ? 'bg-primary-50 ring-1 ring-inset ring-primary-200' : 'bg-slate-50'
      }`}
    >
      <span className={`text-xs font-medium ${destaque ? 'text-primary-700' : 'text-slate-500'}`}>{label}</span>
      <span className={`text-2xl font-semibold ${destaque ? 'text-primary-900' : 'text-slate-900'}`}>
        {valor.toLocaleString('pt-BR')}
      </span>
    </div>
  );
}

export default function Dashboard({ viagens }: { viagens: ViagemIpm[] }) {
  const [aberto, setAberto] = useState(false);

  const anos = useMemo(
    () => [...new Set(viagens.map((v) => v.ano).filter((a): a is number => a != null))].sort((a, b) => b - a),
    [viagens],
  );
  const parceiros = useMemo(() => [...new Set(viagens.flatMap((v) => v.parceiros))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [viagens]);
  const coordenadores = useMemo(
    () => [...new Set(viagens.flatMap((v) => v.coordenadores))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [viagens],
  );
  const lideres = useMemo(
    () => [...new Set(viagens.flatMap((v) => v.lideres_saude))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [viagens],
  );
  const barcos = useMemo(() => opcoesUnicas(viagens, (v) => v.barco), [viagens]);
  const tiposTransporte = useMemo(() => opcoesUnicas(viagens, (v) => v.tipo_transporte), [viagens]);
  const tiposMissao = useMemo(() => opcoesUnicas(viagens, (v) => v.tipo_missao), [viagens]);

  const anoAtualStr = String(new Date().getFullYear());
  const [ano, setAno] = useState(anos.includes(Number(anoAtualStr)) ? anoAtualStr : TODOS);
  const [parceiro, setParceiro] = useState(TODOS);
  const [coordenador, setCoordenador] = useState(TODOS);
  const [lider, setLider] = useState(TODOS);
  const [barco, setBarco] = useState(TODOS);
  const [tipoTransporte, setTipoTransporte] = useState(TODOS);
  const [tipoMissao, setTipoMissao] = useState(TODOS);

  const filtradas = useMemo(
    () =>
      viagens.filter(
        (v) =>
          (ano === TODOS || String(v.ano) === ano) &&
          (parceiro === TODOS || v.parceiros.includes(parceiro)) &&
          (coordenador === TODOS || v.coordenadores.includes(coordenador)) &&
          (lider === TODOS || v.lideres_saude.includes(lider)) &&
          (barco === TODOS || v.barco === barco) &&
          (tipoTransporte === TODOS || v.tipo_transporte === tipoTransporte) &&
          (tipoMissao === TODOS || v.tipo_missao === tipoMissao),
      ),
    [viagens, ano, parceiro, coordenador, lider, barco, tipoTransporte, tipoMissao],
  );

  const stats = useMemo(() => {
    const soma = (campo: string) => filtradas.reduce((acc, v) => acc + (v.atendimentos[campo] ?? 0), 0);
    return {
      totalViagens: filtradas.length,
      totalDias: filtradas.reduce((acc, v) => acc + (v.dias_missao ?? 0), 0),
      medicos: soma('atendimentos_medicos'),
      odonto: soma('atendimentos_odontologicos'),
      enfermagem: soma('atendimentos_enfermagem'),
      decisoes: soma('decisoes_por_cristo'),
      batismos: soma('batismos'),
      comunidades: new Set(filtradas.flatMap((v) => v.comunidades)).size,
      parceirosEnvolvidos: new Set(filtradas.flatMap((v) => v.parceiros)).size,
      barcosUsados: new Set(filtradas.map((v) => v.barco).filter((b): b is string => Boolean(b))).size,
      voluntarios: new Set(filtradas.flatMap((v) => v.voluntarios.map((vol) => vol.nome))).size,
    };
  }, [filtradas]);

  const filtrosAtivos: [string, string][] = [
    ['Ano', ano],
    ['Parceiro', parceiro],
    ['Coordenador', coordenador],
    ['Líder de saúde', lider],
    ['Barco', barco],
    ['Tipo de transporte', tipoTransporte],
    ['Tipo de missão', tipoMissao],
  ].filter(([, valor]) => valor !== TODOS) as [string, string][];

  const linhasStats: LinhaStat[] = [
    { label: 'Viagens', valor: stats.totalViagens, destaque: true },
    { label: 'Atendimentos médicos', valor: stats.medicos },
    { label: 'Atendimentos odontológicos', valor: stats.odonto },
    { label: 'Atendimentos de enfermagem', valor: stats.enfermagem },
    { label: 'Comunidades visitadas', valor: stats.comunidades },
    { label: 'Parceiros envolvidos', valor: stats.parceirosEnvolvidos },
    { label: 'Voluntários envolvidos', valor: stats.voluntarios },
    { label: 'Barcos utilizados', valor: stats.barcosUsados },
    { label: 'Dias em missão', valor: stats.totalDias },
    { label: 'Decisões por Cristo', valor: stats.decisoes },
    { label: 'Batismos', valor: stats.batismos },
  ];

  return (
    <div className="mb-4 rounded-2xl border-2 border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div>
          <p className="text-lg font-bold text-primary-900">Estatísticas</p>
          <p className="text-sm text-slate-500">{filtradas.length} viagens no filtro atual</p>
        </div>
        <span className="shrink-0 text-xl text-slate-400" aria-hidden>
          {aberto ? '−' : '+'}
        </span>
      </button>

      {aberto && (
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="mb-5 flex flex-wrap gap-3">
            <Select label="Ano" value={ano} onChange={setAno} opcoes={anos.map(String)} todosLabel="Todos os anos" />
            <Select label="Parceiro" value={parceiro} onChange={setParceiro} opcoes={parceiros} />
            <Select label="Coordenador" value={coordenador} onChange={setCoordenador} opcoes={coordenadores} />
            <Select label="Líder de saúde" value={lider} onChange={setLider} opcoes={lideres} />
            <Select label="Barco" value={barco} onChange={setBarco} opcoes={barcos} />
            <Select
              label="Tipo de transporte"
              value={tipoTransporte}
              onChange={setTipoTransporte}
              opcoes={tiposTransporte}
            />
            <Select label="Tipo de missão" value={tipoMissao} onChange={setTipoMissao} opcoes={tiposMissao} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatTile label="Viagens" valor={stats.totalViagens} destaque />
            <StatTile label="Atendimentos médicos" valor={stats.medicos} />
            <StatTile label="Atendimentos odontológicos" valor={stats.odonto} />
            <StatTile label="Atendimentos de enfermagem" valor={stats.enfermagem} />
            <StatTile label="Comunidades visitadas" valor={stats.comunidades} />
            <StatTile label="Parceiros envolvidos" valor={stats.parceirosEnvolvidos} />
            <StatTile label="Voluntários envolvidos" valor={stats.voluntarios} />
            <StatTile label="Barcos utilizados" valor={stats.barcosUsados} />
            <StatTile label="Dias em missão" valor={stats.totalDias} />
            <StatTile label="Decisões por Cristo" valor={stats.decisoes} />
            <StatTile label="Batismos" valor={stats.batismos} />
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => abrirPdfEstatisticas(filtrosAtivos, linhasStats)}
              className="rounded-full bg-accent-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-accent-600"
            >
              Emitir PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
