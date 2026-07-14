import {
  AlignmentType,
  BorderStyle,
  convertMillimetersToTwip,
  Document,
  Footer,
  Header,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  VerticalAlign,
  WidthType,
  type IBorderOptions,
} from 'docx';
import { gruposAtendimentoComValores } from '@/lib/atendimentos-fields';
import { formatarDataPorExtenso, formatarPeriodo } from '@/lib/format';
import {
  ASSINATURAS_RELATORIO,
  ehViagemAmazon,
  montarParagrafoAbertura,
  VERSICULO_REFERENCIA,
  VERSICULO_TEXTO,
} from '@/lib/relatorio-texto';
import type { ViagemIpm } from '@/lib/viagens-ipm';

// Paleta alinhada com relatorio-pdf.ts (mesmas cores, em hexadecimal).
const COR_AZUL_900 = '1E3A8A';
const COR_AZUL_700 = '1D4ED8';
const COR_SLATE_50 = 'F8FAFC';
const COR_SLATE_200 = 'E2E8F0';
const COR_SLATE_400 = '94A3B8';
const COR_SLATE_500 = '64748B';
const COR_SLATE_900 = '0F172A';

const MARGEM_MM = 14;
const LARGURA_PAGINA_MM = 210;
const ALTURA_PAGINA_MM = 297;
const LARGURA_UTIL_MM = LARGURA_PAGINA_MM - MARGEM_MM * 2;
const LARGURA_UTIL_TWIPS = convertMillimetersToTwip(LARGURA_UTIL_MM);
const ALTURA_LOGO_MM = 12;

const SEM_BORDA: IBorderOptions = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const BORDAS_TABELA_INVISIVEL = {
  top: SEM_BORDA,
  bottom: SEM_BORDA,
  left: SEM_BORDA,
  right: SEM_BORDA,
  insideHorizontal: SEM_BORDA,
  insideVertical: SEM_BORDA,
};
const MARGEM_CELULA = {
  top: convertMillimetersToTwip(1),
  bottom: convertMillimetersToTwip(1),
  left: convertMillimetersToTwip(1.5),
  right: convertMillimetersToTwip(1.5),
};

function mmParaPx(mm: number): number {
  return Math.round((mm * 96) / 25.4);
}

type TipoImagem = 'jpg' | 'png' | 'gif' | 'bmp';

function inferirTipoImagem(url: string): TipoImagem {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'png';
  if (ext === 'gif') return 'gif';
  if (ext === 'bmp') return 'bmp';
  return 'jpg';
}

/** Baixa a imagem como bytes (para o ImageRun) e lê a proporção natural (para não distorcer). */
async function carregarImagemBinaria(url: string): Promise<{ bytes: ArrayBuffer; aspecto: number } | null> {
  try {
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error(`Falha ao carregar imagem: ${url}`);
    const blob = await resposta.blob();
    const bytes = await blob.arrayBuffer();
    const objectUrl = URL.createObjectURL(blob);
    try {
      const dimensoes = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => reject(new Error(`Falha ao ler dimensões da imagem: ${url}`));
        img.src = objectUrl;
      });
      return { bytes, aspecto: dimensoes.width / dimensoes.height };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return null;
  }
}

function textoNormal(texto: string, size = 20, color = COR_SLATE_900) {
  return new TextRun({ text: texto, size, color });
}

function tituloSecao(texto: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: texto, bold: true, size: 22, color: COR_SLATE_900 })],
    spacing: { before: 200, after: 120 },
  });
}

/** Tabela sem bordas para pares label/valor (Dados da viagem), como no PDF. */
function tabelaLabelValor(linhas: [string, string][]): Table {
  const larguraLabel = convertMillimetersToTwip(42);
  return new Table({
    width: { size: LARGURA_UTIL_TWIPS, type: WidthType.DXA },
    columnWidths: [larguraLabel, LARGURA_UTIL_TWIPS - larguraLabel],
    borders: BORDAS_TABELA_INVISIVEL,
    rows: linhas.map(
      ([label, valor]) =>
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              width: { size: larguraLabel, type: WidthType.DXA },
              margins: MARGEM_CELULA,
              children: [new Paragraph({ children: [textoNormal(label, 18, COR_SLATE_500)] })],
            }),
            new TableCell({
              margins: MARGEM_CELULA,
              children: [new Paragraph({ children: [textoNormal(valor)] })],
            }),
          ],
        }),
    ),
  });
}

