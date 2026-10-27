/**
 * Compartilhar a rotação por arquivo: escolher o que vai (rotação, cenário, buffs de teste, equipe) e baixar; ou importar o
 * arquivo de um amigo e escolher o que aplicar. A rotação importada substitui a atual e pode ser desfeita.
 */
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../design/Button';
import type { RotationProject } from '../../engine';
import { SHARE_PARTS, applyShare, buildShare, downloadShare, parseShare, type ShareFile, type SharePart } from '../../features/rotation/share';
import { useRotationStore } from '../../features/rotation/store';

type Mode = 'share' | 'import';

export function ShareDialog({ project, mode, onClose }: { project: RotationProject; mode: Mode; onClose: () => void }) {
  const applyProject = useRotationStore((s) => s.applyProject);
  const [parts, setParts] = useState<SharePart[]>(['rotation']);
  const [file, setFile] = useState<ShareFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string[] | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggle = (p: SharePart) => setParts((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  const available = mode === 'import' ? SHARE_PARTS.filter((p) => file?.parts.includes(p.id)) : SHARE_PARTS;

  const choose = async (f: File | undefined) => {
    setError(null);
    setDone(null);
    setFile(null);
    if (!f) return;
    try {
      const parsed = parseShare(JSON.parse(await f.text()));
      if (!parsed) throw new Error('Este arquivo não é de "Compartilhar rotação". Para abrir um time inteiro, use Importar no Vault.');
      setFile(parsed);
      // Por padrão aplica tudo que o arquivo traz, menos a equipe (quem recebe costuma querer o próprio time).
      setParts(parsed.parts.filter((p) => p !== 'team'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível ler o arquivo.');
    }
  };

  const apply = () => {
    if (!file) return;
    try {
      const r = applyShare(project, file, parts);
      applyProject(r.project);
      setDone([`Aplicado: ${r.applied.map((p) => SHARE_PARTS.find((x) => x.id === p)!.label.toLowerCase()).join(', ') || 'nada'}.`, ...r.warnings]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível aplicar o arquivo.');
    }
  };

  return (
    <div className="dz-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rt-dialog rt-share" role="dialog" aria-modal="true" aria-label={mode === 'share' ? 'Compartilhar a rotação' : 'Importar uma rotação'}>
        <header>
          <h2>{mode === 'share' ? 'Compartilhar a rotação' : 'Importar uma rotação'}</h2>
          <Button variant="secondary" size="sm" onClick={onClose}>Fechar</Button>
        </header>
        <div className="rt-dialog-body">
          {mode === 'import' && (
            <section className="rt-cfg-sec">
              <header><h3>Arquivo</h3><p>Escolha o arquivo .astralys-rotacao.json que um amigo mandou.</p></header>
              <input ref={input} type="file" accept=".json,application/json" aria-label="Escolher o arquivo da rotação" onChange={(e) => void choose(e.target.files?.[0])} />
              {file && <p className="note">“{file.name}” · {file.members.join(', ')} · {new Date(file.createdAt).toLocaleDateString('pt-BR')}</p>}
            </section>
          )}
          {(mode === 'share' || file) && (
            <section className="rt-cfg-sec">
              <header><h3>{mode === 'share' ? 'O que vai no arquivo' : 'O que aplicar neste time'}</h3></header>
              <div className="rt-share-parts" role="group" aria-label="Partes">
                {available.map((p) => (
                  <label key={p.id} className="part">
                    <input type="checkbox" checked={parts.includes(p.id)} onChange={() => toggle(p.id)} />
                    <span><b>{p.label}</b><small>{p.hint}</small></span>
                  </label>
                ))}
              </div>
              {mode === 'import' && parts.includes('team') && <p className="note">A equipe do arquivo vai substituir a deste time (personagens, armas, sets e peças). Dá para desfazer.</p>}
              {mode === 'import' && !parts.includes('team') && file && <p className="note">A rotação entra pelos nomes dos personagens: o que for de quem não está neste time fica de fora.</p>}
            </section>
          )}
          {error && <p className="dz-error" role="alert">{error}</p>}
          {done && (
            <div className="note" role="status">
              {done.map((l) => <p key={l}>{l}</p>)}
            </div>
          )}
          <div className="rt-acts">
            {mode === 'share' ? (
              <Button variant="primary" size="md" disabled={parts.length === 0} onClick={() => { downloadShare(buildShare(project, parts)); onClose(); }}>Baixar arquivo</Button>
            ) : (
              <Button variant="primary" size="md" disabled={!file || parts.length === 0 || !!done} onClick={apply}>Aplicar ao time</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
