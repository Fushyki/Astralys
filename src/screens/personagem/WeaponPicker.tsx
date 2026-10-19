/** Trocar arma: grade de armas do tipo do personagem, com imagem, ATK e substat (como no Genshin Optimizer). */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Weapon } from '../../data/schema';
import { weaponIconUrl } from '../../design/images';
import { formatDecimal, formatInt } from '../../ui/format';

const substatText = (w: Weapon): string => {
  if (!w.substat) return '';
  const v = w.substat.value < 1 ? `${formatDecimal(w.substat.value * 100, 1)}%` : formatInt(w.substat.value);
  return `${w.substat.stat} ${v}`;
};

function Icon({ w }: { w: Weapon }) {
  const [failed, setFailed] = useState(false);
  return w.icon && !failed ? <img src={weaponIconUrl(w.icon)} alt="" loading="lazy" crossOrigin="anonymous" onError={() => setFailed(true)} /> : <b className="ph" aria-hidden="true">⚔</b>;
}

export function WeaponPickerDialog({
  weapons,
  current,
  withEffect,
  onPick,
  onClose,
}: {
  weapons: Weapon[];
  current: string;
  /** Nomes das armas cujo efeito numérico já entra no cálculo. */
  withEffect: ReadonlySet<string>;
  onPick: (name: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [stars, setStars] = useState<Set<number>>(() => new Set([5, 4]));
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const rarities = useMemo(() => [...new Set(weapons.map((w) => w.rarity))].sort((a, b) => b - a), [weapons]);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return weapons.filter((w) => stars.has(w.rarity) && (!q || w.name.toLowerCase().includes(q) || w.namePt.toLowerCase().includes(q)));
  }, [weapons, stars, query]);

  const toggle = (r: number) => setStars((s) => {
    const next = new Set(s);
    if (next.has(r)) next.delete(r);
    else next.add(r);
    return next.size ? next : s;
  });

  return (
    <div className="dz-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dz-dialog wide" role="dialog" aria-modal="true" aria-label="Trocar arma">
        <header>
          <h2 className="h2">Trocar arma</h2>
          <button type="button" className="dz-btn sm" onClick={onClose}>Fechar</button>
        </header>
        <div className="tools">
          <input ref={searchRef} className="dz-input" type="search" placeholder="Nome da arma" aria-label="Buscar arma" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="dz-seg" role="group" aria-label="Raridade">
            {rarities.map((r) => (
              <button key={r} type="button" aria-pressed={stars.has(r)} onClick={() => toggle(r)}>{r}★</button>
            ))}
          </div>
          <span className="muted small">Mostrando {list.length} de {weapons.length} armas</span>
        </div>
        <div className="grid weapons">
          {list.length === 0 && <p className="note">Nenhuma arma encontrada.</p>}
          {list.map((w) => (
            <button key={w.id} type="button" className="wcard" data-rarity={w.rarity} data-current={w.name === current} onClick={() => onPick(w.name)}>
              <span className="art"><Icon w={w} /></span>
              <span className="n">{w.name}{w.namePt && w.namePt !== w.name ? <small>{w.namePt}</small> : null}</span>
              <span className="num sub">ATK {formatInt(w.baseAtk)}{w.substat ? ` · ${substatText(w)}` : ''}</span>
              <span className="tags">
                {w.name === current && <span className="dz-chip ok">Equipada</span>}
                {!withEffect.has(w.name) && <span className="dz-chip warn" title="O efeito desta arma ainda não entra no cálculo">sem efeito</span>}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
