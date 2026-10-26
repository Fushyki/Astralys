/** Card de um artefato (resultado do otimizador e Resumo e build): faixa do set, ícone grande, main stat com CV, substats e dono. */
import { CharacterAvatar } from '../../design/primitives';
import type { GoodArtifact } from '../../features/good/goodImport';
import { MAIN_LABEL, SUB_LABEL, formatMain, formatSub } from '../../features/good/labels';
import { mainStatValue } from '../../engine/pieces';
import { formatDecimal } from '../../ui/format';
import { ArtImg, setColor } from './shared';

/** Quem tem a peça equipada: nome, cor e retrato (o mini ícone do canto). */
export interface Owner { name: string; color: string; icon?: string }

/** CV (Crit Value) da peça: 2 × Taxa Crítica + Dano Crítico das substats (o main stat não entra). */
export const pieceCv = (a: Pick<GoodArtifact, 'substats'>): number => {
  const sum = (key: string) => a.substats.filter((s) => s.key === key).reduce((n, s) => n + s.value, 0);
  return 2 * sum('critRate_') + sum('critDMG_');
};

export function PieceCard({ piece, slotLabel, set, tag, owner, inventory, blocked, onClick, label, title }: {
  piece: GoodArtifact;
  slotLabel: string;
  set?: { name: string; id: number };
  /** Etiqueta do canto: "troca" (dourada) ou "equipada" (contorno azul). */
  tag?: { text: string; kind: 'swap' | 'kept' };
  /** Quem a tem equipada (mini ícone do canto). */
  owner?: Owner | null;
  /** Mostra "no inventário" quando ninguém a tem. */
  inventory?: boolean;
  blocked?: boolean;
  onClick?: () => void;
  label: string;
  title?: string;
}) {
  const name = set?.name ?? piece.setKey;
  const key = piece.slotKey === 'flower' ? 'hp' : piece.slotKey === 'plume' ? 'atk' : piece.mainStatKey;
  const cv = pieceCv(piece);
  const interactive = !!onClick;
  return (
    <div
      className="pcard" data-rarity={piece.rarity} data-change={tag?.kind === 'swap'} data-blocked={blocked ? true : undefined}
      {...(interactive ? { role: 'button', tabIndex: 0, 'aria-pressed': blocked !== undefined ? !!blocked : undefined, onClick, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } } : {})}
      aria-label={label} title={title}
    >
      <i className="bar" style={{ background: setColor(name) }} />
      <div className="phead">
        <span className="slot">{slotLabel}</span>
        {tag && <em>{tag.text}</em>}
      </div>
      <div className="pic">
        <span className="art" title={name}>
          <ArtImg setId={set?.id} slot={piece.slotKey} />
          <b className="lv num">+{piece.level ?? 0}</b>
          {blocked && <i className="lock" aria-hidden="true">🔒</i>}
          {owner && <span className="owner" title={`equipada em ${owner.name}`} aria-label={`equipada em ${owner.name}`}><CharacterAvatar name={owner.name} icon={owner.icon} color={owner.color} size={26} /></span>}
        </span>
        <i className="stars" aria-label={`${piece.rarity} estrelas`}>{'★'.repeat(piece.rarity)}</i>
      </div>
      <span className="setname" title={name}>{name}</span>
      <div className="main">
        <small>{MAIN_LABEL[key] ?? key}</small>
        <span className="mv">
          <b className="num">{formatMain(key, mainStatValue(key, piece.rarity, piece.level))}</b>
          <span className="cv num" data-hi={cv >= 30}>CV {formatDecimal(cv, 1)}</span>
        </span>
      </div>
      <ul>
        {piece.substats.slice(0, 4).map((x) => (
          <li key={x.key} data-crit={x.key === 'critRate_' || x.key === 'critDMG_'}><span>{SUB_LABEL[x.key] ?? x.key}</span><b className="num">{formatSub(x.key, x.value)}</b></li>
        ))}
      </ul>
      {inventory && !owner && <span className="foot">no inventário</span>}
    </div>
  );
}