/** Caixa com fundo cinza (parágrafo dentro de uma tabela de 1 célula, para simular um bloco destacado). */
function caixaDestaque(texto: string, corFundo: string, corTexto: string): Table {
  return new Table({
    width: { size: LARGURA_UTIL_TWIPS, type: WidthType.DXA },
    borders: BORDAS_TABELA_INVISIVEL,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: corFundo, type: ShadingType.CLEAR },
            margins: {
              top: convertMillimetersToTwip(2),
              bottom: convertMillimetersToTwip(2),
              left: convertMillimetersToTwip(2.5),
              right: convertMillimetersToTwip(2.5),
            },
            children: [new Paragraph({ children: [new TextRun({ text: texto, italics: true, size: 19, color: corTexto })] })],
          }),
        ],
      }),
    ],
  });
}

async function montarCabecalho(amazon: boolean): Promise<Header> {
  const urls = ['/logos/ipm.png', '/logos/ipm-missoes.png', ...(amazon ? ['/logos/amazon.png'] : [])];
  const carregadas = await Promise.all(urls.map((url) => carregarImagemBinaria(url)));
  const alturaPx = mmParaPx(ALTURA_LOGO_MM);

  const runs = carregadas.flatMap((img, i) => {
    if (!img) return [];
    const largura = Math.round(alturaPx * img.aspecto);
    return [
      new ImageRun({
        type: inferirTipoImagem(urls[i]),
        data: img.bytes,
        transformation: { width: largura, height: alturaPx },
      }),
    ];
  });

  return new Header({
    children: [
      new Paragraph({
        children: runs,
        spacing: { after: 120 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'BFDBFE' } },
      }),
    ],
  });
}

function montarRodape(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: COR_SLATE_200 } },
        tabStops: [{ type: TabStopType.RIGHT, position: LARGURA_UTIL_TWIPS }],
        children: [
          new TextRun({ text: 'IPM Maria', size: 16, color: COR_SLATE_400 }),
          new TextRun({ text: '\t' }),
          new TextRun({ children: ['Página ', PageNumber.CURRENT, ' de ', PageNumber.TOTAL_PAGES], size: 16, color: COR_SLATE_400 }),
        ],
      }),
    ],
  });
}

function montarSecaoAtendimentos(viagem: ViagemIpm): (Paragraph | Table)[] {
  const grupos = gruposAtendimentoComValores(viagem);
  const blocos: (Paragraph | Table)[] = [
    new Paragraph({
      pageBreakBefore: true,
      children: [new TextRun({ text: 'Atendimentos', bold: true, size: 22, color: COR_SLATE_900 })],
      spacing: { after: 160 },
    }),
  ];

  if (grupos.length === 0) {
    blocos.push(
      new Paragraph({
        children: [new TextRun({ text: 'Sem atendimentos registrados nesta viagem.', italics: true, size: 19, color: COR_SLATE_400 })],
      }),
    );
    return blocos;
  }

  const larguraValor = convertMillimetersToTwip(28);
  const larguraLabel = LARGURA_UTIL_TWIPS - larguraValor;

  for (const grupo of grupos) {
    const destaque = grupo.campos.find((c) => c.destaque);
    const linhas = grupo.campos.filter((c) => !c.destaque);

    const linhasTabela = [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: larguraLabel, type: WidthType.DXA },
            shading: { fill: COR_SLATE_200, type: ShadingType.CLEAR },
            margins: MARGEM_CELULA,
            children: [new Paragraph({ children: [new TextRun({ text: grupo.titulo.toUpperCase(), bold: true, size: 20, color: COR_SLATE_900 })] })],
          }),
          new TableCell({
            width: { size: larguraValor, type: WidthType.DXA },
            shading: { fill: COR_SLATE_200, type: ShadingType.CLEAR },
            margins: MARGEM_CELULA,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: destaque ? [new TextRun({ text: String(destaque.valor), bold: true, size: 21, color: COR_SLATE_900 })] : [],
              }),
            ],
          }),
        ],
      }),
      ...linhas.map(
        (campo, i) =>
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                width: { size: larguraLabel, type: WidthType.DXA },
                shading: i % 2 === 1 ? { fill: COR_SLATE_50, type: ShadingType.CLEAR } : undefined,
                margins: MARGEM_CELULA,
                children: [new Paragraph({ children: [textoNormal(campo.label, 19, COR_SLATE_500)] })],
              }),
              new TableCell({
                width: { size: larguraValor, type: WidthType.DXA },
                shading: i % 2 === 1 ? { fill: COR_SLATE_50, type: ShadingType.CLEAR } : undefined,
                margins: MARGEM_CELULA,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: String(campo.valor), bold: true, size: 19, color: COR_SLATE_900 })],
                  }),
                ],
              }),
            ],
          }),
      ),
    ];

    blocos.push(
      new Table({
        width: { size: LARGURA_UTIL_TWIPS, type: WidthType.DXA },
        columnWidths: [larguraLabel, larguraValor],
        borders: BORDAS_TABELA_INVISIVEL,
        rows: linhasTabela,
      }),
      new Paragraph({ spacing: { after: 160 } }),
    );
  }

  if (viagem.atendimentosObservacoes) {
    blocos.push(caixaDestaque(viagem.atendimentosObservacoes, 'FFFBEB', '92400E'), new Paragraph({ spacing: { after: 80 } }));
  }

  return blocos;
}

