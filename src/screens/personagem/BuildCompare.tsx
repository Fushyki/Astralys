/**
 * Avançado: build atual × melhor build otimizada × diferença. A melhor vem do último resultado da aba Otimizar (só na memória
 * da sessão); sem resultado, o painel convida a otimizar.
 */
import type { ProjectView } from '../../app/ProjectContext';
import { Panel } from '../../design/primitives';
import { artifactSig } from '../../features/good/goodImport';
import { RESULT_CACHE, resultKey } from '../../features/optimizer/resultCache';
import { formatDecimal, formatInt, formatPercent } from '../../ui/format';

type Row = { label: string; cur: number; best: number; kind: 'int' | 'pct' | 'dec' };

const fmt = (n: number, kind: Row['kind']) => (kind === 'pct' ? formatPercent(n) : kind === 'dec' ? formatDecimal(n, 1) : formatInt(n));
const signed = (n: number, kind: Row['kind']) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmt(Math.abs(n), kind)}`;

export function BuildComparePanel({ v, index, onOptimize }: { v: ProjectView; index: number; onOptimize: () => void }) {
  const name = v.project.members[index].character;
  const cached = RESULT_CACHE.get(resultKey(v.id, name));
  const equipped = cached?.result.equipped ?? null;
  const sigsOf = (b: { pieces: Parameters<typeof artifactSig>[0][] }) => new Set(b.pieces.map(artifactSig));
  const same = (b: { pieces: Parameters<typeof artifactSig>[0][] }) => {
    if (!equipped) return false;
    const e = sigsOf(equipped);
    return b.pieces.length === equipped.pieces.length && b.pieces.every((p) => e.has(artifactSig(p)));
  };
  // Se a melhor já é a equipada, compara com a segunda melhor (a melhor que não é a equipada).
  const topIsEquipped = !!cached?.result.builds[0] && same(cached.result.builds[0]);
  const best = cached?.result.builds.find((b) => !same(b)) ?? cached?.result.builds[0];
  const bestLabel = topIsEquipped ? 'Segunda melhor' : 'Melhor otimizada';

  if (!cached || !best) {
    return (
      <Panel title="Build atual × melhor build">
        <p className="note">Ainda não há uma otimização deste personagem nesta sessão. Rode a busca na aba Otimizar e a comparação aparece aqui.</p>
        <button type="button" className="dz-btn" onClick={onOptimize}>Ir para Otimizar</button>
      </Panel>
    );
  }

  const base = equipped ?? best;
  const a = base.report.stats;
  const b = best.report.stats;
  const rows: Row[] = [
    { label: cached.caption, cur: base.report.value, best: best.report.value, kind: 'int' },
    { label: 'HP', cur: a.hp, best: b.hp, kind: 'int' },
    { label: 'ATK', cur: a.atk, best: b.atk, kind: 'int' },
    { label: 'DEF', cur: a.def, best: b.def, kind: 'int' },
    { label: 'Maestria Elemental', cur: a.em, best: b.em, kind: 'int' },
    { label: 'Recarga de Energia', cur: a.er, best: b.er, kind: 'pct' },
    { label: 'Taxa Crítica', cur: a.critRate, best: b.critRate, kind: 'pct' },
    { label: 'Dano Crítico', cur: a.critDmg, best: b.critDmg, kind: 'pct' },
  ];
  const sigs = new Set(base.pieces.map(artifactSig));
  const swaps = equipped ? best.pieces.filter((p) => !sigs.has(artifactSig(p))).length : 0;
  const gain = base.report.value > 0 ? best.report.value / base.report.value - 1 : 0;

  return (
    <Panel
      title="Build atual × melhor build"
      aside={equipped ? <span className="muted small">{topIsEquipped ? 'a atual já é a melhor · comparada com a segunda melhor' : `${swaps} ${swaps === 1 ? 'troca' : 'trocas'} de peça`} · {gain > 0 ? '+' : ''}{formatPercent(gain)} no foco</span> : undefined}
    >
      <div className="dz-scroll">
        <table className="dz-table pc-cmp">
          <thead>
            <tr><th scope="col">{equipped ? '' : 'Sem build atual no inventário'}</th><th scope="col">Build atual</th><th scope="col">{bestLabel}</th><th scope="col">Diferença</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const d = r.best - r.cur;
              const tone = Math.abs(d) < 1e-9 ? undefined : d > 0 ? 'var(--pos, #8fd6a0)' : 'var(--neg, #f08a8a)';
              return (
                <tr key={r.label} className={i === 0 ? 'avg' : undefined}>
                  <td>{r.label}</td>
                  <td>{equipped ? fmt(r.cur, r.kind) : '—'}</td>
                  <td>{fmt(r.best, r.kind)}</td>
                  <td style={tone ? { color: tone } : undefined}>{equipped ? signed(d, r.kind) : '—'}{equipped && i === 0 && r.cur > 0 ? ` (${gain > 0 ? '+' : ''}${formatPercent(gain)})` : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="note">Mesma reação e crítico do resto das telas. A melhor build é a primeira do último resultado da aba Otimizar (se ela for a equipada, vale a segunda){equipped ? '; a atual é a equipada hoje pelo inventário' : ''}.</p>
    </Panel>
  );
}
