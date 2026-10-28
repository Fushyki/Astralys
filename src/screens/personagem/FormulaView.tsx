/** "Cálculo do dano" de um golpe da tabela do Avançado: a fórmula com os números e de onde vem cada fator (como clicar no número no GO). */
import { useMemo, useState } from 'react';
import type { ProjectView } from '../../app/ProjectContext';
import { Button } from '../../design/Button';
import { Segmented } from '../../design/primitives';
import type { TeamAssembly } from '../../engine';
import type { MoveLine } from '../../features/character/characterModel';
import { damageFormula, formulaText } from '../../features/character/damageFormula';

type Mode = 'avg' | 'crit' | 'noCrit';
const MODES: { value: Mode; label: string }[] = [{ value: 'avg', label: 'Médio' }, { value: 'crit', label: 'Crítico' }, { value: 'noCrit', label: 'Sem crítico' }];

export function FormulaView({ v, index, line, assembly }: { v: ProjectView; index: number; line: MoveLine; assembly: TeamAssembly }) {
  const [mode, setMode] = useState<Mode>('avg');
  const [all, setAll] = useState(false);
  const [copied, setCopied] = useState(false);
  const f = useMemo(
    () => damageFormula({ result: line.result, team: v.resolved.team, assembly, member: index, mode, ampCoefficient: v.resolved.ampCoefficient }),
    [line.result, v.resolved.team, v.resolved.ampCoefficient, assembly, index, mode],
  );
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formulaText(line.name, f));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="fx-calc" aria-label={`Cálculo do dano de ${line.name}`}>
      <div className="fx-head">
        <Segmented label="Crítico do cálculo" value={mode} options={MODES} onChange={setMode} />
        <span className="fx-acts">
          <Button variant="ghost" size="sm" onClick={() => setAll(!all)}>{all ? 'Fechar tudo' : 'Abrir tudo'}</Button>
          <Button variant="ghost" size="sm" onClick={() => void copy()}>{copied ? 'Copiado' : 'Copiar como texto'}</Button>
        </span>
      </div>
      <p className="fx-expr num" data-testid="fx-expr">{f.expr}</p>
      {!f.detailed && <p className="note">Dano de reação (transformativa, Lunar ou Estelar) usa outra fórmula; os fatores acima são os do motor.</p>}
      <div className="fx-blocks" key={String(all)}>
        {f.blocks.map((b) => (
          <details key={b.id} open={all || b.id === 'base'}>
            <summary><span>{b.title}</span><span className="num">{b.total}</span></summary>
            <p className="fx-sub num">{b.expr}</p>
            {b.terms.length > 0 && (
              <ul>
                {b.terms.map((t, i) => <li key={`${t.label}-${i}`}><span>{t.label}</span><span className="num">{t.value}</span></li>)}
              </ul>
            )}
          </details>
        ))}
      </div>
    </div>
  );
}
