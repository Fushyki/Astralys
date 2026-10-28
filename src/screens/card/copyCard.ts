/** Copia a imagem de um card (elemento `.pc`) para a área de transferência, no tamanho real do formato. */
import { toPng } from 'html-to-image';
import { embeddedFontCss } from '../../features/card/fontCss';
import { POSTER_SIZE, type PosterFormat } from './PosterCard';

export async function copyCardImage(el: HTMLElement, format: PosterFormat): Promise<void> {
  const { w, h } = POSTER_SIZE[format];
  const fontEmbedCSS = await embeddedFontCss();
  const url = await toPng(el, { width: w, height: h, pixelRatio: 1, cacheBust: true, fontEmbedCSS, style: { transform: 'none', margin: '0' } });
  const blob = await (await fetch(url)).blob();
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}
