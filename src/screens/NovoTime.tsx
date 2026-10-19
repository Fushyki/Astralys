/** Montar um time (/novo): 3 passos (personagens, builds, rotação) e o time abre pronto na tela Equipe. */
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AppHeader } from '../app/AppHeader';
import { CharacterPickerDialog } from '../design/CharacterPickerDialog';
import { elementColor } from '../design/elements';
import '../design/design.css';
import { CharacterAvatar } from '../design/primitives';
import { MAX_TEAM_SIZE, type MemberRef } from '../engine';
import { applyGoodToMembers, enkaToGood } from '../features/enka/enkaImport';
import { useGameData } from '../features/rotation/data';
import { buildNewTeam, defaultTeamName, type RotationStart } from '../features/rotation/newTeam';
import { saveProject } from '../features/rotation/persistence';
import { ONLINE_ENABLED } from '../online/config';
import { fetchEnka, UID_PATTERN } from '../online/enka';
import './novoTime.css';

type Step = 1 | 2 | 3;
const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: 'Personagens' },
  { n: 2, label: 'Builds' },
  { n: 3, label: 'Rotação' },
];

export default function NovoTime() {
  const navigate = useNavigate();
  const { data } = useGameData();
  const [step, setStep] = useState<Step>(1);
  const [picked, setPicked] = useState<string[]>([]);
  const [picking, setPicking] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [params] = useSearchParams();
  const [source, setSource] = useState<'default' | 'uid'>(ONLINE_ENABLED && params.get('origem') === 'uid' ? 'uid' : 'default');
  const [uid, setUid] = useState(() => {
    try {
      return localStorage.getItem('astralys.uid') ?? '';
    } catch {
      return '';
    }
  });
  const [builds, setBuilds] = useState<Record<string, MemberRef>>({});
  const [uidNote, setUidNote] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [rotation, setRotation] = useState<RotationStart>('basic');
  const [error, setError] = useState<string | null>(null);

  const characters = data?.game.characters ?? [];
  const characterOf = (n: string) => characters.find((c) => c.name === n);
  const slots = useMemo(() => Array.from({ length: MAX_TEAM_SIZE }, (_, i) => picked[i] ?? null), [picked]);

  const pick = (n: string) => {
    setPicked((p) => (picking !== null && picking < p.length ? p.map((x, i) => (i === picking ? n : x)) : [...p, n]));
    setBuilds({});
    setUidNote(null);
    setPicking(null);
  };
  const remove = (i: number) => {
    setPicked((p) => p.filter((_, k) => k !== i));
    setBuilds({});
    setUidNote(null);
  };

  const fromGame = async () => {
    if (!data) return;
    setError(null);
    setUidNote(null);
    setFetching(true);
    try {
      const enka = await fetchEnka(uid);
      const r = enkaToGood(enka, data.game);
      if (!r.characters.length) throw new Error(r.notes[0] ?? 'Nenhum personagem importável na vitrine deste jogador.');
      const base = picked.map((n) => buildNewTeam({ characters: [n], rotation: 'blank' }, data.game).members[0]);
      const out = applyGoodToMembers(base, r.good, data.game);
      setBuilds(Object.fromEntries(out.members.map((m) => [m.character, m])));
      try {
        localStorage.setItem('astralys.uid', uid.trim());
      } catch {
        /* sem armazenamento: o UID não fica lembrado */
      }
      setUidNote(
        `${out.applied.length ? `Build real importado de: ${out.applied.join(', ')}.` : 'Nenhum dos personagens escolhidos está na vitrine deste jogador.'}${out.missing.length ? ` Sem build real (usam o padrão): ${out.missing.join(', ')}.` : ''}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setFetching(false);
    }
  };

  const create = () => {
    if (!data) return;
    try {
      const project = buildNewTeam(
        { name, characters: picked, builds: source === 'uid' ? builds : undefined, rotation, gameVersion: data.meta.gameVersion },
        data.game,
      );
      saveProject(project);
      navigate(`/projeto/${project.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="dz">
      <AppHeader />
      <main className="dz-page nt-page">
        <section className="dz-pagehead">
          <div className="titles">
            <h1 className="h1">Montar um time</h1>
            <span className="muted">3 passos rápidos. Você pode mudar tudo depois.</span>
          </div>
          <div className="actions"><Link className="dz-btn" to="/vault">Cancelar</Link></div>
        </section>

        <ol className="nt-steps" aria-label="Passos">
          {STEPS.map((s) => (
            <li key={s.n} aria-current={step === s.n ? 'step' : undefined} data-done={step > s.n}>
              <span className="n">{step > s.n ? '✓' : s.n}</span>
              {s.label}
            </li>
          ))}
        </ol>

        {error && <p className="dz-error" role="alert">{error}</p>}

        {step === 1 && (
          <section className="dz-panel nt-panel" aria-label="Passo 1: personagens">
            <h2 className="h2">Quem está no time?</h2>
            <p className="muted">Escolha de 1 a {MAX_TEAM_SIZE} personagens. Costuma ser 1 principal e 3 de apoio.</p>
            <div className="nt-slots">
              {slots.map((n, i) => {
                const c = n ? characterOf(n) : undefined;
                return (
                  <div key={i} className="nt-slot" data-filled={!!n}>
                    {n && c ? (
                      <>
                        <CharacterAvatar name={n} icon={c.icon} color={elementColor(c.element)} size={72} />
                        <b>{n}</b>
                        <span className="muted small">{c.element}</span>
                        <div className="nt-slot-acts">
                          <button type="button" className="dz-link" onClick={() => setPicking(i)}>Trocar</button>
                          <button type="button" className="dz-link" onClick={() => remove(i)}>Remover</button>
                        </div>
                      </>
                    ) : (
                      <button type="button" className="nt-add" disabled={!data || i > picked.length} onClick={() => setPicking(i)} aria-label={`Escolher o personagem ${i + 1}`}>
                        <span aria-hidden="true">+</span>
                        {i === 0 ? 'Escolher o principal' : 'Escolher'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <label className="dz-field nt-name">
              <span>Nome do time (opcional)</span>
              <input value={name} maxLength={120} placeholder={defaultTeamName(picked) === 'Novo time' ? 'Ex.: Melt do Hu Tao' : defaultTeamName(picked)} onChange={(e) => setName(e.target.value)} />
            </label>
          </section>
        )}

        {step === 2 && (
          <section className="dz-panel nt-panel" aria-label="Passo 2: builds">
            <h2 className="h2">De onde vem o build de cada um?</h2>
            <p className="muted">Build é a arma, os artefatos e os substats.</p>
            <div className="nt-choices" role="radiogroup" aria-label="Origem dos builds">
              <label className="nt-choice" data-on={source === 'default'}>
                <input type="radio" name="source" checked={source === 'default'} onChange={() => setSource('default')} />
                <span>
                  <b>Build padrão (recomendado para começar)</b>
                  <small>Arma de base, artefatos 5★ com atributos típicos e os substats distribuídos automaticamente. Você ajusta na tela do personagem.</small>
                </span>
              </label>
              <label className="nt-choice" data-on={source === 'uid'} data-disabled={!ONLINE_ENABLED}>
                <input type="radio" name="source" checked={source === 'uid'} disabled={!ONLINE_ENABLED} onChange={() => setSource('uid')} />
                <span>
                  <b>Importar o meu build pelo UID do jogo</b>
                  <small>{ONLINE_ENABLED ? 'Traz arma, artefatos, constelação e talentos reais dos personagens que estão na sua vitrine do jogo.' : 'Disponível quando o site estiver conectado ao servidor.'}</small>
                </span>
              </label>
            </div>
            {source === 'uid' && ONLINE_ENABLED && (
              <form className="nt-uid" onSubmit={(e) => { e.preventDefault(); void fromGame(); }}>
                <input className="dz-input" inputMode="numeric" placeholder="UID (9 ou 10 números)" aria-label="UID do jogo" value={uid} onChange={(e) => setUid(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                <button type="submit" className="dz-btn" disabled={fetching || !UID_PATTERN.test(uid.trim())}>{fetching ? 'Buscando…' : 'Buscar'}</button>
                {uidNote && <p className="note" role="status">{uidNote}</p>}
                <p className="muted small">Os personagens precisam estar na vitrine do jogo, com os detalhes visíveis.</p>
              </form>
            )}
          </section>
        )}

        {step === 3 && (
          <section className="dz-panel nt-panel" aria-label="Passo 3: rotação">
            <h2 className="h2">Como começa a rotação?</h2>
            <p className="muted">A rotação é a ordem dos golpes na linha do tempo. Você muda depois arrastando.</p>
            <div className="nt-choices" role="radiogroup" aria-label="Rotação inicial">
              <label className="nt-choice" data-on={rotation === 'basic'}>
                <input type="radio" name="rotation" checked={rotation === 'basic'} onChange={() => setRotation('basic')} />
                <span>
                  <b>Básica (recomendada)</b>
                  <small>A habilidade e o supremo de cada personagem, um depois do outro. Dá um primeiro número para você melhorar.</small>
                </span>
              </label>
              <label className="nt-choice" data-on={rotation === 'blank'}>
                <input type="radio" name="rotation" checked={rotation === 'blank'} onChange={() => setRotation('blank')} />
                <span>
                  <b>Em branco</b>
                  <small>Nenhum golpe: você monta tudo na linha do tempo.</small>
                </span>
              </label>
            </div>
            <p className="note">Seu time: <b>{name.trim() || defaultTeamName(picked)}</b> ({picked.length} {picked.length === 1 ? 'personagem' : 'personagens'}).</p>
          </section>
        )}

        <div className="nt-nav">
          {step > 1 && <button type="button" className="dz-btn" onClick={() => setStep((step - 1) as Step)}>Voltar</button>}
          {step < 3 && <button type="button" className="dz-btn gold" disabled={picked.length === 0} onClick={() => setStep((step + 1) as Step)}>Continuar</button>}
          {step === 3 && <button type="button" className="dz-btn gold" disabled={!data} onClick={create}>Criar o time</button>}
          {step === 1 && picked.length === 0 && <span className="muted small">Escolha pelo menos um personagem para continuar.</span>}
        </div>

        {picking !== null && data && (
          <CharacterPickerDialog
            title={picking === 0 ? 'Escolher o personagem principal' : 'Escolher personagem'}
            characters={characters}
            exclude={picked.filter((_, i) => i !== picking)}
            onPick={pick}
            onClose={() => setPicking(null)}
          />
        )}
      </main>
    </div>
  );
}
