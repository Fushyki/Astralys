/** Copia (ou baixa) a imagem de um card (elemento `.pc`) no tamanho real do formato. */
import { toPng } from 'html-to-image';
import { embeddedFontCss } from '../../features/card/fontCss';
import { POSTER_SIZE, type PosterFormat } from './PosterCard';

async function cardPng(el: HTMLElement, format: PosterFormat): Promise<string> {
  const { w, h } = POSTER_SIZE[format];
  const fontEmbedCSS = await embeddedFontCss();
  return toPng(el, { width: w, height: h, pixelRatio: 1, cacheBust: true, fontEmbedCSS, style: { transform: 'none', margin: '0' } });
}

export async function copyCardImage(el: HTMLElement, format: PosterFormat): Promise<void> {
  const blob = await (await fetch(await cardPng(el, format))).blob();
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}

export async function saveCardImage(el: HTMLElement, format: PosterFormat, name: string): Promise<void> {
  const a = document.createElement('a');
  a.href = await cardPng(el, format);
  a.download = `${name}.png`;
  a.click();
}
