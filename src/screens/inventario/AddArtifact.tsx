/**
 * Adicionar um artefato ao inventário: por print (leitura de texto no navegador) ou à mão, no mesmo formulário.
 * O print só preenche o formulário; o usuário confere antes de salvar. Cada substat mostra seus procs (rolls).
 */
import { useEffect, useRef, useState } from 'react';
import { toast } from '../../app/toast';
import { pieceIconUrl } from '../../design/images';
import { Segmented } from '../../design/primitives';
import { SUB_KEYS, artifactProcs, maxProcs, procRange, type SubKey } from '../../features/good/artifactProcs';
import { readArtifactImage, setKeyOf, type ParsedArtifact, type SlotKey } from '../../features/good/artifactOcr';
import type { Good, GoodArtifact } from '../../features/good/goodImport';
import { activeDatabaseId, listDatabases, loadGood, saveGood } from '../../features/good/goodStore';
import { MAIN_LABEL, SUB_LABEL } from '../../features/good/labels';
import { EMPTY_GOOD } from './Bases';
import '../inventario.css';

const SLOTS: { value: SlotKey; label: string }[] = [
  { value: 'flower', label: 'Flor' }, { value: 'plume', label: 'Pluma' }, { value: 'sands', label: 'Areia' }, { value: 'goblet', label: 'Cálice' }, { value: 'circlet', label: 'Tiara' },
];
const DMG = ['pyro_dmg_', 'hydro_dmg_', 'electro_dmg_', 'cryo_dmg_', 'anemo_dmg_', 'geo_dmg_', 'dendro_dmg_', 'physical_dmg_'];
/** Main stats possíveis por posição (flor e pluma são fixos). */
export const MAIN_BY_SLOT: Record<SlotKey, string[]> = {
  flower: ['hp'],
  plume: ['atk'],
  sands: ['hp_', 'atk_', 'def_', 'eleMas', 'enerRech_'],
  goblet: ['hp_', 'atk_', 'def_', 'eleMas', ...DMG],
  circlet: ['hp_', 'atk_', 'def_', 'eleMas', 'critRate_', 'critDMG_', 'heal_'],
};

interface Draft { setKey: string; slotKey: SlotKey; rarity: 4 | 5; level: number; mainStatKey: string; subs: { key: SubKey | ''; value: string }[] }
const blank = (): Draft => ({ setKey: '', slotKey: 'flower', rarity: 5, level: 20, mainStatKey: 'hp', subs: [0, 1, 2, 3].map(() => ({ key: '', value: '' })) });

function fromParsed(p: ParsedArtifact, prev: Draft): Draft {
  const slotKey = p.slotKey ?? prev.slotKey;
  const main = p.mainStatKey && MAIN_BY_SLOT[slotKey].includes(p.mainStatKey) ? p.mainStatKey : MAIN_BY_SLOT[slotKey][0];
  const subs = [0, 1, 2, 3].map((i) => (p.substats[i] ? { key: p.substats[i].key, value: String(p.substats[i].value) } : { key: '' as const, value: '' }));
  return { setKey: p.setKey ?? prev.setKey, slotKey, rarity: p.rarity, level: p.level ?? prev.level, mainStatKey: main, subs };
}

type SetInfo = { id?: number; name: string; namePt?: string; rarity?: number };

function SetIcon({ set, slot }: { set: SetInfo; slot: SlotKey }) {
  const [failed, setFailed] = useState(false);
  return set.id == null || failed ? <b className="aa-seticon ph" aria-hidden="true" /> : <img className="aa-seticon" src={pieceIconUrl(set.id, slot)} alt="" loading="lazy" crossOrigin="anonymous" onError={() => setFailed(true)} />;
}

