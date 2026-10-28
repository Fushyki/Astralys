/** Peças compartilhadas pelos cards: retrato, faixa alta, rosca de participação e formatadores. */
import { useState, type CSSProperties } from 'react';
import { faceIconUrl } from '../../design/primitives';
import { formatDecimal } from '../../ui/format';

export const css = (vars: Record<string, string | number>): CSSProperties => vars as CSSProperties;

export const thousands = (n: number) => formatDecimal(n, 0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Retrato redondo do personagem; sem imagem mostra a inicial na cor dele. */
export function Face({ name, icon, color }: { name: string; icon?: string; color: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="pc-face" style={css({ '--c': color })}>
      {icon && !failed ? <img src={faceIconUrl(icon)} alt="" crossOrigin="anonymous" onError={() => setFailed(true)} /> : <b>{name.charAt(0)}</b>}
    </span>
  );
}

const GACHA = 'https://api.lunaris.moe/data/assets/gachaicon';

/** Retrato alto do personagem (faixa de gacha do Lunaris); sem imagem mostra a inicial na cor dele. */
export function Strip({ name, icon, color }: { name: string; icon?: string; color: string }) {
  const [failed, setFailed] = useState(false);
  const src = icon ? `${GACHA}/${icon.replace('UI_AvatarIcon_', 'UI_Gacha_AvatarIcon_')}.webp` : '';
  return src && !failed ? <img className="pw-img" src={src} alt="" crossOrigin="anonymous" onError={() => setFailed(true)} /> : <b className="pw-init" style={css({ '--c': color })}>{name.charAt(0)}</b>;
}

/** Rosca de participação no dano: um arco por personagem, começando no maior. */
export function Donut({ parts, size }: { parts: { share: number; color: string }[]; size: number }) {
  const r = size / 2 - 14;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth="22" />
      {parts.map((p, i) => {
        const len = Math.max(p.share, 0) * c;
        const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.color} strokeWidth="22" strokeDasharray={`${Math.max(len - 2, 0)} ${c}`} strokeDashoffset={-acc} transform={`rotate(-90 ${size / 2} ${size / 2})`} />;
        acc += len;
        return el;
      })}
    </svg>
  );
}
