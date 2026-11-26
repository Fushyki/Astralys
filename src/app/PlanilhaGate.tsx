/**
 * Atualiza, uma vez, os times salvos que ainda estavam no modo planilha (que saiu do site). Só baixa os dados do jogo e a
 * migração quando existe algum a converter; nos demais casos mostra as telas na hora.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { useEffect } from 'react';
import { useGameData } from '../features/rotation/data';
import { hasPlanilhaProjects, planilhaCharacters } from '../features/rotation/planilhaCheck';

export function PlanilhaGate({ children }: { children: ReactNode }) {
  const need = useMemo(hasPlanilhaProjects, []);
  const characters = useMemo(planilhaCharacters, []);
  const { data, error } = useGameData(characters, need);
  const [done, setDone] = useState(!need);
  useEffect(() => {
    if (done || !need) return;
    if (data) {
      void (async () => {
        try {
          const { migratePlanilhaProjects } = await import('../features/rotation/leavePlanilha');
          migratePlanilhaProjects(data);
        } catch (e) {
          console.error('Não foi possível converter os times do modo planilha; tenta de novo na próxima visita.', e);
        } finally {
          setDone(true);
        }
      })();
    } else if (error) setDone(true);
  }, [data, error, need, done]);
  return done ? <>{children}</> : null;
}
