/**
 * Persistência local dos projetos (localStorage). Tudo é validado com Zod na leitura, então um dado
 * corrompido ou de outra versão é ignorado em vez de quebrar a tela. O armazenamento pode falhar
 * (modo privado, cota cheia): todas as funções toleram isso.
 */
import { parseProject, type RotationProject } from '../../engine';
import sample from './sample/mavuika-iansan.json';

export const SAMPLE_ID = 'exemplo';
const KEY = (id: string) => `astralys:projeto:${id}`;

export const sampleProject = (): RotationProject => parseProject(sample);

export function saveProject(project: RotationProject): boolean {
  try {
    localStorage.setItem(KEY(project.id), JSON.stringify(project));
    return true;
  } catch {
    return false;
  }
}

export function loadStoredProject(id: string): RotationProject | null {
  try {
    const raw = localStorage.getItem(KEY(id));
    return raw ? parseProject(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function deleteStoredProject(id: string): void {
  try {
    localStorage.removeItem(KEY(id));
  } catch {
    /* sem armazenamento: nada a apagar */
  }
}

/** Projeto salvo com esse id; para o exemplo, cai no projeto de exemplo; senão null. */
export function loadProject(id: string): RotationProject | null {
  return loadStoredProject(id) ?? (id === SAMPLE_ID ? sampleProject() : null);
}
