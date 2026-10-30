/**
 * Lotes da Fase 5 (um arquivo por grupo de personagens). Cada lote SOBREPÕE os lotes antigos pelo id do buff ou do golpe extra:
 * mesmo id substitui, id novo entra, e `remove` tira ids antigos errados. Notas: mesmo `src` substitui, `null` apaga.
 */
import type { BuffCuration, NoteCuration, ProcCuration, Src } from '../characters';
import type { InfoCuration } from '../piloto-personagens';

export interface Lote {
  buffs?: Record<string, BuffCuration[]>;
  procs?: Record<string, ProcCuration[]>;
  notes?: Record<string, Partial<Record<Src, NoteCuration | null>>>;
  infos?: Record<string, InfoCuration[]>;
  /** Ids de buffs ou golpes extras antigos a tirar (ex.: efeito que estava errado e foi refeito com outro id). */
  remove?: Record<string, string[]>;
}

export const LOTES: Lote[] = [];
