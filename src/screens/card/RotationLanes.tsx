/**
 * Rotação do card: uma faixa por personagem, com cada golpe no instante real em que entra. Estrela pequena = golpe (o tamanho segue o
 * dano), estrela dourada grande = Supremo, barra com pontos = golpe contínuo. Tudo vem de `CardModel.lanes`.
 */
import type { CardModel } from '../../features/card/cardModel';
import { formatDecimal } from '../../ui/format';

/** Estrela de 4 pontas (a unidade visual do Astralys), centrada em (x, y) com raio r. */
export const starPath = (x: number, y: number, r: number): string => {
  const k = r * 0.28;
  return `M${x} ${y - r} L${x + k} ${y - k} L${x + r} ${y} L${x + k} ${y + k} L${x} ${y + r} L${x - k} ${y + k} L${x - r} ${y} L${x - k} ${y - k}Z`;
};

export interface LanesProps {
  model: CardModel;
  width: number;
  rowH: number;
  labelW: number;
  /** Escreve a letra (E, Q...) dos golpes principais. */
  letters?: boolean;
  /** Tamanho do nome do personagem na faixa (px). */
  labelSize?: number;
  /** Régua de tempo embaixo. */
  axis?: boolean;
}

export function RotationLanes({ model, width, rowH, labelW, letters = false, axis = true, labelSize }: LanesProps) {
  const pad = 18;
  const span = width - labelW - pad;
  const x = (t: number) => labelW + t * span;
  const axisH = axis ? 30 : 0;
  const height = model.lanes.length * rowH + axisH;
  const step = model.duration > 24 ? 5 : model.duration > 10 ? 2 : 1;
  const ticks: number[] = [];
  for (let t = 0; t <= model.duration + 1e-6; t += step) ticks.push(t);

  return (
    <svg className="pc-lanes" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Rotação: golpes de cada personagem ao longo do tempo">
      {ticks.map((t) => (
        <line key={t} x1={x(t / model.duration)} x2={x(t / model.duration)} y1={0} y2={model.lanes.length * rowH} stroke="#1b2346" strokeWidth="1" />
      ))}
      {model.lanes.map((lane, i) => {
        const m = model.members[lane.member];
        const cy = i * rowH + rowH / 2;
        let lastLabel = -1e9;
        return (
          <g key={lane.member}>
            {i % 2 === 0 && <rect x={0} y={i * rowH} width={width} height={rowH} fill="#0d1226" opacity=".7" />}
            <circle cx={12} cy={cy} r={5} fill={m.color} />
            <text x={28} y={cy + 6} fill="#c3caea" fontSize={labelSize ?? Math.min(22, rowH * 0.42)} fontFamily="Saira Condensed, sans-serif" fontWeight="700" letterSpacing=".04em">{m.name.toUpperCase().slice(0, 9)}</text>
            <line x1={labelW} x2={width - pad + 6} y1={cy} y2={cy} stroke={m.color} strokeOpacity=".22" strokeWidth="1.5" />
            {lane.hits.map((h, k) => {
              const cx = x(h.at);
              if (h.to !== undefined && h.count > 1) {
                return (
                  <g key={k}>
                    <rect x={cx} y={cy - 5} width={Math.max(x(h.to) - cx, 6)} height={10} rx={5} fill={m.color} opacity=".3" />
                    {h.ticks?.map((t, j) => <path key={j} data-hit="1" d={starPath(x(t), cy, 5)} fill={m.color} />)}
                  </g>
                );
              }
              const r = h.burst ? Math.min(rowH * 0.46, 19) : 6 + h.weight * Math.min(8, rowH * 0.2);
              const showLetter = letters && (h.burst || h.letter === 'E') && cx - lastLabel > 26;
              if (showLetter) lastLabel = cx;
              return (
                <g key={k}>
                  {h.burst && <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke={model.accent} strokeOpacity=".55" strokeWidth="1.5" />}
                  <path data-hit="1" data-burst={h.burst ? '1' : undefined} d={starPath(cx, cy, r)} fill={h.burst ? model.accent : m.color} />
                  {showLetter && (h.burst
                    ? <text x={cx + r + 11} y={cy + 6} fill={model.accent} fontSize="17" fontFamily="Saira Condensed, sans-serif" fontWeight="700">{h.letter}</text>
                    : <text x={cx} y={cy - r - 7} textAnchor="middle" fill={m.color} fontSize="15" fontFamily="Saira Condensed, sans-serif" fontWeight="700">{h.letter}</text>)}
                </g>
              );
            })}
          </g>
        );
      })}
      {axis && ticks.map((t) => (
        <text key={t} x={x(t / model.duration)} y={model.lanes.length * rowH + 22} textAnchor="middle" fill="#7e88b6" fontSize="14" fontFamily="IBM Plex Sans, sans-serif">{formatDecimal(t, 0)} s</text>
      ))}
    </svg>
  );
}
