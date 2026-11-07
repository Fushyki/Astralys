/**
 * Card de comparação (16:9, 1600×900): dois times lado a lado, a diferença no meio e o dano de cada personagem embaixo.
 * Mesma base visual do card 16:9 do time; é uma imagem fixa para printar e mostrar.
 */
import type { CardMember, CardModel } from '../../features/card/cardModel';
import type { Comparison } from '../../features/compare/compareModel';
import { formatDecimal, formatPercent } from '../../ui/format';
import { GearLine, Strip, css, thousands } from './cardParts';
import { starPath } from './RotationLanes';
import { POSTER_SIZE } from './PosterCard';
import './card.css';

export type CompareMetric = 'dps' | 'dpr' | 'duration' | 'er';
export const COMPARE_METRICS: { value: CompareMetric; label: string }[] = [
  { value: 'dps', label: 'DPS' },
  { value: 'dpr', label: 'Dano na rotação' },
  { value: 'duration', label: 'Duração' },
  { value: 'er', label: 'Recarga média' },
];

export interface CompareOptions {
  titleA: string;
  titleB: string;
  accentA: string;
  accentB: string;
  metrics: CompareMetric[];
  showGear: boolean;
  showBars: boolean;
  note: string;
}

const avgEr = (m: CardModel) => (m.members.length ? m.members.reduce((s, x) => s + x.er, 0) / m.members.length : 0);
const signed = (f: number | null, d = 1) => (f === null ? '—' : `${f > 0 ? '+' : ''}${formatDecimal(f * 100, d)}%`);

function Side({ model, title, accent, win, showGear, letter }: { model: CardModel; title: string; accent: string; win: boolean; showGear: boolean; letter: 'A' | 'B' }) {
  return (
    <section className="cc-side" style={css({ '--accent': accent })}>
      <header className="cc-head">
        <i className="cc-letter">{letter}</i>
        <h2 className={title.length > 26 ? 'long' : ''}>{title}</h2>
        {win && <svg width="34" height="34" viewBox="-24 -24 48 48" aria-label="Maior dano"><path d={starPath(0, 0, 18)} fill="var(--accent)" /></svg>}
      </header>
      <div className="cc-strips">
        {model.members.map((m: CardMember) => (
          <div key={m.name} className="cc-strip" style={css({ '--c': m.color })}>
            <Strip name={m.name} icon={m.icon} color={m.color} />
            <div className="cc-cap">
              <span className="n">{m.name}</span>
              <span className="w">{m.weapon}</span>
              {showGear && <GearLine gear={m.gear} />}
              <span className="s num">{formatPercent(m.share, 0)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="cc-nums">
        <div><span className="k">DPS</span><span className="big num">{thousands(model.dps)}</span></div>
        <div><span className="k">Dano na rotação</span><span className="mid num">{formatDecimal(model.dpr / 1e6, 2)} mi</span></div>
      </div>
    </section>
  );
}

export function CompareCard({ a, b, cmp, opts }: { a: CardModel; b: CardModel; cmp: Comparison; opts: CompareOptions }) {
  const { w, h } = POSTER_SIZE.wide;
  const winnerName = cmp.winner === 'a' ? opts.titleA : opts.titleB;
  const winnerAccent = cmp.winner === 'a' ? opts.accentA : opts.accentB;
  const lead = cmp.winner === 'a' ? (b.dpr > 0 ? a.dpr / b.dpr - 1 : null) : cmp.dprChange;
  const rows = opts.metrics.map((m) => {
    if (m === 'dps') return { m, label: 'DPS', ch: cmp.dpsChange, text: signed(cmp.dpsChange, 1) };
    if (m === 'dpr') return { m, label: 'Dano na rotação', ch: cmp.dprChange, text: signed(cmp.dprChange, 1) };
    if (m === 'duration') return { m, label: 'Duração', ch: null, text: `${formatDecimal(a.duration, 1)} s · ${formatDecimal(b.duration, 1)} s` };
    const ea = avgEr(a), eb = avgEr(b);
    return { m, label: 'Recarga média', ch: ea > 0 ? eb / ea - 1 : null, text: `${formatDecimal(ea * 100, 0)}% · ${formatDecimal(eb * 100, 0)}%` };
  });
  const members = cmp.members;
  const top = Math.max(1, ...members.map((m) => Math.max(m.a?.avg ?? 0, m.b?.avg ?? 0)));
  const colorOf = (m: (typeof members)[number]) => m.a?.color ?? m.b?.color ?? '#9aa3c7';
  const tint = (ch: number | null) => (ch === null || Math.abs(ch) < 1e-4 ? 'var(--text)' : ch > 0 ? opts.accentB : opts.accentA);
  return (
    <article className="pc pc-cmp" style={{ width: w, height: h }} aria-label={`Comparação: ${opts.titleA} contra ${opts.titleB}`}>
      <svg className="pc-sky" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <path d={`M${w - 380} 0 A 700 700 0 0 1 ${w} 700`} fill="none" stroke="#1E2647" strokeWidth="1" />
        <path d={`M0 ${h - 300} A 640 640 0 0 0 480 ${h}`} fill="none" stroke="#161D3B" strokeWidth="1" />
        <line x1={w / 2} x2={w / 2} y1="96" y2={h - 270} stroke="#1E2647" strokeDasharray="2 8" />
        <circle cx={w - 60} cy="110" r="2" fill="#E9C46A" opacity=".8" />
        <circle cx="70" cy={h - 150} r="1.6" fill="#E7EAF6" opacity=".5" />
      </svg>
      <header className="pc-top">
        <span className="pc-brand">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#e9c46a" strokeWidth="1.6" aria-hidden="true"><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" /></svg>
          ASTRALYS
        </span>
        <span className="cc-kicker">Comparação de times</span>
        <span className="cc-note">{opts.note}</span>
      </header>

      <div className="cc-main">
        <Side model={a} title={opts.titleA} accent={opts.accentA} win={cmp.winner === 'a'} showGear={opts.showGear} letter="A" />
        <div className="cc-mid">
          <div className="cc-verdict">
            {cmp.winner === 'tie' ? (
              <b>Empate</b>
            ) : (
              <>
                <b style={{ color: winnerAccent }}>{signed(lead === null ? null : Math.abs(lead), 1).replace('+', '')}</b>
                <span>mais dano por rotação em <em style={{ color: winnerAccent }}>{winnerName}</em></span>
              </>
            )}
          </div>
          <div className="cc-rows">
            {rows.map((r) => (
              <div key={r.m}><span className="l">{r.label}</span><b className="num" style={{ color: tint(r.ch) }}>{r.text}</b></div>
            ))}
          </div>
        </div>
        <Side model={b} title={opts.titleB} accent={opts.accentB} win={cmp.winner === 'b'} showGear={opts.showGear} letter="B" />
      </div>

      {opts.showBars && members.length > 0 && (
        <footer className="cc-bars" aria-label="Dano por personagem">
          {members.map((m) => (
            <div key={m.name} className="cc-bar" style={css({ '--c': colorOf(m) })}>
              <span className="v num l">{m.a ? thousands(m.a.avg) : '—'}</span>
              <span className="tr l"><i style={{ width: `${((m.a?.avg ?? 0) / top) * 100}%`, background: opts.accentA }} /></span>
              <span className="n">{m.name}</span>
              <span className="tr r"><i style={{ width: `${((m.b?.avg ?? 0) / top) * 100}%`, background: opts.accentB }} /></span>
              <span className="v num r">{m.b ? thousands(m.b.avg) : '—'}</span>
            </div>
          ))}
        </footer>
      )}
    </article>
  );
}
