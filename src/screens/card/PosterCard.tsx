/**
 * Card para compartilhar (imagem fixa). Três formatos: 4:5 (padrão, 1080×1350), 16:9 (1600×900) e 9:16 (1080×1920).
 * Tudo vem do projeto analisado; o que a tela mostra é escalado por CSS (`ScaledCard`), a imagem exportada tem o tamanho real.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { faceIconUrl } from '../../design/primitives';
import type { CardModel } from '../../features/card/cardModel';
import { compact, formatDecimal, formatPercent } from '../../ui/format';
import './card.css';

export type PosterFormat = 'portrait' | 'wide' | 'tall';
export const POSTER_SIZE: Record<PosterFormat, { w: number; h: number }> = {
  portrait: { w: 1080, h: 1350 },
  wide: { w: 1600, h: 900 },
  tall: { w: 1080, h: 1920 },
};
export const POSTER_LABEL: Record<PosterFormat, string> = { portrait: '4:5', wide: '16:9', tall: '9:16' };

const css = (vars: Record<string, string | number>): CSSProperties => vars as CSSProperties;

function Face({ name, icon, color }: { name: string; icon?: string; color: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="pc-face" style={css({ '--c': color })}>
      {icon && !failed ? <img src={faceIconUrl(icon)} alt="" crossOrigin="anonymous" onError={() => setFailed(true)} /> : <b>{name.charAt(0)}</b>}
    </span>
  );
}

const GACHA = 'https://api.lunaris.moe/data/assets/gachaicon';
const thousands = (n: number) => formatDecimal(n, 0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Retrato alto do personagem (faixa de gacha do Lunaris); sem imagem mostra a inicial na cor dele. */
function Strip({ name, icon, color }: { name: string; icon?: string; color: string }) {
  const [failed, setFailed] = useState(false);
  const src = icon ? `${GACHA}/${icon.replace('UI_AvatarIcon_', 'UI_Gacha_AvatarIcon_')}.webp` : '';
  return src && !failed ? <img className="pw-img" src={src} alt="" crossOrigin="anonymous" onError={() => setFailed(true)} /> : <b className="pw-init" style={css({ '--c': color })}>{name.charAt(0)}</b>;
}