async function montarSecaoFotos(viagem: ViagemIpm): Promise<(Paragraph | Table)[]> {
  if (viagem.fotos.length === 0) return [];

  const ASPECTO_MIN = 0.62;
  const ASPECTO_MAX = 1.9;
  const colunas = 3;
  const larguraColunaTwips = Math.floor(LARGURA_UTIL_TWIPS / colunas);
  const larguraColunaMm = LARGURA_UTIL_MM / colunas;
  const larguraImagemMm = larguraColunaMm - 4; // respiro nas margens da célula
  const larguraImagemPx = mmParaPx(larguraImagemMm);

  const fotosCarregadas = await Promise.all(
    viagem.fotos.map(async (foto) => {
      const imagem = await carregarImagemBinaria(foto.url);
      return { foto, imagem };
    }),
  );

  const linhasTabela: TableRow[] = [];
  for (let i = 0; i < fotosCarregadas.length; i += colunas) {
    const linha = fotosCarregadas.slice(i, i + colunas);
    const celulas = linha.map(({ foto, imagem }) => {
      const filhos: Paragraph[] = [];
      if (imagem) {
        const aspecto = Math.min(ASPECTO_MAX, Math.max(ASPECTO_MIN, imagem.aspecto));
        filhos.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                type: inferirTipoImagem(foto.url),
                data: imagem.bytes,
                transformation: { width: larguraImagemPx, height: Math.round(larguraImagemPx / aspecto) },
              }),
            ],
          }),
        );
      } else {
        filhos.push(new Paragraph({}));
      }
      if (foto.legenda) {
        filhos.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: foto.legenda, size: 15, color: COR_SLATE_500 })],
          }),
        );
      }
      return new TableCell({
        width: { size: larguraColunaTwips, type: WidthType.DXA },
        margins: MARGEM_CELULA,
        verticalAlign: VerticalAlign.TOP,
        children: filhos,
      });
    });

    while (celulas.length < colunas) {
      celulas.push(new TableCell({ width: { size: larguraColunaTwips, type: WidthType.DXA }, children: [new Paragraph({})] }));
    }

    linhasTabela.push(new TableRow({ children: celulas }));
  }

  return [
    new Paragraph({
      pageBreakBefore: true,
      children: [new TextRun({ text: 'Anexo — Fotos', bold: true, size: 22, color: COR_SLATE_900 })],
      spacing: { after: 160 },
    }),
    new Table({
      width: { size: LARGURA_UTIL_TWIPS, type: WidthType.DXA },
      borders: BORDAS_TABELA_INVISIVEL,
      rows: linhasTabela,
    }),
  ];
}

