/** Artefatos bloqueados (fora da otimização): lista com a peça inteira para habilitar um a um ou todos de uma vez. */
import { useEffect } from 'react';
import { artifactSig, norm, type GoodArtifact } from '../../features/good/goodImport';
import { MAIN_LABEL, SUB_LABEL, formatMain, formatSub } from '../../features/good/labels';
import { mainStatValue } from '../../engine/pieces';
import { ArtImg, SLOTS, setColor } from './shared';

export function BlockedDialog({ artifacts, sets, onEnable, onEnableAll, onClose }: {
  /** Os artefatos bloqueados que existem no inventário. */
  artifacts: GoodArtifact[];
  sets: { name: string; id: number }[];
  onEnable: (sig: string) => void;
  onEnableAll: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="dz-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dz-dialog wide ot-blocked" role="dialog" aria-modal="true" aria-label="Artefatos bloqueados">
        <header>
          <h2 className="h2">Artefatos bloqueados</h2>
          {artifacts.length > 1 && <button type="button" className="dz-btn sm gold" onClick={onEnableAll}>Habilitar todos</button>}
          <button type="button" className="dz-btn sm" onClick={onClose}>Fechar</button>
        </header>
        <div className="grid ot-blocked-grid">
          {artifacts.length === 0 && <p className="note">Nenhum artefato bloqueado.</p>}
          {artifacts.map((a) => {
            const set = sets.find((x) => norm(x.name) === norm(a.setKey));
            const name = set?.name ?? a.setKey;
            const key = a.slotKey === 'flower' ? 'hp' : a.slotKey === 'plume' ? 'atk' : a.mainStatKey;
            const sig = artifactSig(a);
            return (
              <div className="bk" key={sig} style={{ ['--sc' as string]: setColor(name) }}>
                <span className="art"><ArtImg setId={set?.id} slot={a.slotKey} /><b className="lv num">+{a.level ?? 0}</b></span>
                <span className="t">
                  <b>{SLOTS.find((x) => x.key === a.slotKey)?.label} · {MAIN_LABEL[key] ?? key} <span className="num">{formatMain(key, mainStatValue(key, a.rarity, a.level))}</span></b>
                  <small>{name}</small>
                  <small className="subs">{a.substats.slice(0, 4).map((x) => `${SUB_LABEL[x.key] ?? x.key} ${formatSub(x.key, x.value)}`).join(' · ')}</small>
                </span>
                <button type="button" className="dz-btn sm" onClick={() => onEnable(sig)}>Habilitar</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