/** Escolha do set com a imagem da peça (um select nativo não mostra imagens). */
function SetSelect({ sets, value, slot, onChange }: { sets: readonly SetInfo[]; value: string; slot: SlotKey; onChange: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);
  const cur = sets.find((s) => setKeyOf(s.name) === value);
  const term = q.trim().toLowerCase();
  const list = [...sets].filter((s) => !term || s.name.toLowerCase().includes(term) || (s.namePt ?? '').toLowerCase().includes(term)).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="aa-setsel" ref={box} onKeyDown={(e) => { if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); } }}>
      <button type="button" className="dz-input aa-setbtn" aria-label="Set" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}>
        {cur ? <><SetIcon set={cur} slot={slot} /><span>{cur.namePt && cur.namePt !== cur.name ? `${cur.name} · ${cur.namePt}` : cur.name}</span></> : <span className="muted">Escolha o set…</span>}
      </button>
      {open && (
        <div className="aa-setlist">
          <input className="dz-input" type="search" autoFocus placeholder="Buscar set" aria-label="Buscar set" value={q} onChange={(e) => setQ(e.target.value)} />
          <ul role="listbox" aria-label="Sets">
            {list.length === 0 && <li className="muted small">Nenhum set encontrado.</li>}
            {list.map((s) => (
              <li key={s.name} role="option" aria-selected={setKeyOf(s.name) === value}>
                <button type="button" onClick={() => { onChange(setKeyOf(s.name)); setOpen(false); setQ(''); }}>
                  <SetIcon set={s} slot={slot} />
                  <span>{s.name}{s.namePt && s.namePt !== s.name ? <small>{s.namePt}</small> : null}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const fromGood = (a: GoodArtifact): Draft => ({
  setKey: a.setKey, slotKey: a.slotKey as SlotKey, rarity: a.rarity === 4 ? 4 : 5, level: a.level ?? 20, mainStatKey: a.mainStatKey,
  subs: [0, 1, 2, 3].map((i) => (a.substats[i] ? { key: a.substats[i].key as SubKey, value: String(a.substats[i].value) } : { key: '' as const, value: '' })),
});

/** Sem `onSubmit` salva no inventário; com `onSubmit` entrega o artefato a quem chamou (build manual: não vai para o inventário). */
export function AddArtifact({ sets, onClose, onSaved, initial, onSubmit }: { sets: readonly SetInfo[]; onClose: () => void; onSaved?: () => void; initial?: GoodArtifact; onSubmit?: (a: GoodArtifact) => void }) {
  const [d, setD] = useState<Draft>(() => (initial ? fromGood(initial) : blank()));
  const [reading, setReading] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const baseName = listDatabases().find((b) => b.id === activeDatabaseId())?.name;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const read = async (blob: Blob) => {
    setNotes([]);
    setPreview(URL.createObjectURL(blob));
    try {
      const p = await readArtifactImage(blob, sets, setReading);
      setD((prev) => fromParsed(p, prev));
      setNotes(p.notes);
      toast(p.notes.length ? 'Li o print, mas confira os campos.' : 'Print lido. Confira e salve.');
    } catch (e) {
      toast(`Não foi possível ler o print: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
      setReading(null);
    }
  };
  // Ctrl+V com uma imagem na área de transferência.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const img = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'));
      if (img) { e.preventDefault(); void read(img); }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  });

  const setSlot = (slotKey: SlotKey) => setD((p) => ({ ...p, slotKey, mainStatKey: MAIN_BY_SLOT[slotKey].includes(p.mainStatKey) ? p.mainStatKey : MAIN_BY_SLOT[slotKey][0] }));
  const setSub = (i: number, patch: Partial<Draft['subs'][number]>) => setD((p) => ({ ...p, subs: p.subs.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));

  const filled = d.subs.filter((s) => s.key && s.value !== '').map((s) => ({ key: s.key as SubKey, value: Number(s.value.replace(',', '.')) }));
  const procs = artifactProcs(filled, d.rarity);
  const cap = maxProcs(d.rarity, d.level);
  const minSubs = d.rarity === 5 ? 3 : 2;
  const problems: string[] = [];
  if (!d.setKey) problems.push('escolha o set');
  if (filled.length < minSubs) problems.push(`preencha pelo menos ${minSubs} substats`);
  if (!procs.ok) problems.push('algum valor de substat não bate com rolls do jogo');
  if (procs.total > cap) problems.push(`são ${procs.total} procs e um +${d.level} de ${d.rarity}★ tem no máximo ${cap}`);

  const save = (again: boolean) => {
    const art: GoodArtifact = { setKey: d.setKey, slotKey: d.slotKey, rarity: d.rarity, mainStatKey: d.mainStatKey, level: d.level, location: '', substats: filled };
    if (onSubmit) { onSubmit(art); return onClose(); }
    const good: Good = loadGood() ?? EMPTY_GOOD;
    if (!saveGood({ ...good, artifacts: [...good.artifacts, art] })) return toast('Não foi possível guardar: o armazenamento do navegador está cheio ou bloqueado.', 'error');
    toast(`Artefato salvo${baseName ? ` em "${baseName}"` : ''}.`);
    onSaved?.();
    if (again) { setD((p) => ({ ...blank(), setKey: p.setKey })); setPreview(null); setNotes([]); } else onClose();
  };

  const usedKeys = new Set(d.subs.map((s) => s.key).filter(Boolean));
  return (
    <div className="dz-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dz-dialog wide aa" role="dialog" aria-modal="true" aria-label="Adicionar artefato">
        <header>
          <h2 className="h2">{onSubmit ? 'Artefato do build manual' : 'Adicionar artefato'}</h2>
          <button type="button" className="dz-btn sm" onClick={onClose}>Fechar</button>
        </header>
        <div className="aa-body">
          <section className="aa-shot" aria-label="Ler de um print">
            <button type="button" className="aa-drop" disabled={!!reading} onClick={() => file.current?.click()}
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) void read(f); }}>
              {preview ? <img src={preview} alt="Print do artefato" /> : <><b>Ler de um print</b><span>Arraste a imagem, cole com Ctrl+V ou clique para escolher.</span></>}
            </button>
            <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void read(f); e.target.value = ''; }} />
            {reading && <p className="aa-status" role="status">{reading}</p>}
            {notes.map((n) => <p key={n} className="aa-note">{n}</p>)}
            <p className="muted small">A leitura é aproximada e roda neste navegador (na primeira vez baixa os dados de idioma). Confira sempre os números ao lado.</p>
          </section>

          <section className="aa-form" aria-label="Dados do artefato">
            <div className="dz-field">
              <span>Set</span>
              <SetSelect sets={sets} value={d.setKey} slot={d.slotKey} onChange={(setKey) => setD((p) => ({ ...p, setKey }))} />
            </div>
            <div className="aa-row">
              <div className="dz-field"><span>Posição</span><Segmented<SlotKey> label="Posição" value={d.slotKey} options={SLOTS} onChange={setSlot} /></div>
              <div className="dz-field"><span>Raridade</span><Segmented<'4' | '5'> label="Raridade" value={String(d.rarity) as '4' | '5'} options={[{ value: '4', label: '4★' }, { value: '5', label: '5★' }]} onChange={(v) => setD({ ...d, rarity: Number(v) as 4 | 5 })} /></div>
            </div>
            <div className="aa-row">
              <label className="dz-field"><span>Nível</span>
                <input type="number" min={0} max={d.rarity === 5 ? 20 : 16} value={d.level} aria-label="Nível" onChange={(e) => setD({ ...d, level: Math.max(0, Math.min(d.rarity === 5 ? 20 : 16, Number(e.target.value) || 0)) })} />
              </label>
              <label className="dz-field"><span>Stat principal</span>
                <select value={d.mainStatKey} disabled={MAIN_BY_SLOT[d.slotKey].length === 1} onChange={(e) => setD({ ...d, mainStatKey: e.target.value })} aria-label="Stat principal">
                  {MAIN_BY_SLOT[d.slotKey].map((k) => <option key={k} value={k}>{MAIN_LABEL[k] ?? k}</option>)}
                </select>
              </label>
            </div>
            <fieldset className="aa-subs">
              <legend>Substats</legend>
              {d.subs.map((s, i) => {
                const n = s.key && s.value !== '' ? procRange(s.key, Number(s.value.replace(',', '.')), d.rarity) : null;
                const bad = s.key && s.value !== '' && !n;
                return (
                  <div className="aa-sub" key={i}>
                    <select className="dz-input" value={s.key} onChange={(e) => setSub(i, { key: e.target.value as SubKey | "" })} aria-label={`Substat ${i + 1}`}>
                      <option value="">—</option>
                      {SUB_KEYS.filter((k) => k !== d.mainStatKey && (!usedKeys.has(k) || k === s.key)).map((k) => <option key={k} value={k}>{SUB_LABEL[k]}</option>)}
                    </select>
                    <input className="dz-input" inputMode="decimal" value={s.value} placeholder="valor" aria-label={`Valor do substat ${i + 1}`} onChange={(e) => setSub(i, { value: e.target.value })} />
                    <span className="aa-proc num" data-bad={bad ? '' : undefined} title="Procs = quantos rolls o valor tem">{bad ? 'valor inválido' : n ? `${n.min === n.max ? n.min : `${n.min}–${n.max}`} ${n.max === 1 && n.min === 1 ? 'proc' : 'procs'}` : ''}</span>
                  </div>
                );
              })}
            </fieldset>
            <p className="aa-total num" data-bad={procs.total > cap ? '' : undefined}>Procs: {procs.total} de {cap} possíveis no +{d.level}</p>
            {problems.length > 0 && <p className="aa-note">Falta: {problems.join('; ')}.</p>}
          </section>
        </div>
        <footer className="aa-foot">
          <span className="muted small">{onSubmit ? 'Fica só neste time, não vai para o inventário.' : `Salva em ${baseName ? `"${baseName}"` : 'uma base nova'}.`}</span>
          {!onSubmit && <button type="button" className="dz-btn" disabled={problems.length > 0} onClick={() => save(true)}>Salvar e adicionar outro</button>}
          <button type="button" className="dz-btn gold" disabled={problems.length > 0} onClick={() => save(false)}>{onSubmit ? 'Usar' : 'Salvar'}</button>
        </footer>
      </div>
    </div>
  );
}
