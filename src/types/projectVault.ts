import { DamageAnalysisResult } from './damageBreakdown';
import { RotationTimelineData } from './rotationTimeline';
import { ScenarioDashboardData } from './scenarioAnalysis';

export interface CalculationProject {
  id: string;
  title: string;
  description?: string;
  carryName: string;
  teamNames: string[];
  totalDpr: number;
  dps: number;
  rotationDuration: number;
  comboNotation: string;
  tags: string[];
  sheetOrigin?: string; // e.g. "Planilha Mavuika Natlan V1.xlsx" or "Entrada Manual"
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  calculation: DamageAnalysisResult;
  timeline?: RotationTimelineData;
  scenarios?: ScenarioDashboardData;
}
