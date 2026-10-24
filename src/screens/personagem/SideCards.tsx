/** Coluna esquerda da página do personagem: arte, constelação em mapa de estrelas e talentos em círculos. */
import { useState } from 'react';
import type { Character } from '../../data/schema';
import { CharacterAvatar } from '../../design/primitives';
import { elementColor } from '../../design/elements';
import { effectiveTalents, type MemberRef } from '../../engine';
import { useTalents } from '../../features/character/talents';
import { useRotationStore } from '../../features/rotation/store';
import { formatPercent } from '../../ui/format';

const WEAPON_LABEL: Record<string, string> = { Sword: 'Espada', Claymore: 'Espadão', Polearm: 'Lança', Catalyst: 'Catalisador', Bow: 'Arco' };
const SPLASH = 'https://api.lunaris.moe/data/assets/gachaimg';
const FACTION_LABEL = { moonsign: 'Moonsign', hexerei: 'Hexerei' } as const;
const FACTION_HINT = {
  moonsign: 'Conta como membro Moonsign (regras "Nascent/Ascendant Gleam" do time).',
  hexerei: "Conta como Hexerei (Witch's Homework concluída; 2+ membros dão o Hexerei: Secret Rite).",
} as const;
const clamp = (v: number) => Math.max(1, Math.min(15, Math.round(v)));

function Star({ x, y, lit, size = 9 }: { x: number; y: number; lit: boolean; size?: number }) {
  const s = size;
  // estrela de 4 pontas
  const d = `M${x} ${y - s} L${x + s * 0.28} ${y - s * 0.28} L${x + s} ${y} L${x + s * 0.28} ${y + s * 0.28} L${x} ${y + s} L${x - s * 0.28} ${y + s * 0.28} L${x - s} ${y} L${x - s * 0.28} ${y - s * 0.28} Z`;
  return <path d={d} className="cm-star" data-lit={lit} />;
}

export function ArtCard({
  character, memberRef, index, color, level, eligible,
}: { character: Character; memberRef: MemberRef; index: number; color: string; level: number; eligible: readonly ('moonsign' | 'hexerei')[] }) {
  const update = useRotationStore((s) => s.updateMember);
  const [failed, setFailed] = useState(false);
  const ec = elementColor(character.element);
  return (
    <section className="sc-art" style={{ ['--c' as string]: color, ['--e' as string]: ec }} aria-label={`${character.name}, ${character.element}`}>
      <div className="art">
        {character.splash && !failed ? (
          <img src={`${SPLASH}/${character.splash}.webp`} alt="" crossOrigin="anonymous" loading="lazy" onError={() => setFailed(true)} />
        ) : (
          <CharacterAvatar name={character.name} icon={character.icon} color={color} size={120} />
        )}
        <span className="elem">{character.element.toUpperCase()}</span>
        <span className="lvl num">{level} / 90</span>
      </div>
      <div className="ident">
        <div className="row">
          <h2>{character.name}</h2>
          <span className="weapon">{WEAPON_LABEL[character.weapon] ?? character.weapon}</span>
        </div>
        <div className="stars" aria-label={`${character.rarity} estrelas`}>{'✦'.repeat(character.rarity)}</div>
        {eligible.length > 0 && (
          <div className="factions" role="group" aria-label="Facção">
            {eligible.map((f) => {
              const on = memberRef.factions?.includes(f) ?? false;
              const rest = (memberRef.factions ?? []).filter((x) => x !== f);
              return (
                <button key={f} type="button" aria-pressed={on} title={FACTION_HINT[f]} onClick={() => update(index, { factions: on ? (rest.length ? rest : undefined) : [...rest, f] })}>
                  {FACTION_LABEL[f]}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

/** Pontos do mapa de estrelas (viewBox 220 × 110): C1 a C6, da esquerda para a direita. */
const POINTS: [number, number][] = [[16, 84], [54, 40], [100, 60], [136, 14], [174, 32], [206, 88]];

export function ConstellationCard({ character, memberRef, index }: { character: Character; memberRef: MemberRef; index: number }) {
  const update = useRotationStore((s) => s.updateMember);
  const { data: all } = useTalents();
  const tl = all?.find((t) => t.character === character.name);
  const c = memberRef.constellation ?? 0;
  const set = (n: number) => update(index, { constellation: n === c ? (n - 1 || undefined) : n });
  return (
    <section className="sc-card sc-cons" aria-label="Constelação">
      <header>
        <span className="spark" aria-hidden="true">✦</span>
        <h3>Constelação</h3>
        <span className="badge num">C{c}</span>
      </header>
      <svg viewBox="0 0 220 110" role="group" aria-label="Mapa de estrelas da constelação">
        {POINTS.slice(1).map((p, i) => (
          <line key={i} x1={POINTS[i][0]} y1={POINTS[i][1]} x2={p[0]} y2={p[1]} className="cm-line" data-lit={i + 2 <= c} />
        ))}
        {POINTS.map(([x, y], i) => {
          const n = i + 1;
          const name = tl?.constellations.find((k) => k.n === n)?.name;
          return (
            <g key={n} role="button" tabIndex={0} className="cm-node" data-lit={n <= c} aria-pressed={n <= c} aria-label={`Constelação ${n}${name ? `: ${name}` : ''}`}
              onClick={() => set(n)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), set(n))}>
              <title>{`C${n}${name ? ` · ${name}` : ''}`}</title>
              <circle cx={x} cy={y} r="15" className="hit" />
              <circle cx={x} cy={y} r="11" className="halo" />
              <Star x={x} y={y} lit={n <= c} />
            </g>
          );
        })}
      </svg>
      <p className="muted small">Clique numa estrela para acender até ela. Estrelas acesas brilham em dourado.</p>
    </section>
  );
}

export function TalentsCard({ character, memberRef, index, share }: { character: Character; memberRef: MemberRef; index: number; share: number }) {
  const update = useRotationStore((s) => s.updateMember);
  const eff = effectiveTalents(memberRef.talents, memberRef.constellation, character);
  const rows = [['normal', 'Normal'], ['skill', 'Habilidade'], ['burst', 'Supremo']] as const;
  return (
    <section className="sc-card sc-talents" aria-label="Talentos">
      <header>
        <span className="spark" aria-hidden="true">✦</span>
        <h3>Talentos</h3>
      </header>
      <div className="circles">
        {rows.map(([k, label]) => (
          <label key={k} className="tc">
            <span className="ring">
              <input
                key={String(memberRef.talents[k])}
                type="number" inputMode="numeric" min={1} max={15} step={1}
                aria-label={`Nível de talento: ${label}`}
                defaultValue={memberRef.talents[k]}
                onBlur={(e) => {
                  const v = Number(e.currentTarget.value);
                  if (Number.isFinite(v) && clamp(v) !== memberRef.talents[k]) update(index, { talents: { ...memberRef.talents, [k]: clamp(v) } });
                  else e.currentTarget.value = String(memberRef.talents[k]);
                }}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              />
              {eff[k] > memberRef.talents[k] && <i className="plus num" title="Bônus da constelação">+{eff[k] - memberRef.talents[k]}</i>}
            </span>
            <span className="lbl">{label}</span>
          </label>
        ))}
      </div>
      <span className="muted small num" data-testid="effective-talents">
        Níveis efetivos: {eff.normal}/{eff.skill}/{eff.burst}{(memberRef.constellation ?? 0) >= 3 ? ' (com o +3 da constelação)' : ''} · {formatPercent(share, 1)} do dano do time
      </span>
    </section>
  );
}
