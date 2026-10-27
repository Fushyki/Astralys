/** Escolher um artefato do inventário para uma posição do personagem (como no Genshin Optimizer). */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { pieceIconUrl } from '../../design/images';
import { mainStatOf, pieceLevel, type RealPiece, type SlotKey } from '../../engine';
import type { ArtifactSet } from '../../data/schema';
import { norm, type Good } from '../../features/good/goodImport';
import { MAIN_LABEL, SUB_LABEL, characterDisplayName, formatMain, formatSub } from '../../features/good/labels';

const SLOT_LABEL: Record<SlotKey, string> = { flower: 'Flor', plume: 'Pluma', sands: 'Areia', goblet: 'Cálice', circlet: 'Tiara' };
const PAGE = 36;

type Sort = 'padrao' | 'critico' | 'nivel';

const critValue = (p: RealPiece) => p.substats.reduce((n, s) => n + (s.key === 'critRate_' ? s.value * 2 : s.key === 'critDMG_' ? s.value : 0), 0);

function Tile({ p, set, mine, current, onClick }: { p: RealPiece; set?: ArtifactSet; mine: boolean; current: boolean; onClick: () => void }) {
  const [failed, setFailed] = useState(false);
  const main = mainStatOf(p);
  return (
    <button type="button" className="pp-tile" data-rarity={p.rarity} data-current={current} onClick={onClick} aria-label={`${set?.name ?? p.setKey}, ${MAIN_LABEL[p.mainStatKey] ?? p.mainStatKey}`}>
      <span className="art">{set && !failed ? <img src={pieceIconUrl(set.id, p.slotKey as SlotKey)} alt="" loading="lazy" crossOrigin="anonymous" onError={() => setFailed(true)} /> : <b className="ph">◆</b>}</span>
      <span className="n">{set?.name ?? p.setKey}</span>
      <span className="main">{MAIN_LABEL[p.mainStatKey] ?? p.mainStatKey} <b className="num">{formatMain(p.mainStatKey, main.value)}</b> <small>+{main.level}</small></span>
      <ul>{p.substats.map((s) => <li key={s.key}><span>{SUB_LABEL[s.key] ?? s.key}</span><b className="num">{formatSub(s.key, s.value)}</b></li>)}</ul>
      {current && <span className="tag now">Equipada aqui</span>}
      {!current && p.location && <span className={`tag${mine ? ' mine' : ''}`}>{mine ? 'Dele no inventário' : `Em ${characterDisplayName(p.location)}`}</span>}
    </button>
  );
}

export function PiecePickerDialog({
  slot,
  good,
  sets,
  characterKey,
  current,
  onPick,
  onClear,
  onClose,
}: {
  slot: SlotKey;
  good: Good | null;
  sets: ArtifactSet[];
  /** Chave do personagem no GOOD (para destacar as peças que já são dele). */
  characterKey: string;
  current?: RealPiece;
  onPick: (piece: RealPiece) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [set, setSet] = useState('');
  const [sort, setSort] = useState<Sort>('padrao');
  const [others, setOthers] = useState(true);
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const mine = (p: RealPiece) => !!p.location && norm(p.location) === norm(characterKey);
  const all = useMemo(() => (good?.artifacts ?? []).filter((a) => a.slotKey === slot && a.rarity >= 4), [good, slot]);
  const setKeys = useMemo(() => [...new Set(all.map((a) => a.setKey))], [all]);
  const list = useMemo(() => {
    const out = all.filter((a) => (!set || a.setKey === set) && (others || !a.location || mine(a)));
    const rank = (p: RealPiece) => (mine(p) ? 0 : !p.location ? 1 : 2);
    return out.sort((a, b) =>
      sort === 'critico' ? critValue(b) - critValue(a) : sort === 'nivel' ? pieceLevel(b) - pieceLevel(a) : rank(a) - rank(b) || critValue(b) - critValue(a),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, set, sort, others, characterKey]);
  const same = (a: RealPiece, b?: RealPiece) => !!b && JSON.stringify([a.setKey, a.mainStatKey, a.substats, a.level]) === JSON.stringify([b.setKey, b.mainStatKey, b.substats, b.level]);

  return (
    <div className="dz-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dz-dialog wide" role="dialog" aria-modal="true" aria-label={`Escolher ${SLOT_LABEL[slot]} do inventário`}>
        <header>
          <h2 className="h2">{SLOT_LABEL[slot]} do inventário</h2>
          <button type="button" className="dz-btn sm" onClick={onClose}>Fechar</button>
        </header>
        {!good ? (
          <div className="ot-empty">
            <p>Você ainda não importou o inventário. Importe o arquivo do Genshin Optimizer ou a vitrine do jogo para escolher peças reais.</p>
            <Link className="dz-btn gold" to="/inventario">Importar o inventário</Link>
          </div>
        ) : (
          <>
            <div className="tools">
              <select className="dz-input" aria-label="Set" value={set} onChange={(e) => { setSet(e.target.value); setShown(PAGE); }}>
                <option value="">Todos os sets ({all.length})</option>
                {setKeys.map((k) => <option key={k} value={k}>{sets.find((s) => norm(s.name) === norm(k))?.name ?? k}</option>)}
              </select>
              <select className="dz-input" aria-label="Ordem" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="padrao">Dele e livres primeiro</option>
                <option value="critico">Maior valor de crítico</option>
                <option value="nivel">Maior nível</option>
              </select>
              <label className="pp-others"><input type="checkbox" checked={others} onChange={(e) => setOthers(e.target.checked)} /> Mostrar as que outros usam</label>
              {current && <button type="button" className="dz-btn sm" onClick={onClear}>Deixar sem peça</button>}
            </div>
            <div className="pp-grid">
              {list.length === 0 && <p className="note">Nenhuma peça com esses filtros.</p>}
              {list.slice(0, shown).map((p, i) => (
                <Tile key={i} p={p} set={sets.find((s) => norm(s.name) === norm(p.setKey))} mine={mine(p)} current={same(p, current)} onClick={() => onPick(p)} />
              ))}
            </div>
            {list.length > shown && <button type="button" className="dz-btn" onClick={() => setShown(shown + PAGE)}>Mostrar mais ({list.length - shown})</button>}
            <p className="muted small">Escolher uma peça aqui não tira ela do outro personagem no seu inventário: é só um cálculo.</p>
          </>
        )}
      </div>
    </div>
  );
}
