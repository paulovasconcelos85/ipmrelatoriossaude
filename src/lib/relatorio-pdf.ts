import jsPDF from 'jspdf';
import { gruposAtendimentoComValores } from '@/lib/atendimentos-fields';
import { carregarImagemComoDataUrl } from '@/lib/carregar-imagem';
import { formatarDataPorExtenso, formatarPeriodo } from '@/lib/format';
import {
  ASSINATURAS_RELATORIO,
  ehViagemAmazon,
  montarParagrafoAbertura,
  VERSICULO_REFERENCIA,
  VERSICULO_TEXTO,
} from '@/lib/relatorio-texto';
import type { ViagemIpm } from '@/lib/viagens-ipm';

// Paleta alinhada com o resto do app (ver src/app/viagens/Dashboard.tsx).
const COR_AZUL_900: [number, number, number] = [30, 58, 138];
const COR_AZUL_700: [number, number, number] = [29, 78, 216];
const COR_SLATE_50: [number, number, number] = [248, 250, 252];
const COR_SLATE_200: [number, number, number] = [226, 232, 240];
const COR_SLATE_400: [number, number, number] = [148, 163, 184];
const COR_SLATE_500: [number, number, number] = [100, 116, 139];
const COR_SLATE_900: [number, number, number] = [15, 23, 42];
const COR_AZUL_200: [number, number, number] = [191, 219, 254];

const MARGEM = 14;
const LARGURA_PAGINA = 210;
const ALTURA_UTIL_PAGINA = 282;
const LARGURA_UTIL = LARGURA_PAGINA - MARGEM * 2;
const ALTURA_LOGO = 14;

function bufferParaBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binario = '';
  const tamanhoBloco = 0x8000;
  for (let i = 0; i < bytes.length; i += tamanhoBloco) {
    binario += String.fromCharCode(...bytes.subarray(i, i + tamanhoBloco));
  }
  return btoa(binario);
}

async function carregarFonteComoBase64(url: string): Promise<string> {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`Falha ao carregar fonte: ${url}`);
  return bufferParaBase64(await resposta.arrayBuffer());
}

/** Registra a família Public Sans (domínio público, ver public/fonts/PublicSans-LICENSE.txt) no lugar das fontes padrão do jsPDF. */
async function registrarFontePersonalizada(doc: jsPDF): Promise<void> {
  const [regular, bold, italic] = await Promise.all([
    carregarFonteComoBase64('/fonts/PublicSans-Regular.ttf'),
    carregarFonteComoBase64('/fonts/PublicSans-Bold.ttf'),
    carregarFonteComoBase64('/fonts/PublicSans-Italic.ttf'),
  ]);
  doc.addFileToVFS('PublicSans-Regular.ttf', regular);
  doc.addFont('PublicSans-Regular.ttf', 'PublicSans', 'normal');
  doc.addFileToVFS('PublicSans-Bold.ttf', bold);
  doc.addFont('PublicSans-Bold.ttf', 'PublicSans', 'bold');
  doc.addFileToVFS('PublicSans-Italic.ttf', italic);
  doc.addFont('PublicSans-Italic.ttf', 'PublicSans', 'italic');
  doc.setFont('PublicSans', 'normal');
}

function carregarDimensoesImagem(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Falha ao ler dimensões da imagem'));
    img.src = dataUrl;
  });
}

async function carregarLogoComProporcao(url: string): Promise<{ dataUrl: string; largura: number } | null> {
  try {
    const dataUrl = await carregarImagemComoDataUrl(url);
    const dimensoes = await carregarDimensoesImagem(dataUrl);
    return { dataUrl, largura: (ALTURA_LOGO * dimensoes.width) / dimensoes.height };
  } catch {
    return null;
  }
}

function novaPaginaSeNecessario(doc: jsPDF, y: number, alturaNecessaria: number): number {
  if (y + alturaNecessaria > ALTURA_UTIL_PAGINA) {
    doc.addPage();
    return 20;
  }
  return y;
}

function desenharTituloSecao(doc: jsPDF, titulo: string, y: number): number {
  doc.setFont('PublicSans', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COR_SLATE_900);
  doc.text(titulo, MARGEM, y);
  return y + 6;
}

