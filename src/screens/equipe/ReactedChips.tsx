import type { Element } from '../../data/schema';
import { elementColor } from '../../design/elements';

export const REACT_ELEMENTS: Element[] = ['Pyro', 'Hydro', 'Electro', 'Cryo', 'Dendro', 'Anemo', 'Geo'];

/** Escolha dos elementos com que o dono do set reage em campo (Scroll of the Hero of Cinder City, Viridescent Venerer); vale mais de um. */
export function ReactedChips({ own, choices, els, onChange }: { own: Element; choices?: Element[]; els: Element[]; onChange: (next: Element[]) => void }) {
  return (
    <span className="bc-react" role="group" aria-label="Elementos da reação">
      {(choices ?? REACT_ELEMENTS).filter((e) => e !== own).map((e) => {
        const on = els.includes(e);
        return (
          <button key={e} type="button" aria-pressed={on} style={{ ['--c' as string]: elementColor(e) }} onClick={() => onChange(on ? els.filter((x) => x !== e) : [...els, e])}>{e}</button>
        );
      })}
    </span>
  );
}
