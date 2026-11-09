/**
 * Atualiza, uma vez, os times salvos que ainda estavam no modo planilha (que saiu do site). Só espera os dados do jogo quando
 * existe algum a converter; nos demais casos mostra as telas na hora.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { useEffect } from 'react';
import { useGameData } from '../features/rotation/data';
import { hasPlanilhaProjects, migratePlanilhaProjects } from '../features/rotation/leavePlanilha';

export function PlanilhaGate({ children }: { children: ReactNode }) {
  const need = useMemo(hasPlanilhaProjects, []);
  const { data, error } = useGameData();
  const [done, setDone] = useState(!need);
  useEffect(() => {
    if (done || !need) return;
    if (data) {
      migratePlanilhaProjects(data);
      setDone(true);
    } else if (error) setDone(true);
  }, [data, error, need, done]);
  return done ? <>{children}</> : null;
}
