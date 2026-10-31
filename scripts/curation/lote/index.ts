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

import { LOTE as PYRO_A } from './pyro-a';
import { LOTE as PYRO_B } from './pyro-b';
import { LOTE as PYRO_C } from './pyro-c';

import { LOTE as CRYO_A } from './cryo-a';
import { LOTE as CRYO_B } from './cryo-b';
import { LOTE as CRYO_C } from './cryo-c';
import { LOTE as ELECTRO_B } from './electro-b';
import { LOTE as MISTO_D } from './misto-d';
import { LOTE as ELECTRO_C } from './electro-c';

import { LOTE as ANEMO_A } from './anemo-a';
import { LOTE as ANEMO_B } from './anemo-b';
import { LOTE as HYDRO_A } from './hydro-a';
import { LOTE as HYDRO_C } from './hydro-c';
import { LOTE as GEO_A } from './geo-a';

export const LOTES: Lote[] = [PYRO_A, PYRO_B, PYRO_C, CRYO_A, CRYO_B, CRYO_C, ELECTRO_B, MISTO_D, ELECTRO_C, ANEMO_A, ANEMO_B, HYDRO_A, HYDRO_C, GEO_A];
