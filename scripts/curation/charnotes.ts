/**
 * Notas das passivas e constelações que NÃO viram buff: "utility" = só energia, cura, recarga, escudo, estamina ou
 * mobilidade (nada a calcular em dano) e "partial" = mexe em dano por um golpe extra ou mecânica que o motor ainda não
 * modela. A interface mostra a nota no lugar de "sem efeito".
 */
import type { CharacterNotes } from './characters';
import { NOTES_1 } from './charnotes1';
import { NOTES_2 } from './charnotes2';
import { NOTES_3 } from './charnotes3';
import { NOTES_4 } from './charnotes4';
import { NOTES_5 } from './charnotes5';
import { NOTES_6 } from './charnotes6';

export const CHARACTER_NOTES: CharacterNotes = {};
for (const batch of [NOTES_1, NOTES_2, NOTES_3, NOTES_4, NOTES_5, NOTES_6]) {
  for (const [name, list] of Object.entries(batch)) CHARACTER_NOTES[name] = { ...(CHARACTER_NOTES[name] ?? {}), ...list };
}
