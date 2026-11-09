/**
 * Link de um time: o projeto inteiro, comprimido (gzip) em base64url, no fragmento da URL (`/vault#time=…`).
 * O fragmento não vai para nenhum servidor. shortcut: gzip (o navegador não tem brotli), ~30% maior; trocar se o link ficar grande demais.
 */
import { parseProject, type RotationProject } from '../../engine';
import { newProjectId } from './persistence';

const KEY = 'time=';

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

const toB64 = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

export async function projectLink(project: RotationProject, origin: string): Promise<string> {
  const zipped = await pipe(new TextEncoder().encode(JSON.stringify(project)), new CompressionStream('gzip'));
  return `${origin}/vault#${KEY}${toB64(zipped)}`;
}

/** Aceita o link inteiro ou só o fragmento; devolve null se não houver time nele. */
export async function projectFromLink(text: string): Promise<RotationProject | null> {
  const i = text.indexOf(KEY);
  if (i < 0) return null;
  try {
    const json = new TextDecoder().decode(await pipe(fromB64(text.slice(i + KEY.length).trim()), new DecompressionStream('gzip')));
    return { ...parseProject(JSON.parse(json)), id: newProjectId() };
  } catch {
    throw new Error('O link está incompleto ou não é de um time do Astralys.');
  }
}
