/**
 * Card 9:16 (1080×1920), identidade "Constelação": os quatro personagens em quadros grandes ligados por uma linha de constelação, o DPS num
 * arco dividido pela participação de cada um e a rotação inteira em faixas, com o instante real de cada golpe.
 */
import type { CardModel } from '../../features/card/cardModel';
import { formatDecimal, formatPercent } from '../../ui/format';
import { GearLine, Strip, css, thousands } from './cardParts';
import { RotationLanes, starPath } from './RotationLanes';

const W = 1080;
const H = 1920;

/** Arco de meia volta dividido pela participação de cada personagem; o DPS fica no centro. */
function ArcGauge({ model, width }: { model: CardModel; width: number }) {
  const sorted = [...model.members].sort((a, b) => b.share - a.share);
  const R = 360;
  const cx = width / 2;
  const cy = 372;
  const len = Math.PI * R;
  let acc = 0;
  const d = `M${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`;
  return (
    <svg className="tc-gauge" width={width} height={cy + 14} viewBox={`0 0 ${width} ${cy + 14}`} aria-hidden="true">
      <path d={d} fill="none" stroke="var(--track)" strokeWidth="30" strokeLinecap="butt" />
      {sorted.map((m) => {
        const seg = Math.max(m.share, 0) * len;
        const el = <path key={m.name} d={d} fill="none" stroke={m.color} strokeWidth="30" strokeDasharray={`${Math.max(seg - 3, 0)} ${len}`} strokeDashoffset={-acc} />;
        acc += seg;
        return el;
      })}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const a = Math.PI * (1 - t);
        return <path key={t} d={starPath(cx + (R + 38) * Math.cos(a), cy - (R + 38) * Math.sin(a), t % 0.5 === 0 ? 7 : 4)} fill="#e9c46a" opacity={t % 0.5 === 0 ? 0.9 : 0.5} />;
      })}
    </svg>
  );
}

export function TallCard({ model }: { model: CardModel }) {
  const inner = W - 144;
  const sorted = [...model.members].sort((a, b) => b.share - a.share);
  const subtitle = [model.badge, model.tag].filter(Boolean).join(' · ');
  return (
    <article className="pc pc-tall" style={{ width: W, height: H, ...css({ '--accent': model.accent }) }} aria-label={`Card: ${model.title}`}>
      <svg className="pc-sky" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <path d={`M${W - 420} 0 A 760 760 0 0 1 ${W} 760`} fill="none" stroke="#1E2647" strokeWidth="1" />
        <path d={`M${W - 520} 0 A 900 900 0 0 1 ${W} 900`} fill="none" stroke="#161D3B" strokeWidth="1" />
        <path d={`M0 ${H - 300} A 700 700 0 0 0 520 ${H}`} fill="none" stroke="#161D3B" strokeWidth="1" />
        <path d={starPath(W - 92, 116, 9)} fill="#E9C46A" opacity=".85" />
        <path d={starPath(W - 250, 70, 5)} fill="#E7EAF6" opacity=".5" />
        <path d={starPath(130, H - 150, 6)} fill="#E7EAF6" opacity=".45" />
        <path d={starPath(60, H - 420, 8)} fill="#E9C46A" opacity=".5" />
      </svg>

      <header className="pc-top">
        <span className="pc-brand">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.6" aria-hidden="true"><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" /></svg>
          ASTRALYS
        </span>
        {model.nick && <span className="pc-nick">por {model.nick}</span>}
      </header>

      <div className="tc-title">
        <span className="pc-sub">{subtitle || 'Rotação de time'}</span>
        <h1 className={model.title.length > 44 ? 'xlong' : model.title.length > 26 ? 'long' : undefined}>{model.title}</h1>
      </div>

      <section className="tc-members" aria-label="Personagens">
        {sorted.map((m, i) => (
          <div key={m.name} className="tc-tile" style={css({ '--c': m.color })}>
            <Strip name={m.name} icon={m.icon} color={m.color} />
            <span className="tc-rank num">{i + 1}</span>
            <div className="tc-cap">
              <span className="n">{m.name}</span>
              <span className="w">{m.weapon}</span>
              <GearLine gear={m.gear} />
              <div className="row">
                <span className="s num">{formatPercent(m.share, m.share < 0.1 ? 1 : 0)}</span>
                <span className="c num">CR {formatPercent(m.critRate, 0)} · CD {formatPercent(m.critDmg, 0)}</span>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="tc-dps" aria-label="DPS do time">
        <ArcGauge model={model} width={inner} />
        <div className="mid">
          <span className="k">DPS do time</span>
          <span className="big num">{thousands(model.dps)}</span>
        </div>
      </section>

      <section className="tc-kpis">
        <div><span className="v num">{formatDecimal(model.dpr / 1e6, 2)} mi</span><span className="l">dano na rotação</span></div>
        <div><span className="v num">{formatDecimal(model.duration, 1)} s</span><span className="l">duração</span></div>
        {model.reaction && <div><span className="v num">{formatPercent(model.reaction.fraction, 0)}</span><span className="l">vem de {model.reaction.name}</span></div>}
      </section>

      <footer className="tc-rot">
        <div className="tc-rothead"><span className="k">Rotação</span><i /><span className="num">Nv {model.characterLevel} vs {model.enemyLevel}</span></div>
        <RotationLanes model={model} width={inner} rowH={62} labelW={150} letters />
        <p className="tc-seq">{model.sequence}</p>
      </footer>
    </article>
  );
}
