/**
 * Card para compartilhar (imagem fixa). Três formatos: 4:5 (padrão, 1080×1350), 16:9 (1600×900) e 9:16 (1080×1920, `TallCard`).
 * Tudo vem do projeto analisado; o que a tela mostra é escalado por CSS (`ScaledPoster`), a imagem exportada tem o tamanho real.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { CardModel } from '../../features/card/cardModel';
import { compact, formatDecimal, formatPercent } from '../../ui/format';
import { Donut, Face, GearLine, Strip, css, thousands } from './cardParts';
import { RotationLanes, starPath } from './RotationLanes';
import { TallCard } from './TallCard';
import './card.css';

export type PosterFormat = 'portrait' | 'wide' | 'tall';
export const POSTER_SIZE: Record<PosterFormat, { w: number; h: number }> = {
  portrait: { w: 1080, h: 1350 },
  wide: { w: 1600, h: 900 },
  tall: { w: 1080, h: 1920 },
};
export const POSTER_LABEL: Record<PosterFormat, string> = { portrait: '4:5', wide: '16:9', tall: '9:16' };

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
                <GearLine gear={m.gear} />
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
        <RotationLanes model={model} width={w - 128} rowH={27} labelW={132} labelSize={15} />
        <div className="pc-seq"><span>{model.sequence}</span><span className="num">Nv {model.characterLevel} vs {model.enemyLevel}</span></div>
      </footer>
    </article>
  );
}

/** 4:5 (padrão): retratos ligados por uma linha de constelação, DPS em destaque, participação com estrela e a rotação em faixas. */
function PortraitCard({ model }: { model: CardModel }) {
  const { w, h } = POSTER_SIZE.portrait;
  const sorted = [...model.members].sort((a, b) => b.share - a.share);
  const lead = sorted[0];
  const subtitle = [model.badge, model.tag].filter(Boolean).join(' · ');
  const n = model.members.length;
  return (
    <article className="pc pc-portrait" style={{ width: w, height: h, ...css({ '--accent': model.accent }) }} aria-label={`Card: ${model.title}`}>
      <svg className="pc-sky" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <path d={`M${w - 360} 0 A 700 700 0 0 1 ${w} 700`} fill="none" stroke="#1E2647" strokeWidth="1" />
        <path d={`M${w - 460} 0 A 840 840 0 0 1 ${w} 840`} fill="none" stroke="#161D3B" strokeWidth="1" />
        <path d={`M0 ${h - 260} A 600 600 0 0 0 440 ${h}`} fill="none" stroke="#161D3B" strokeWidth="1" />
        <path d={starPath(w - 96, 112, 9)} fill="#E9C46A" opacity=".85" />
        <path d={starPath(w - 230, 64, 5)} fill="#E7EAF6" opacity=".5" />
        <path d={starPath(w - 64, 300, 4)} fill="#E7EAF6" opacity=".4" />
        <path d={starPath(54, h - 330, 6)} fill="#E9C46A" opacity=".5" />
      </svg>

      <header className="pc-top">
        <span className="pc-brand">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.6" aria-hidden="true"><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" /></svg>
          ASTRALYS
        </span>
        {model.nick && <span className="pc-nick">por {model.nick}</span>}
      </header>

      <div className="pc-title">
        <span className="pc-sub">{subtitle || 'Rotação de time'}</span>
        <h1 className={model.title.length > 34 ? 'long' : undefined}>{model.title}</h1>
        <div className="pc-chips">
          {model.reaction && <span className="chip"><i />{model.reaction.name} · {formatPercent(model.reaction.fraction, 0)} do dano</span>}
          <span className="chip"><i />Rotação de {formatDecimal(model.duration, 1)} s</span>
          <span className="chip"><i />Nv {model.characterLevel} vs {model.enemyLevel}</span>
        </div>
      </div>

      <div className="pc-chars">
        <svg className="pc-const" width="936" height="40" viewBox="0 0 936 40" aria-hidden="true">
          {model.members.slice(0, -1).map((_, i) => {
            const x1 = ((i + 0.5) / n) * 936 + 62;
            const x2 = ((i + 1.5) / n) * 936 - 62;
            return (
              <g key={i}>
                <line x1={x1} x2={x2} y1={20} y2={20} stroke="#2e3966" strokeWidth="2" strokeDasharray="3 7" />
                <path d={starPath((x1 + x2) / 2, 20, 8)} fill="#E9C46A" opacity=".85" />
              </g>
            );
          })}
        </svg>
        {model.members.map((m) => (
          <div key={m.name} className="pc-char">
            <Face name={m.name} icon={m.icon} color={m.color} />
            <span className="n">{m.name}</span>
            <span className="w">{m.weapon}</span>
            <GearLine gear={m.gear} />
            <span className="sh num" style={css({ '--c': m.color })}>{formatPercent(m.share, m.share < 0.1 ? 1 : 0)}</span>
          </div>
        ))}
      </div>

      <div className="pc-hero">
        <div>
          <span className="k"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d={starPath(12, 12, 11)} fill="var(--accent)" /></svg>DPS do time</span>
          <span className="big num">{thousands(model.dps)}</span>
        </div>
        <div className="side">
          <div><span className="v num">{formatDecimal(model.dpr / 1e6, 2)} mi</span><span className="l">dano na rotação</span></div>
          {lead && <div><span className="v num">{lead.name}</span><span className="l">{formatPercent(lead.share, 0)} do dano</span></div>}
        </div>
      </div>

      <div className="pc-bars">
        {sorted.map((m, i) => (
          <div key={m.name} className="pc-bar">
            <span className="n">{m.name}</span>
            <div className="track"><i style={{ width: `${Math.max(m.share * 100, 1.5)}%`, background: m.color }} /></div>
            <span className="p num">{formatPercent(m.share, 1)}</span>
            {i === 0 && <svg className="pc-bar-star" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d={starPath(12, 12, 11)} fill="var(--accent)" /></svg>}
          </div>
        ))}
      </div>

      <footer className="pc-foot">
        <div className="pc-rothead"><span className="k">Rotação</span><i /></div>
        <RotationLanes model={model} width={w - 144} rowH={38} labelW={142} labelSize={18} />
        <div className="pc-seq"><span>{model.sequence}</span></div>
      </footer>
    </article>
  );
}

export function PosterCard({ model, format = 'portrait' }: { model: CardModel; format?: PosterFormat }) {
  if (format === 'wide') return <WideCard model={model} />;
  if (format === 'tall') return <TallCard model={model} />;
  return <PortraitCard model={model} />;
}

/** Mostra o card escalado para caber na largura do contêiner (a imagem exportada continua no tamanho real). */
/** `maxHeight` (px) também limita o tamanho: o card fica mais estreito, centralizado, em vez de passar do fim da tela. */
export function ScaledPoster({ format, children, maxHeight }: { format: PosterFormat; children: ReactNode; maxHeight?: number }) {
  const { w, h } = POSTER_SIZE[format];
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const fit = () => setScale(Math.min(1, el.clientWidth / w, maxHeight ? maxHeight / h : Infinity));
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    fit();
    return () => ro.disconnect();
  }, [w, h, maxHeight]);
  return (
    <div ref={box} className="pc-box" style={{ height: h * scale }}>
      <div style={{ width: w * scale, height: h * scale, margin: '0 auto' }}>
        <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
      </div>
    </div>
  );
}

export { compact };
