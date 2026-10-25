/** Configurações da rotação: duração, cenário (inimigo e nível), elementos, realinhar golpes, perfis fixos e restaurar o exemplo. */
import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '../../design/Button';
import { effectiveDuration, type RotationProject } from '../../engine';
import { DEFAULT_REALIGN_STEP, MIN_REALIGN_STEP, lastActionTime } from '../../features/rotation/projectOps';
import { SAMPLE_ID, sampleForApp } from '../../features/rotation/persistence';
import { useRotationStore } from '../../features/rotation/store';
import { formatInt } from '../../ui/format';
import { Num, Sel, Seg, dec } from './ui';

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rt-cfg-sec">
      <header>
        <h3>{title}</h3>
        {hint && <p>{hint}</p>}
      </header>
      {children}
    </section>
  );
}

export function SettingsDialog({ project, dps, onClose }: { project: RotationProject; dps: number; onClose: () => void }) {
  const updateConfig = useRotationStore((s) => s.updateConfig);
  const realign = useRotationStore((s) => s.realign);
  const convert = useRotationStore((s) => s.convertProfilesToWindows);
  const setElementMode = useRotationStore((s) => s.setElementMode);
  const open = useRotationStore((s) => s.open);
  const [step, setStep] = useState(DEFAULT_REALIGN_STEP);
  const cfg = project.config;
  const last = lastActionTime(project);
  const duration = effectiveDuration(project);
  const planilha = project.compat === 'planilha';
  const manual = cfg.durationManual === true || planilha;
  const hasManual = project.actions.some((a) => a.tagSource === 'manual');
  const canTighten = project.actions.length > 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="dz-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rt-dialog" role="dialog" aria-modal="true" aria-label="Configurações da rotação">
        <header>
          <h2>Configurações</h2>
          <div className="rt-cfg-live" aria-live="polite" title="O DPS muda na hora, conforme você ajusta">
            <span className="rt-lbl">DPS ao vivo</span>
            <b className="num">{formatInt(dps)}</b>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>Fechar</Button>
        </header>

        <div className="rt-dialog-body">
          <Section title="Duração da rotação" hint="Automática: vai até o último golpe (ou até o fim de um golpe contínuo). Manual: você escolhe; o DPS é o dano total dividido por ela.">
            <Seg
              label="Duração"
              value={manual ? 'manual' : 'auto'}
              onChange={(m) => (m === 'manual' ? updateConfig({ rotationDuration: duration }) : updateConfig({ durationManual: false }))}
              options={[{ value: 'auto', label: `Automática (${dec(Math.max(last, 0.5), 1)} s)` }, { value: 'manual', label: 'Manual' }]}
            />
            <div className="rt-cfg-row">
              <Num label="Duração" value={duration} unit="s" min={0.5} onCommit={(v) => updateConfig({ rotationDuration: v })} />
              {planilha && <p className="rt-note">Projeto no modo planilha: a duração é a da planilha, por isso é manual.</p>}
            </div>
          </Section>

          <Section title="Cenário" hint="Vale para todos os golpes. Mudou aqui, o dano muda na hora.">
            <div className="rt-cfg-grid">
              <Num label="Nível dos personagens" value={cfg.characterLevel} digits={0} min={1} onCommit={(v) => updateConfig({ characterLevel: v })} />
              <Num label="Nível do inimigo" value={cfg.enemyLevel} digits={0} min={1} onCommit={(v) => updateConfig({ enemyLevel: v })} />
              <Num label="RES base do inimigo" value={Math.round(cfg.enemyBaseRes * 1000) / 10} unit="%" onCommit={(v) => updateConfig({ enemyBaseRes: v / 100 })} />
              <Num label="Redução de DEF" value={Math.round(cfg.enemyDefRed * 1000) / 10} unit="%" min={0} onCommit={(v) => updateConfig({ enemyDefRed: v / 100 })} />
              <Num label="Rolls mínimos por substat" value={cfg.minRollsPerSubstat} digits={0} min={0} onCommit={(v) => updateConfig({ minRollsPerSubstat: v })} />
            </div>
          </Section>

          <Section title="Elemento dos golpes" hint="O que vale para um golpe sem elemento escolhido.">
            <Sel<'kit' | 'personagem'>
              ariaLabel="Elemento dos golpes sem elemento escolhido"
              value={planilha ? 'personagem' : project.elementMode}
              onChange={setElementMode}
              options={[{ value: 'kit', label: 'Pelo kit do jogo (ataque normal de arma é Físico)' }, { value: 'personagem', label: 'Sempre o do personagem (modo antigo)' }]}
            />
            <p className="rt-note">
              No jogo, o ataque normal, carregado e de queda de quem usa espada, montante, lança ou arco é Físico; só a habilidade, o supremo e os golpes elementais do kit têm elemento.
              Infusões (Hu Tao, Xiao, Yoimiya…) se escolhem na aba Talentos do personagem ou em cada golpe. {planilha ? 'O modo planilha usa sempre o elemento do personagem.' : ''}
            </p>
          </Section>

          <Section title="Realinhar os golpes" hint="Mantém a ordem e tira os espaços vazios: os golpes ficam um logo depois do outro, a partir de 0 s. As barras de buff acompanham. Ctrl+Z desfaz.">
            <div className="rt-cfg-row inline">
              <Num label="Intervalo entre golpes" value={step} unit="s" min={MIN_REALIGN_STEP} onCommit={setStep} />
              <Button variant="secondary" size="md" disabled={!canTighten} onClick={() => realign(step)}>Realinhar agora</Button>
            </div>
          </Section>

          {hasManual && (
            <Section title="Perfis fixos de buff" hint="Alguns golpes usam perfis fixos, como na planilha: mudar o tempo deles ou as barras não altera os buffs que valem para eles. Converta em janelas para editar os buffs no tempo; o dano continua o mesmo.">
              <div><Button variant="secondary" size="md" onClick={convert}>Converter perfis em janelas</Button></div>
            </Section>
          )}

          {project.id === SAMPLE_ID && (
            <Section title="Exemplo" hint="Volta ao exemplo original, com os buffs em janelas. Suas mudanças neste exemplo se perdem.">
              <div><Button variant="secondary" size="md" onClick={() => open(sampleForApp())}>Restaurar exemplo</Button></div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
