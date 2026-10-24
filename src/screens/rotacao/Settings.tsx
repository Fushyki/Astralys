/** Configurações da rotação: duração, inimigo, realinhar golpes, converter perfis em janelas e restaurar o exemplo. */
import { useEffect, useState } from 'react';
import { NumberInput, SelectField } from '../../design/fields';
import type { RotationProject } from '../../engine';
import { DEFAULT_REALIGN_STEP, MIN_REALIGN_STEP, lastActionTime } from '../../features/rotation/projectOps';
import { SAMPLE_ID, sampleForApp } from '../../features/rotation/persistence';
import { useRotationStore } from '../../features/rotation/store';
import { formatDecimal } from '../../ui/format';

export function SettingsDialog({ project, onClose }: { project: RotationProject; onClose: () => void }) {
  const updateConfig = useRotationStore((s) => s.updateConfig);
  const realign = useRotationStore((s) => s.realign);
  const convert = useRotationStore((s) => s.convertProfilesToWindows);
  const setElementMode = useRotationStore((s) => s.setElementMode);
  const open = useRotationStore((s) => s.open);
  const [step, setStep] = useState(String(DEFAULT_REALIGN_STEP));
  const stepNum = Number(step.replace(',', '.'));
  const stepOk = Number.isFinite(stepNum) && stepNum >= MIN_REALIGN_STEP;
  const cfg = project.config;
  const last = lastActionTime(project);
  const hasManual = project.actions.some((a) => a.tagSource === 'manual');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="dz-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dz-dialog" role="dialog" aria-modal="true" aria-label="Configurações da rotação">
        <header>
          <h2 className="h2">Configurações</h2>
          <button type="button" className="dz-btn sm" onClick={onClose}>Fechar</button>
        </header>
        <div className="pc-dialog-body">
          <div className="pc-form two">
            <NumberInput label="Duração da rotação" value={cfg.rotationDuration} min={0.5} step={0.5} suffix="s" onCommit={(v) => updateConfig({ rotationDuration: v })} />
            <div style={{ alignSelf: 'end' }}>
              <button type="button" className="dz-link" disabled={last <= 0 || Math.abs(last - cfg.rotationDuration) < 0.005} onClick={() => updateConfig({ rotationDuration: last })}>
                usar o fim do último golpe ({formatDecimal(last, 1)} s)
              </button>
            </div>
            <NumberInput label="Nível do inimigo" value={cfg.enemyLevel} min={1} max={200} step={1} onCommit={(v) => updateConfig({ enemyLevel: v })} />
            <NumberInput label="RES base do inimigo" value={Math.round(cfg.enemyBaseRes * 1000) / 10} step={1} suffix="%" onCommit={(v) => updateConfig({ enemyBaseRes: v / 100 })} />
            <NumberInput label="Redução de DEF" value={Math.round(cfg.enemyDefRed * 1000) / 10} min={0} max={90} step={1} suffix="%" onCommit={(v) => updateConfig({ enemyDefRed: v / 100 })} />
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <SelectField<'kit' | 'personagem'>
              label="Elemento dos golpes sem elemento escolhido"
              value={project.compat === 'planilha' ? 'personagem' : project.elementMode}
              onChange={setElementMode}
              options={[{ value: 'kit', label: 'Pelo kit do jogo (ataque normal de arma é Físico)' }, { value: 'personagem', label: 'Sempre o do personagem (modo antigo)' }]}
            />
            <p className="note">
              No jogo, o ataque normal, carregado e de queda de quem usa espada, montante, lança ou arco é Físico, e só a habilidade, o supremo e os golpes elementais do kit têm elemento.
              Infusões (Hu Tao, Xiao, Yoimiya…) se escolhem na aba Talentos do personagem ou em cada golpe. {project.compat === 'planilha' ? 'O modo planilha usa sempre o elemento do personagem.' : ''}
            </p>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <span className="lbl">Realinhar os golpes</span>
            <p className="note">Mantém a ordem em que você colocou os golpes e tira os espaços vazios: ficam um logo depois do outro, a partir de 0 s. As barras de buff acompanham.</p>
            <div className="pc-acts">
              <label className="dz-field" style={{ width: 140 }}>
                <span>Intervalo (s)</span>
                <input type="number" min={MIN_REALIGN_STEP} step={0.1} value={step} aria-invalid={!stepOk || undefined} aria-label="Intervalo entre golpes ao realinhar, em segundos" onChange={(e) => setStep(e.target.value)} />
              </label>
              <button type="button" className="dz-btn" disabled={!stepOk || project.actions.length === 0} onClick={() => realign(stepNum)} style={{ alignSelf: 'end' }}>Realinhar</button>
            </div>
          </div>

          {hasManual && (
            <div style={{ display: 'grid', gap: 8 }}>
              <span className="lbl">Perfis fixos de buff</span>
              <p className="note">Alguns golpes usam perfis fixos de buff, como na planilha: mudar o tempo deles ou as barras não altera os buffs que valem para eles. Converta os perfis em janelas para editar os buffs no tempo; o dano continua o mesmo.</p>
              <div className="pc-acts"><button type="button" className="dz-btn" onClick={convert}>Converter perfis em janelas</button></div>
            </div>
          )}

          {project.id === SAMPLE_ID && (
            <div className="pc-acts">
              <button type="button" className="dz-btn sm" onClick={() => open(sampleForApp())} title="Volta ao exemplo original, com os buffs em janelas">Restaurar exemplo</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