/** Rosca de participação no dano: um arco por personagem, começando no maior. */
function Donut({ parts, size }: { parts: { share: number; color: string }[]; size: number }) {
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

function WideCard({ model }: { model: CardModel }) {
  const { w, h } = POSTER_SIZE.wide;
  const sorted = [...model.members].sort((a, b) => b.share - a.share);
  const lead = sorted[0];
  const subtitle = [model.badge, model.tag, `rotação de ${formatDecimal(model.duration, 1)} s`].filter(Boolean).join(' · ');
  return (
    <article className="pc pc-wide" style={{ width: w, height: h, ...css({ '--accent': model.accent }) }} aria-label={`Card: ${model.title}`}>
      <svg className="pc-sky" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <path d={`M${w - 380} 0 A 700 700 0 0 1 ${w} 700`} fill="none" stroke="#1E2647" strokeWidth="1" />
        <path d={`M${w - 460} 0 A 820 820 0 0 1 ${w} 820`} fill="none" stroke="#161D3B" strokeWidth="1" />
        <circle cx={w - 60} cy="110" r="2" fill="#E9C46A" opacity=".8" />
        <circle cx={w - 330} cy="70" r="1.5" fill="#E7EAF6" opacity=".5" />
      </svg>
      <header className="pc-top">
        <span className="pc-brand">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.6" aria-hidden="true"><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" /></svg>
          ASTRALYS
        </span>
        <span className="pc-sub">{subtitle}</span>
        {model.nick ? <span className="pc-nick">por {model.nick}</span> : <span />}
      </header>
      <h1 className={`pw-title${model.title.length > 44 ? ' long' : ''}`}>{model.title}</h1>

      <div className="pw-main">
        <div className="pw-strips">
          {model.members.map((m) => (
            <div key={m.name} className="pw-strip" style={css({ '--c': m.color })}>
              <Strip name={m.name} icon={m.icon} color={m.color} />
              <div className="pw-cap">
                <span className="n">{m.name}</span>
                <span className="w">{m.weapon}</span>
                <span className="s num">{formatPercent(m.share, 0)} do dano</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pw-right">
          <div className="pw-dps">
            <span className="k">DPS do time</span>
            <span className="big num">{thousands(model.dps)}</span>
          </div>
          <div className="pw-kpis">
            <div><span className="v num">{formatDecimal(model.dpr / 1e6, 2)} mi</span><span className="l">dano na rotação</span></div>
            {model.reaction && <div><span className="v num">{formatPercent(model.reaction.fraction, 0)}</span><span className="l">vem de {model.reaction.name}</span></div>}
            {lead && <div><span className="v num">{lead.name}</span><span className="l">maior parte do dano</span></div>}
          </div>
          <div className="pw-share">
            <div className="pw-donut">
              <Donut parts={sorted} size={190} />
              <span className="mid num">{formatPercent(lead?.share ?? 0, 0)}<small>{lead?.name}</small></span>
            </div>
            <div className="pw-legend">
              {sorted.map((m) => (
                <div key={m.name}>
                  <i style={{ background: m.color }} />
                  <span className="n">{m.name}</span>
                  <span className="p num">{formatPercent(m.share, 1)}</span>
                  <span className="c num">CR {formatPercent(m.critRate, 0)} · CD {formatPercent(m.critDmg, 0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="pc-foot">
        <div className="pc-line" role="img" aria-label="Golpes ao longo da rotação">
          {model.timeline.map((hit, i) => {
            const size = hit.burst ? 30 : 10 + hit.weight * 9;
            return <span key={i} style={css({ left: `${hit.at * 98 + 1}%`, width: size, height: size, background: hit.burst ? model.accent : model.members[hit.member]?.color ?? '#9AA3C7' })} />;
          })}
        </div>
        <div className="pc-seq"><span>{model.sequence}</span><span className="num">Nv {model.characterLevel} vs {model.enemyLevel}</span></div>
      </footer>
    </article>
  );
}

export function PosterCard({ model, format = 'portrait' }: { model: CardModel; format?: PosterFormat }) {
  if (format === 'wide') return <WideCard model={model} />;
  const { w, h } = POSTER_SIZE[format];
  const sorted = [...model.members].sort((a, b) => b.share - a.share);
  const lead = sorted[0];
  const names = model.members.map((m) => m.name);
  const subtitle = [model.badge, model.tag, `rotação de ${formatDecimal(model.duration, 1)} s`].filter(Boolean).join(' · ');

  return (
    <article className={`pc pc-${format}`} style={{ width: w, height: h, ...css({ '--accent': model.accent }) }} aria-label={`Card: ${model.title}`}>
      <svg className="pc-sky" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <circle cx={w - 100} cy="120" r="2" fill="#E9C46A" opacity=".8" />
        <circle cx={w - 180} cy="260" r="1.5" fill="#E7EAF6" opacity=".5" />
        <circle cx={w - 70} cy="420" r="1.2" fill="#E7EAF6" opacity=".4" />
        <circle cx="120" cy={h - 110} r="1.5" fill="#E7EAF6" opacity=".4" />
        <circle cx="60" cy={h - 370} r="2" fill="#E9C46A" opacity=".6" />
        <path d={`M${w - 220} 40 A 520 520 0 0 1 ${w} 520`} fill="none" stroke="#1E2647" strokeWidth="1" />
        <path d={`M${w - 280} 0 A 640 640 0 0 1 ${w} 640`} fill="none" stroke="#161D3B" strokeWidth="1" />
      </svg>

      <header className="pc-top">
        <span className="pc-brand">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.6" aria-hidden="true"><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" /></svg>
          ASTRALYS
        </span>
        {model.nick && <span className="pc-nick">por {model.nick}</span>}
      </header>

      <div className="pc-main">
        <div className="pc-left">
          <div className="pc-title">
            <span className="pc-sub">{subtitle}</span>
            <h1 className={model.title.length > 34 ? 'long' : undefined}>{model.title}</h1>
            {lead && <span className="pc-lead num">{names.join(' · ')}</span>}
          </div>

          <div className="pc-chars">
            {model.members.map((m) => (
              <div key={m.name} className="pc-char">
                <Face name={m.name} icon={m.icon} color={m.color} />
                <span className="n">{m.name}</span>
                <span className="w">{m.weapon}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pc-right">
          <div className="pc-hero">
            <div>
              <span className="k">DPS do time</span>
              <span className="big num">{formatDecimal(model.dps, 0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</span>
            </div>
            <div className="side">
              <div><span className="v num">{formatDecimal(model.dpr / 1e6, 2)} mi</span><span className="l">dano na rotação</span></div>
              {model.reaction && <div><span className="v num">{formatPercent(model.reaction.fraction, 0)}</span><span className="l">vem de {model.reaction.name}</span></div>}
            </div>
          </div>

          <div className="pc-bars">
            {sorted.map((m) => (
              <div key={m.name} className="pc-bar">
                <span className="n">{m.name}</span>
                <div className="track"><i style={{ width: `${Math.max(m.share * 100, 1)}%`, background: m.color }} /></div>
                <span className="p num">{formatPercent(m.share, 1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="pc-foot">
        <span className="k">Rotação</span>
        <div className="pc-line" role="img" aria-label="Golpes ao longo da rotação">
          {model.timeline.map((hit, i) => {
            const size = hit.burst ? 36 : 12 + hit.weight * 10;
            return <span key={i} style={css({ left: `${hit.at * 96 + 2}%`, width: size, height: size, background: hit.burst ? model.accent : model.members[hit.member]?.color ?? '#9AA3C7' })} />;
          })}
        </div>
        <div className="pc-seq"><span>{model.sequence}</span><span className="num">Nv {model.characterLevel} vs {model.enemyLevel}</span></div>
      </footer>
    </article>
  );
}

/** Mostra o card escalado para caber na largura do contêiner (a imagem exportada continua no tamanho real). */
export function ScaledPoster({ format, children }: { format: PosterFormat; children: ReactNode }) {
  const { w, h } = POSTER_SIZE[format];
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const fit = () => setScale(Math.min(1, el.clientWidth / w));
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    fit();
    return () => ro.disconnect();
  }, [w]);
  return (
    <div ref={box} className="pc-box" style={{ height: h * scale }}>
      <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
    </div>
  );
}

export { compact };
