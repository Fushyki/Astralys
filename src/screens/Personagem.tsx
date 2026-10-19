/** Calculadora do personagem (/projeto/:id/personagem/:nome): build, atributos, tabela de dano, reações e buffs. */
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useProjectView } from '../app/ProjectContext';
import { formatPercent } from '../ui/format';
import { useRotationStore } from '../features/rotation/store';
import { BuildStrip } from './personagem/BuildStrip';
import { CharacterCard, SubstatsPanel } from './personagem/LeftColumn';
import { Attributes, DamageTablePanel, ReactionsPanel, ReceivedBuffsPanel } from './personagem/MainColumn';
import { ToolsPanel, type ToolTab } from './personagem/ToolsPanel';
import './personagem.css';

export default function Personagem() {
  const v = useProjectView();
  const { nome = '' } = useParams();
  const selectMember = useRotationStore((s) => s.selectMember);
  const [tool, setTool] = useState<ToolTab>('optimizer');
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
    toolsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
              to={`/projeto/${v.id}/personagem/${encodeURIComponent(m.character)}`}
              style={{ ['--c' as string]: v.colors[i] }}
            >
              <i />
              {m.character}
              <span className="num pct">{formatPercent(v.summary.members[i]?.fraction ?? 0, (v.summary.members[i]?.fraction ?? 0) < 0.1 ? 1 : 1)}</span>
            </Link>
          ))}
        </div>
      </div>

      <main className="pc-page">
        <aside className="pc-aside">
          <CharacterCard character={character} memberRef={ref} index={index} color={v.colors[index]} level={v.project.config.characterLevel} share={share} />
          <SubstatsPanel memberRef={ref} index={index} bundle={v.bundle} onGood={goToGood} />
        </aside>

        <div className="pc-main">
          <BuildStrip data={v.data} index={index} member={ref} />
          <div className="pc-row a">
            <Attributes v={v} index={index} />
            <DamageTablePanel v={v} index={index} />
          </div>
          <div className="pc-row b">
            <ReactionsPanel v={v} index={index} />
            <ReceivedBuffsPanel v={v} index={index} />
          </div>
          <div ref={toolsRef}>
            <ToolsPanel v={v} index={index} tab={tool} onTab={setTool} />
          </div>
        </div>
      </main>
    </>
  );
}
