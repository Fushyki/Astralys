/**
 * Card infográfico de uma rotação: participação no dano, builds, DPS/DPR e a sequência de golpes.
 * Tem tamanho fixo (1280×720 ou 720×1280) para a imagem exportada sair sempre igual; quem mostra o card na
 * tela o escala com CSS (`ScaledCard`). As imagens vêm do Lunaris com CORS liberado, então dá para exportar em PNG.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { formatDecimal, formatPercent, ELEMENT_COLOR } from '../../ui/format';
import type { CardMember, CardModel } from './cardModel';
import './card.css';

export type CardFormat = 'wide' | 'tall';
export const CARD_SIZE: Record<CardFormat, { w: number; h: number }> = { wide: { w: 1280, h: 720 }, tall: { w: 720, h: 1280 } };

const IMAGE_BASE = 'https://api.lunaris.moe/data/assets/gachaicon';

/** 216599 → "216,6k"; 3790496 → "3,79M". */
export function compact(n: number): string {
  if (n >= 1e6) return `${formatDecimal(n / 1e6, 2)}M`;
  if (n >= 1e3) return `${formatDecimal(n / 1e3, 1)}k`;
  return formatDecimal(n, 0);
}

const colorOf = (m: CardMember) => (m.element ? ELEMENT_COLOR[m.element] : '#d8b668');

function Face({ m }: { m: CardMember }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="face" style={{ ['--c' as string]: colorOf(m) } as CSSProperties}>
      {m.icon && !failed ? (
        <img src={`${IMAGE_BASE}/${m.icon}.webp`} alt="" crossOrigin="anonymous" onError={() => setFailed(true)} />
      ) : (
        <b>{m.name.charAt(0)}</b>
      )}
    </span>
  );
}

export function RotationCard({ model, format = 'wide' }: { model: CardModel; format?: CardFormat }) {
  const { w, h } = CARD_SIZE[format];
  const sorted = [...model.members].sort((a, b) => b.share - a.share);
  const top = Math.max(0.0001, ...model.members.map((m) => m.share));
  return (
    <article className={`ast-card ${format}`} style={{ width: w, height: h }} aria-label={`Card de rotação: ${model.title}`}>
      <div className="sky" aria-hidden="true" />
      <header>
        <h2 className={model.title.length > 28 ? 'long' : undefined}>{model.title}</h2>
        <div className="tags">
          {model.badge && <span className="badge">{model.badge}</span>}
          {model.tag && <span className="tag">{model.tag}</span>}
        </div>
      </header>

      <div className="grid">
        <section className="share">
          <h3>Participação no dano</h3>
          {sorted.map((m) => (
            <div className="row" key={m.name}>
              <Face m={m} />
              <div className="who">
                <div className="line">
                  <span className="n">{m.name}</span>
                  <span className="p">{formatPercent(m.share)}</span>
                </div>
                <div className="bar"><i style={{ width: `${(m.share / top) * 100}%`, background: colorOf(m) }} /></div>
              </div>
            </div>
          ))}
        </section>

        <section className="builds">
          <h3>Builds</h3>
          {model.members.map((m) => (
            <div className="build" key={m.name} style={{ ['--c' as string]: colorOf(m) } as CSSProperties}>
              <span className="n">{m.name}</span>
              <span className="m">{m.mains} <em>{formatDecimal(m.er * 100, 0)}% ER</em></span>
              <span className="w">{m.weapon}<small>{m.sets.length ? m.sets.join(' + ') : 'sem set'}</small></span>
              <span className="c">Crítico {formatPercent(m.critRate, 0)} / {formatPercent(m.critDmg, 0)}</span>
            </div>
          ))}
        </section>
      </div>

      <footer>
        <div className="metrics">
          <div><span className="k">DPS</span><span className="v">{compact(model.dps)}</span></div>
          <div><span className="k">DPR</span><span className="v">{compact(model.dpr)}</span></div>
        </div>
        <p className="seq"><span className="k">Rotação de {formatDecimal(model.duration, 1)} s</span>{model.sequence}</p>
        <p className="foot"><span>Inimigo nível {model.enemyLevel}</span><b>ASTRALYS</b></p>
      </footer>
    </article>
  );
}

/** Mostra o card escalado para caber na largura do contêiner (a imagem exportada continua no tamanho real). */
export function ScaledCard({ format, children, maxWidth }: { format: CardFormat; children: ReactNode; maxWidth?: number }) {
  const { w, h } = CARD_SIZE[format];
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / w)));
    ro.observe(el);
    setScale(Math.min(1, el.clientWidth / w));
    return () => ro.disconnect();
  }, [w]);
  return (
    <div ref={box} className="ast-card-box" style={{ height: h * scale, maxWidth: maxWidth ?? w }}>
      <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
    </div>
  );
}
