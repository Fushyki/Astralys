/** Calculadora do personagem (/projeto/:id/personagem/:nome): build, atributos, tabela de dano, reações e buffs. */
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useProjectView } from '../app/ProjectContext';
import { formatPercent } from '../ui/format';
import { useRotationStore } from '../features/rotation/store';
import { BuildStrip } from './personagem/BuildStrip';
import { CharacterCard, SubstatsPanel } from './personagem/LeftColumn';
import { Attributes, DamageTablePanel, ReactionsPanel, ReceivedBuffsPanel } from './personagem/MainColumn';
import { ToolsPanel, type ToolTab } from './personagem/ToolsPanel';
import { OtimizadorPanel } from './Otimizador';
import { TalentsPanel } from './personagem/TalentsPanel';
import { AsideExtras } from './personagem/AsideExtras';
import './personagem.css';

type View = 'resumo' | 'talentos' | 'avancado' | 'otimizar';
const VIEWS: { id: View; label: string; hint: string }[] = [
  { id: 'resumo', label: 'Resumo e build', hint: 'Quanto este personagem rende, os golpes que mais pesam e o build (arma, artefatos e substats).' },
  { id: 'talentos', label: 'Talentos', hint: 'O que cada talento, passiva e constelação faz, os números dos golpes e os interruptores dos buffs que este personagem dá.' },
  { id: 'otimizar', label: 'Otimizar', hint: 'Os melhores artefatos do seu inventário para este personagem: escolha o que otimizar (dano, um golpe, um buff ou um stat) e o programa busca o melhor build.' },
  { id: 'avancado', label: 'Avançado', hint: 'Tabela de dano completa, reações, buffs recebidos e ferramentas (crítico, inventário GOOD).' },
];

export default function Personagem() {
  const v = useProjectView();
  const { nome = '' } = useParams();
  const selectMember = useRotationStore((s) => s.selectMember);
  const [tool, setTool] = useState<ToolTab>('optimizer');
  const [params, setParams] = useSearchParams();
  const view: View = VIEWS.some((x) => x.id === params.get('aba')) ? (params.get('aba') as View) : 'resumo';
  const goView = (next: View) => setParams(next === 'resumo' ? {} : { aba: next }, { replace: true });
  const toolsRef = useRef<HTMLDivElement>(null);

  const name = decodeURIComponent(nome);
  const index = v.project.members.findIndex((m) => m.character === name);
  useEffect(() => {
    if (index >= 0) selectMember(index);
  }, [index, selectMember]);

  if (index < 0) return <Navigate to={`/projeto/${v.id}/personagem/${encodeURIComponent(v.project.members[0].character)}`} replace />;
  if (!v.inSync || !v.bundle.memberStats[index]) {
    return (
      <main className="dz-page"><p className="note" role="status">Atualizando a equipe…</p></main>
    );
  }

  const ref = v.project.members[index];
  const character = v.data.game.characters.find((c) => c.name === name)!;
  const share = v.summary.members[index]?.fraction ?? 0;
  const goToGood = () => {
    setTool('good');
    goView('avancado');
    setTimeout(() => toolsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  return (
    <>
      <div className="pc-tabs-wrap">
        <div className="pc-tabs" role="tablist" aria-label="Personagens do time">
          {v.project.members.map((m, i) => (
            <Link
              key={m.character}
              role="tab"
              aria-selected={i === index}
              to={`/projeto/${v.id}/personagem/${encodeURIComponent(m.character)}${view === 'resumo' ? '' : `?aba=${view}`}`}
              style={{ ['--c' as string]: v.colors[i] }}
            >
              <i />
              {m.character}
              <span className="num pct">{formatPercent(v.summary.members[i]?.fraction ?? 0, (v.summary.members[i]?.fraction ?? 0) < 0.1 ? 1 : 1)}</span>
            </Link>
          ))}
        </div>
      </div>

      <main className={`pc-page${view === 'otimizar' ? ' opt' : ''}`}>
        <aside className="pc-aside">
          <CharacterCard character={character} memberRef={ref} index={index} color={v.colors[index]} level={v.project.config.characterLevel} share={share} eligible={v.data.effects.characters.find((c) => c.character === character.name)?.factions ?? []} />
          {view === 'otimizar' && <AsideExtras v={v} index={index} />}
        </aside>

        <div className="pc-main">
          <div className="pc-views" role="tablist" aria-label="O que ver neste personagem">
            {VIEWS.map((x) => (
              <button key={x.id} type="button" role="tab" aria-selected={view === x.id} onClick={() => goView(x.id)}>{x.label}</button>
            ))}
          </div>
          <p className="pc-hint">{VIEWS.find((x) => x.id === view)!.hint}</p>

          {view === 'resumo' && (
            <>
              <BuildStrip data={v.data} index={index} member={ref} projectId={v.id} />
              <div className="pc-row a">
                <Attributes v={v} index={index} />
                <div className="pc-col">
                  <SubstatsPanel memberRef={ref} index={index} bundle={v.bundle} onGood={goToGood} bases={{ atk: character.baseAtk + (v.data.game.weapons.find((w) => w.name === ref.weapon)?.baseAtk ?? 0), hp: character.baseHp, def: character.baseDef }} />
                </div>
              </div>
              <p className="pc-next">
                Quer ver todos os golpes, buffs e reações? Abra <button type="button" className="dz-link" onClick={() => goView('avancado')}>Avançado</button>.
              </p>
            </>
          )}
          {view === 'talentos' && <TalentsPanel v={v} index={index} />}
          {view === 'otimizar' && <OtimizadorPanel index={index} />}
          {view === 'avancado' && (
            <>
              <DamageTablePanel v={v} index={index} />
              <div className="pc-row b">
                <ReactionsPanel v={v} index={index} />
                <ReceivedBuffsPanel v={v} index={index} />
              </div>
              <div ref={toolsRef}>
                <ToolsPanel v={v} index={index} tab={tool} onTab={setTool} />
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
