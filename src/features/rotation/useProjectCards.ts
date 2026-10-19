/**
 * Cards (o mesmo modelo da tela Card) de cada projeto do Vault. Calculados na thread principal, um projeto por vez e
 * em intervalos curtos, para a lista aparecer na hora e os cards chegarem em seguida.
 */
import { useEffect, useState } from 'react';
import { analyzeProject, resolveProject } from '../../engine';
import { buildCardModel, hitTypeLookup, type CardModel } from '../card/cardModel';
import type { LoadedData } from './data';
import { loadProject } from './persistence';

export type CardsMap = Record<string, CardModel | 'error'>;

export function useProjectCards(ids: string[], data: LoadedData | undefined, version: string): CardsMap {
  const [cards, setCards] = useState<CardsMap>({});
  const key = ids.join('|');

  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    const queue = key ? key.split('|') : [];
    const next = () => {
      const id = queue.shift();
      if (id === undefined || cancelled) return;
      let value: CardModel | 'error' = 'error';
      try {
        const p = loadProject(id);
        if (p) {
          const r = resolveProject(p, data.game, data.effects);
          const bundle = analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient });
          value = buildCardModel(p, bundle, data.game.characters, hitTypeLookup(r));
        }
      } catch {
        value = 'error';
      }
      if (!cancelled) setCards((s) => ({ ...s, [id]: value }));
      setTimeout(next, 0);
    };
    setTimeout(next, 0);
    return () => {
      cancelled = true;
    };
  }, [key, data, version]);

  return cards;
}
