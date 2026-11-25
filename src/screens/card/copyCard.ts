/** Copia (ou baixa) a imagem de um card (elemento `.pc`) no tamanho real do formato. */
import { embeddedFontCss } from '../../features/card/fontCss';
import { POSTER_SIZE, type PosterFormat } from './PosterCard';

async function cardPng(el: HTMLElement, format: PosterFormat): Promise<string> {
  const { w, h } = POSTER_SIZE[format];
  const [{ toPng }, fontEmbedCSS] = await Promise.all([import('html-to-image'), embeddedFontCss()]);
  return toPng(el, { width: w, height: h, pixelRatio: 1, cacheBust: true, fontEmbedCSS, style: { transform: 'none', margin: '0' } });
}

/** Por `blob:`: no WebKit 15.4 um link `data:` não gera arquivo. */
const download = async (png: string, name: string) => {
  const url = URL.createObjectURL(await (await fetch(png)).blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

export const DOWNLOADED_INSTEAD = 'Este navegador não deixou copiar a imagem; ela foi baixada.';

/** Devolve false quando não deu para copiar (sem `ClipboardItem` ou sem permissão) e a imagem foi baixada. */
export async function copyCardImage(el: HTMLElement, format: PosterFormat, name = 'astralys-card'): Promise<boolean> {
  const png = await cardPng(el, format);
  try {
    const blob = await (await fetch(png)).blob();
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    return true;
  } catch {
    await download(png, name);
    return false;
  }
}

export async function saveCardImage(el: HTMLElement, format: PosterFormat, name: string): Promise<void> {
  await download(await cardPng(el, format), name);
}
