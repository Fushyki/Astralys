/** Escolher o set de artefatos: grade de sets com imagem e o bônus de 2 peças; 4 peças, 2 + 2 ou só 2 peças. */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ArtifactSet } from '../../data/schema';
import { cleanText, pieceIconUrl } from '../../design/images';
import { EFFECT_STATUS_LABEL, type EffectStatus } from '../../features/rotation/teamInfo';

export interface SetChoice {
  primarySet?: string;
  secondarySet?: string;
  fourPiece?: boolean;
}

function Icon({ set }: { set: ArtifactSet }) {
  const [failed, setFailed] = useState(false);
  return failed ? <b className="ph" aria-hidden="true">◆</b> : <img src={pieceIconUrl(set.id, 'flower')} alt="" loading="lazy" crossOrigin="anonymous" onError={() => setFailed(true)} />;
}

type Mode = 'four' | 'two-two';

export function SetPickerDialog({
  sets,
  current,
  status,
  onPick,
  onClose,
}: {
  sets: ArtifactSet[];
  current: SetChoice;
  /** Estado do efeito de cada set: completo, parcial, sem efeito no dano ou sem cadastro. */
  status: (name: string) => EffectStatus;
  onPick: (choice: SetChoice) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<Mode>(current.secondarySet ? 'two-two' : 'four');
  const [first, setFirst] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sets
      .filter((s) => s.rarity >= 4 && (!q || s.name.toLowerCase().includes(q) || s.namePt.toLowerCase().includes(q)))
      .sort((a, b) => b.rarity - a.rarity || b.id - a.id);
  }, [sets, query]);

  const choose = (name: string) => {
    if (mode === 'four') {
      onPick({ primarySet: name });
      return;
    }
    if (!first) {
      setFirst(name);
      return;
    }
    if (first === name) {
      setFirst(null);
      return;
    }
    onPick({ primarySet: first, secondarySet: name });
  };

  return (
    <div className="dz-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dz-dialog wide" role="dialog" aria-modal="true" aria-label="Escolher o set de artefatos">
        <header>
          <h2 className="h2">Set de artefatos</h2>
          <button type="button" className="dz-btn sm" onClick={onClose}>Fechar</button>
        </header>
        <div className="tools">
          <input ref={searchRef} className="dz-input" type="search" placeholder="Nome do set" aria-label="Buscar set" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="dz-seg" role="group" aria-label="Combinação de peças">
            <button type="button" aria-pressed={mode === 'four'} onClick={() => { setMode('four'); setFirst(null); }}>4 peças</button>
            <button type="button" aria-pressed={mode === 'two-two'} onClick={() => setMode('two-two')}>2 + 2 peças</button>
          </div>
          <div className="row-acts">
            {mode === 'two-two' && <span className="muted small">{first ? `1º set: ${first}. Escolha o 2º.` : 'Escolha dois sets diferentes.'}</span>}
            <button type="button" className="dz-btn sm" onClick={() => onPick({})}>Sem set</button>
            {mode === 'two-two' && first && <button type="button" className="dz-btn sm" onClick={() => onPick({ primarySet: first, fourPiece: false })}>Só 2 peças de {first}</button>}
          </div>
        </div>
        <div className="grid sets">
          {list.length === 0 && <p className="note">Nenhum set encontrado.</p>}
          {list.map((s) => {
            const marked = s.name === current.primarySet || s.name === current.secondarySet;
            return (
              <button key={s.id} type="button" className="scard" data-rarity={s.rarity} data-current={marked} data-first={first === s.name} onClick={() => choose(s.name)}>
                <span className="art"><Icon set={s} /></span>
                <span className="n">{s.name}{s.namePt && s.namePt !== s.name ? <small>{s.namePt}</small> : null}</span>
                <span className="b">{s.bonuses.twoPiece ? <><b>2 peças</b> {cleanText(s.bonuses.twoPiece.descriptionPt ?? s.bonuses.twoPiece.description)}</> : 'Sem bônus de 2 peças'}</span>
                <span className="tags">
                  {marked && <span className="dz-chip ok">Em uso</span>}
                  {first === s.name && <span className="dz-chip">1º set</span>}
                  {status(s.name) !== 'full' && <span className={`dz-chip ${status(s.name) === 'none' ? '' : 'warn'}`} title={EFFECT_STATUS_LABEL[status(s.name)]}>{status(s.name) === 'none' ? 'só energia/cura' : status(s.name) === 'partial' ? 'parcial' : 'sem efeito'}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
