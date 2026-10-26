/** Peças comuns da aba Otimizar: posições, cor do set, imagem da peça (40 px, +nível, ponto do set) e Crit Value. */
import { useState } from 'react';
import { pieceIconUrl, type PieceKey } from '../../design/images';
import type { FinalStats } from '../../engine';
import type { GoodArtifact } from '../../features/good/goodImport';
import { formatDecimal, formatInt } from '../../ui/format';

export const SLOTS = [
  { key: 'flower', label: 'Flor' },
  { key: 'plume', label: 'Pluma' },
  { key: 'sands', label: 'Areia' },
  { key: 'goblet', label: 'Cálice' },
  { key: 'circlet', label: 'Tiara' },
] as const;

/** Glifo da posição quando falta a imagem da peça (nunca um quadrado vazio). */
export const SLOT_GLYPH: Record<string, string> = { flower: '✿', plume: '✒', sands: '⌛', goblet: '♕', circlet: '♛' };

const SET_COLORS = ['var(--el-hydro)', 'var(--el-pyro)', 'var(--el-dendro)', 'var(--el-electro)', 'var(--el-geo)', 'var(--el-cryo)', 'var(--el-anemo)'];

/** Cor estável do set (a mesma no Build atual e nos cards), para o ponto ao lado da peça e nos chips. */
export function setColor(setName: string): string {
  let h = 0;
  for (let i = 0; i < setName.length; i++) h = (h * 31 + setName.charCodeAt(i)) >>> 0;
  return SET_COLORS[h % SET_COLORS.length];
}

/** Imagem da peça: 40 px, moldura dourada (5★) ou lilás (4★), selo +nível e, se pedido, o ponto da cor do set. */
export function PieceArt({ piece, setId, setName, dot }: { piece: GoodArtifact; setId?: number; setName?: string; dot?: boolean }) {
  const [failed, setFailed] = useState(false);
  const slot = piece.slotKey as PieceKey;
  return (
    <span className="ot-art" data-rarity={piece.rarity} title={setName ?? piece.setKey}>
      {setId && !failed ? <img src={pieceIconUrl(setId, slot)} alt="" loading="lazy" crossOrigin="anonymous" onError={() => setFailed(true)} /> : <b className="ph" aria-hidden="true">{SLOT_GLYPH[piece.slotKey] ?? '◆'}</b>}
      <b className="lv num">+{piece.level ?? 0}</b>
      {dot && <i className="dot" style={{ background: setColor(setName ?? piece.setKey) }} />}
    </span>
  );
}

/** Crit Value: 2 × Taxa Crítica + Dano Crítico (em pontos percentuais). */
export const critValue = (s: Pick<FinalStats, 'critRate' | 'critDmg'>): number => (2 * s.critRate + s.critDmg) * 100;

export const fmtPct = (f: number) => `${formatDecimal(f * 100, 1)}%`;
export const fmtInt = formatInt;
