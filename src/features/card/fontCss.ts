/**
 * CSS das fontes do card, com os arquivos embutidos (data URI). O html-to-image não consegue ler a folha de estilo
 * do Google Fonts por causa do CORS, e sem isso a imagem exportada sairia com a fonte padrão do navegador.
 */
const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap';

let cached: Promise<string> | null = null;

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

async function build(): Promise<string> {
  const css = await (await fetch(FONTS_URL)).text();
  const urls = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]))];
  const data = await Promise.all(urls.map(async (u) => [u, await toDataUrl(await (await fetch(u)).blob())] as const));
  return data.reduce((out, [u, d]) => out.split(u).join(d), css);
}

/** Devolve o CSS embutido; se a rede falhar, string vazia (a imagem sai com a fonte padrão em vez de falhar). */
export function embeddedFontCss(): Promise<string> {
  cached ??= build().catch(() => {
    cached = null;
    return '';
  });
  return cached;
}
