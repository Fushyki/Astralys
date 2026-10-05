export type ScenarioCategory = 
  | 'target_count'      // Single-Target vs AoE
  | 'reaction_field'    // With vs Without Polar Star Field / Lunar-Stellar Reactions
  | 'rotation_speed'    // Frame-perfect 20s vs Human Error 23s
  | 'investment_step'   // C0R0 vs C0R1 vs C1R1 vs C2R1
  | 'energy_safety';    // 0 enemy drops vs Normal drops

export interface ScenarioOption {
  id: string;
  category: ScenarioCategory;
  title: string;
  conditionLabel: string;
  dpr: number;
  dps: number;
  percentageRel: number; // e.g. 100%, 145%, 88% relative to baseline
  isBaseline?: boolean;
  isRecommended?: boolean;
  verdict: string; // e.g. "Melhor para Abismo 12 (Chefes)", "Melhor Custo de Gemas"
  pros: string[];
  cons: string[];
  situationBadge: string; // e.g. "Cenário Recomendado", "Situação Real", "Pior Caso"
}

export interface ScenarioDashboardData {
  teamName: string;
  baseDpr: number;
  baseDps: number;
  rotationDuration: number;
  scenarios: ScenarioOption[];
  summaryRecommendation: string;
}