export async function gerarRelatorioPdf(viagem: ViagemIpm) {
  const amazon = ehViagemAmazon(viagem);

  const [logoIpm, logoMissoes, logoAmazon, fotos] = await Promise.all([
    carregarLogoComProporcao('/logos/ipm.png'),
    carregarLogoComProporcao('/logos/ipm-missoes.png'),
    amazon ? carregarLogoComProporcao('/logos/amazon.png') : Promise.resolve(null),
    Promise.all(
      viagem.fotos.map(async (foto) => {
        try {
          const dataUrl = await carregarImagemComoDataUrl(foto.url);
          const dimensoes = await carregarDimensoesImagem(dataUrl).catch(() => null);
          return { ...foto, dataUrl, aspecto: dimensoes ? dimensoes.width / dimensoes.height : null };
        } catch {
          return { ...foto, dataUrl: null, aspecto: null };
        }
      }),
    ),
  ]);

  const doc = new jsPDF();
  await registrarFontePersonalizada(doc);

  // Cabeçalho: logos (fundo branco, para não conflitar com o fundo dos logos) + linha divisória.
  let xLogo = MARGEM;
  for (const logo of [logoIpm, logoMissoes, logoAmazon]) {
    if (!logo) continue;
    doc.addImage(logo.dataUrl, 'PNG', xLogo, 8, logo.largura, ALTURA_LOGO);
    xLogo += logo.largura + 6;
  }

  doc.setDrawColor(...COR_AZUL_200);
  doc.setLineWidth(0.6);
  doc.line(MARGEM, 26, LARGURA_PAGINA - MARGEM, 26);

  let y = 35;
  doc.setFont('PublicSans', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...COR_AZUL_900);
  doc.text('Relatório de Viagem Missionária', MARGEM, y);
  y += 7;

  const numero = viagem.numero ? `Viagem ${viagem.numero}` : null;
  const periodo = formatarPeriodo(viagem.data_saida, viagem.data_chegada);
  const subtitulo = [numero, `${periodo}${viagem.ano ? ` de ${viagem.ano}` : ''}`].filter(Boolean).join(' · ');
  doc.setFont('PublicSans', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COR_SLATE_500);
  doc.text(subtitulo, MARGEM, y);
  y += 10;

  const paragrafoAbertura = doc.splitTextToSize(montarParagrafoAbertura(viagem), LARGURA_UTIL);
  doc.setFont('PublicSans', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COR_SLATE_900);
  doc.text(paragrafoAbertura, MARGEM, y, { align: 'justify', maxWidth: LARGURA_UTIL });
  y += paragrafoAbertura.length * 5 + 4;

  // Dados da viagem (pares label/valor, mesmos campos de DetalhesViagem.tsx).
  const dados: [string, string][] = [];
  if (viagem.area) dados.push(['Área', viagem.area]);
  if (viagem.local) dados.push(['Local', viagem.local]);
  if (viagem.comunidades.length > 0) dados.push(['Comunidades visitadas', viagem.comunidades.join(', ')]);
  if (viagem.dias_missao != null) dados.push(['Dias em missão', String(viagem.dias_missao)]);
  if (viagem.tipo_transporte) dados.push(['Transporte', viagem.tipo_transporte]);
  if (viagem.coordenadores.length > 0) dados.push(['Coordenador(es)', viagem.coordenadores.join(', ')]);
  if (viagem.lideres_saude.length > 0) dados.push(['Líder(es) de saúde', viagem.lideres_saude.join(', ')]);
  if (viagem.parceirosComLocal.length > 0) dados.push(['Parceiros', viagem.parceirosComLocal.join(', ')]);

  y = desenharTituloSecao(doc, 'Dados da viagem', y);
  for (const [label, valor] of dados) {
    const linhasValor = doc.splitTextToSize(valor, LARGURA_UTIL - 45);
    const altura = Math.max(5, linhasValor.length * 4.5);
    y = novaPaginaSeNecessario(doc, y, altura);

    doc.setFont('PublicSans', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COR_SLATE_500);
    doc.text(label, MARGEM, y);

    doc.setFont('PublicSans', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COR_SLATE_900);
    doc.text(linhasValor, MARGEM + 42, y);
    y += altura + 1.5;
  }
  y += 3;

  // Observações
  if (viagem.observacoes) {
    y = novaPaginaSeNecessario(doc, y, 12);
    doc.setFillColor(...COR_SLATE_50);
    const linhasObs = doc.splitTextToSize(viagem.observacoes, LARGURA_UTIL - 8);
    const alturaCaixa = linhasObs.length * 4.5 + 6;
    y = novaPaginaSeNecessario(doc, y, alturaCaixa);
    doc.roundedRect(MARGEM, y, LARGURA_UTIL, alturaCaixa, 2, 2, 'F');
    doc.setFont('PublicSans', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(...COR_SLATE_500);
    doc.text(linhasObs, MARGEM + 4, y + 5.5);
    y += alturaCaixa + 5;
  }

  // Voluntários
  y = novaPaginaSeNecessario(doc, y, 12);
  y = desenharTituloSecao(doc, 'Voluntários', y);
  if (viagem.voluntarios.length > 0) {
    for (const v of viagem.voluntarios) {
      const texto = [v.nome, v.funcao ? `(${v.funcao})` : null, v.observacao ? `— ${v.observacao}` : null]
        .filter(Boolean)
        .join(' ');
      const linhas = doc.splitTextToSize(texto, LARGURA_UTIL);
      const altura = linhas.length * 4.2 + 0.6;
      y = novaPaginaSeNecessario(doc, y, altura);
      doc.setFont('PublicSans', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...COR_SLATE_900);
      doc.text(linhas, MARGEM, y);
      y += altura;
    }
  } else {
    doc.setFont('PublicSans', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(...COR_SLATE_400);
    doc.text('Ainda não registrados', MARGEM, y);
    y += 6;
  }
  y += 3;

  // Versículo de encerramento + assinaturas: tratados como um bloco só, para nunca serem
  // separados entre páginas (ex.: os nomes da Gestora e da Secretaria ficarem sozinhos numa
  // página nova caso a lista de voluntários ou outro dado cresça).
  const linhasVersiculo = doc.splitTextToSize(VERSICULO_TEXTO, LARGURA_UTIL - 20);
  const alturaVersiculo = linhasVersiculo.length * 5 + 9;

  const assinaturas = ASSINATURAS_RELATORIO;
  const alturaAssinaturas = 9 + assinaturas.length * 9.5;

  y = novaPaginaSeNecessario(doc, y, alturaVersiculo + alturaAssinaturas);

  doc.setFont('PublicSans', 'italic');
  doc.setFontSize(10.5);
  doc.setTextColor(...COR_AZUL_700);
  doc.text(linhasVersiculo, LARGURA_PAGINA / 2, y, { align: 'center' });
  y += linhasVersiculo.length * 5 + 2;
  doc.setFont('PublicSans', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COR_SLATE_500);
  doc.text(VERSICULO_REFERENCIA, LARGURA_PAGINA / 2, y, { align: 'center' });
  y += 6;

  doc.setFont('PublicSans', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COR_SLATE_900);
  doc.text(`Manaus, ${formatarDataPorExtenso(new Date())}`, MARGEM, y);
  y += 9;
  for (const [nome, cargo] of assinaturas) {
    doc.setFont('PublicSans', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COR_SLATE_900);
    doc.text(nome, MARGEM, y);
    y += 4.8;
    doc.setFont('PublicSans', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...COR_SLATE_500);
    doc.text(cargo, MARGEM, y);
    y += 7;
  }

  // Atendimentos — página própria (página 2).
  const grupos = gruposAtendimentoComValores(viagem);
  doc.addPage();
  y = 20;
  y = desenharTituloSecao(doc, 'Atendimentos', y);

  if (grupos.length > 0) {
    const ALTURA_FAIXA = 7.5;
    const ALTURA_LINHA = 6;

    for (const grupo of grupos) {
      const destaque = grupo.campos.find((c) => c.destaque);
      const linhas = grupo.campos.filter((c) => !c.destaque);
      const alturaGrupo = ALTURA_FAIXA + linhas.length * ALTURA_LINHA + 3;
      y = novaPaginaSeNecessario(doc, y, alturaGrupo);

      // Faixa com o nome do grupo (e o total, quando houver) — como nas tabelas dos relatórios em Word.
      doc.setFillColor(...COR_SLATE_200);
      doc.rect(MARGEM, y, LARGURA_UTIL, ALTURA_FAIXA, 'F');
      doc.setFont('PublicSans', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...COR_SLATE_900);
      doc.text(grupo.titulo.toUpperCase(), MARGEM + 3, y + 5.2);
      if (destaque) {
        doc.text(String(destaque.valor), MARGEM + LARGURA_UTIL - 3, y + 5.2, { align: 'right' });
      }
      y += ALTURA_FAIXA;

      linhas.forEach((campo, i) => {
        if (i % 2 === 1) {
          doc.setFillColor(...COR_SLATE_50);
          doc.rect(MARGEM, y, LARGURA_UTIL, ALTURA_LINHA, 'F');
        }
        doc.setFont('PublicSans', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(...COR_SLATE_500);
        doc.text(campo.label, MARGEM + 6, y + ALTURA_LINHA - 1.7);

        doc.setFont('PublicSans', 'bold');
        doc.setTextColor(...COR_SLATE_900);
        doc.text(String(campo.valor), MARGEM + LARGURA_UTIL - 3, y + ALTURA_LINHA - 1.7, { align: 'right' });
        y += ALTURA_LINHA;
      });
      y += 3;
    }
  } else {
    doc.setFont('PublicSans', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(...COR_SLATE_400);
    doc.text('Sem atendimentos registrados nesta viagem.', MARGEM, y);
    y += 8;
  }

  if (viagem.atendimentosObservacoes) {
    y = novaPaginaSeNecessario(doc, y, 12);
    const linhasObs = doc.splitTextToSize(viagem.atendimentosObservacoes, LARGURA_UTIL - 8);
    const alturaCaixa = linhasObs.length * 4.5 + 6;
    y = novaPaginaSeNecessario(doc, y, alturaCaixa);
    doc.setFillColor(255, 251, 235);
    doc.roundedRect(MARGEM, y, LARGURA_UTIL, alturaCaixa, 2, 2, 'F');
    doc.setFont('PublicSans', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(146, 64, 14);
    doc.text(linhasObs, MARGEM + 4, y + 5.5);
    y += alturaCaixa + 8;
  }

  // Fotos (anexo) — página própria (página 3).
  if (fotos.length > 0) {
    doc.addPage();
    y = 20;
    y = desenharTituloSecao(doc, 'Anexo — Fotos', y);

    // Cada foto mantém sua proporção original (retrato/paisagem), como num fotojornalismo,
    // em vez do recorte quadrado antigo — o aspecto é limitado para evitar retratos ou
    // panorâmicas extremas que desequilibrariam a linha.
    const colunas = 3;
    const gap = 4;
    const larguraTile = (LARGURA_UTIL - gap * (colunas - 1)) / colunas;
    const ASPECTO_PADRAO = 4 / 3;
    const ASPECTO_MIN = 0.62;
    const ASPECTO_MAX = 1.9;

    const fotosComLegenda = fotos.map((foto) => {
      const aspecto = Math.min(ASPECTO_MAX, Math.max(ASPECTO_MIN, foto.aspecto ?? ASPECTO_PADRAO));
      return {
        ...foto,
        alturaImagem: larguraTile / aspecto,
        legendaLinhas: foto.legenda ? (doc.splitTextToSize(foto.legenda, larguraTile) as string[]) : [],
      };
    });

    for (let i = 0; i < fotosComLegenda.length; i += colunas) {
      const linha = fotosComLegenda.slice(i, i + colunas);
      const alturaMaxImagem = Math.max(...linha.map((f) => f.alturaImagem));
      const alturaMaxLegenda = Math.max(...linha.map((f) => (f.legendaLinhas.length > 0 ? f.legendaLinhas.length * 4 + 3 : 0)));
      const alturaTile = alturaMaxImagem + alturaMaxLegenda;

      y = novaPaginaSeNecessario(doc, y, alturaTile);

      linha.forEach((foto, col) => {
        const x = MARGEM + col * (larguraTile + gap);

        if (foto.dataUrl) {
          try {
            doc.addImage(foto.dataUrl, x, y, larguraTile, foto.alturaImagem);
          } catch {
            doc.setFillColor(...COR_SLATE_50);
            doc.rect(x, y, larguraTile, foto.alturaImagem, 'F');
          }
        } else {
          doc.setFillColor(...COR_SLATE_50);
          doc.rect(x, y, larguraTile, foto.alturaImagem, 'F');
        }

        if (foto.legendaLinhas.length > 0) {
          doc.setFont('PublicSans', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(...COR_SLATE_500);
          doc.text(foto.legendaLinhas, x, y + foto.alturaImagem + 4);
        }
      });

      y += alturaTile + gap;
    }
    y += 4;
  }

  // Rodapé
  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p);
    doc.setDrawColor(...COR_SLATE_200);
    doc.setLineWidth(0.2);
    doc.line(MARGEM, 290, LARGURA_PAGINA - MARGEM, 290);
    doc.setFont('PublicSans', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COR_SLATE_400);
    doc.text('IPM Maria', MARGEM, 294);
    doc.text(`Página ${p} de ${paginas}`, LARGURA_PAGINA - MARGEM, 294, { align: 'right' });
  }

  const url = URL.createObjectURL(doc.output('blob'));
  window.open(url, '_blank');
}