export async function gerarRelatorioDocx(viagem: ViagemIpm): Promise<void> {
  const amazon = ehViagemAmazon(viagem);
  const header = await montarCabecalho(amazon);
  const footer = montarRodape();

  const numero = viagem.numero ? `Viagem ${viagem.numero}` : null;
  const periodo = formatarPeriodo(viagem.data_saida, viagem.data_chegada);
  const subtitulo = [numero, `${periodo}${viagem.ano ? ` de ${viagem.ano}` : ''}`].filter(Boolean).join(' · ');

  const dados: [string, string][] = [];
  if (viagem.area) dados.push(['Área', viagem.area]);
  if (viagem.local) dados.push(['Local', viagem.local]);
  if (viagem.comunidades.length > 0) dados.push(['Comunidades visitadas', viagem.comunidades.join(', ')]);
  if (viagem.dias_missao != null) dados.push(['Dias em missão', String(viagem.dias_missao)]);
  if (viagem.tipo_transporte) dados.push(['Transporte', viagem.tipo_transporte]);
  if (viagem.coordenador) dados.push(['Coordenador', viagem.coordenador]);
  if (viagem.lider_saude) dados.push(['Líder de saúde', viagem.lider_saude]);
  if (viagem.parceiros.length > 0) dados.push(['Parceiros', viagem.parceiros.join(', ')]);

  const corpo: (Paragraph | Table)[] = [
    new Paragraph({
      children: [new TextRun({ text: 'Relatório de Viagem Missionária', bold: true, size: 30, color: COR_AZUL_900 })],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [textoNormal(subtitulo, 20, COR_SLATE_500)],
      spacing: { after: 200 },
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      children: [textoNormal(montarParagrafoAbertura(viagem))],
      spacing: { after: 200 },
    }),
    tituloSecao('Dados da viagem'),
    tabelaLabelValor(dados),
  ];

  if (viagem.observacoes) {
    corpo.push(new Paragraph({ spacing: { after: 120 } }), caixaDestaque(viagem.observacoes, COR_SLATE_50, COR_SLATE_500));
  }

  corpo.push(tituloSecao('Voluntários'));
  if (viagem.voluntarios.length > 0) {
    for (const v of viagem.voluntarios) {
      const texto = [v.nome, v.funcao ? `(${v.funcao})` : null, v.observacao ? `— ${v.observacao}` : null]
        .filter(Boolean)
        .join(' ');
      corpo.push(new Paragraph({ children: [textoNormal(texto, 19)], spacing: { after: 40 } }));
    }
  } else {
    corpo.push(
      new Paragraph({ children: [new TextRun({ text: 'Ainda não registrados', italics: true, size: 19, color: COR_SLATE_400 })] }),
    );
  }

  // Versículo + assinaturas: parágrafos encadeados com keepNext para nunca serem separados
  // por uma quebra de página (ex.: o nome da Gestora ficar sozinho numa página nova).
  corpo.push(
    new Paragraph({
      keepNext: true,
      keepLines: true,
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 40 },
      children: [new TextRun({ text: VERSICULO_TEXTO, italics: true, size: 21, color: COR_AZUL_700 })],
    }),
    new Paragraph({
      keepNext: true,
      keepLines: true,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: VERSICULO_REFERENCIA, size: 18, color: COR_SLATE_500 })],
    }),
    new Paragraph({
      keepNext: true,
      keepLines: true,
      spacing: { after: 200 },
      children: [textoNormal(`Manaus, ${formatarDataPorExtenso(new Date())}`)],
    }),
  );
  ASSINATURAS_RELATORIO.forEach(([nome, cargo], i) => {
    const ultimo = i === ASSINATURAS_RELATORIO.length - 1;
    corpo.push(
      new Paragraph({ keepNext: true, keepLines: true, children: [textoNormal(nome)] }),
      new Paragraph({
        keepNext: !ultimo,
        keepLines: true,
        spacing: { after: 160 },
        children: [new TextRun({ text: cargo, bold: true, size: 19, color: COR_SLATE_500 })],
      }),
    );
  });

  corpo.push(...montarSecaoAtendimentos(viagem));
  corpo.push(...(await montarSecaoFotos(viagem)));

  const documento = new Document({
    sections: [
      {
        headers: { default: header },
        footers: { default: footer },
        properties: {
          page: {
            size: { width: convertMillimetersToTwip(LARGURA_PAGINA_MM), height: convertMillimetersToTwip(ALTURA_PAGINA_MM) },
            margin: {
              top: convertMillimetersToTwip(MARGEM_MM + 8),
              bottom: convertMillimetersToTwip(MARGEM_MM + 6),
              left: convertMillimetersToTwip(MARGEM_MM),
              right: convertMillimetersToTwip(MARGEM_MM),
            },
          },
        },
        children: corpo,
      },
    ],
  });

  const blob = await Packer.toBlob(documento);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const numeroArquivo = viagem.numero ?? viagem.id;
  link.download = `relatorio-viagem-${numeroArquivo}.docx`;
  link.click();
  URL.revokeObjectURL(url);
}
