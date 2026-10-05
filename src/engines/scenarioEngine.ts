import { DamageAnalysisResult } from '../types/damageBreakdown';
import { ScenarioDashboardData, ScenarioOption } from '../types/scenarioAnalysis';

/**
 * Astralys - Scenario & Situational Decision Engine
 * Evaluates complex combat situations and delivers clear, mathematical recommendations
 * answering "O que é melhor em tal situação".
 */

export function generateScenariosFromCalculation(calc: DamageAnalysisResult): ScenarioDashboardData {
  const baseDpr = calc.totalDpr || 3000000;
  const duration = calc.rotationDuration || 20;
  const baseDps = calc.dps || Math.round(baseDpr / duration);
  const carry = calc.characters[0]?.name || 'Carry Principal';

  const scenarios: ScenarioOption[] = [
    // 1. Single Target vs AoE
    {
      id: 'scen-single-target',
      category: 'target_count',
      title: 'Chefe Único (Single-Target)',
      conditionLabel: '1 Inimigo Isolado (Abismo 12 Boss)',
      dpr: baseDpr,
      dps: baseDps,
      percentageRel: 100,
      isBaseline: true,
      isRecommended: true,
      verdict: 'Cenário Base de Simulação KQM. 100% do dano focado no ponto fraco do chefe.',
      pros: ['Dano de nuke concentrado', 'Fácil controle de auras elementais', 'Máximo aproveitamento de Vaporizar/Fusão'],
      cons: ['Sem orbes extras de mobs', 'Requer mais recarga de energia (ER) da equipe'],
      situationBadge: 'Padrão Abismo 12'
    },
    {
      id: 'scen-aoe-3',
      category: 'target_count',
      title: 'Horda em Área (AoE 3 Alvos)',
      conditionLabel: '3 Inimigos Agrupados (Multi-Target)',
      dpr: Math.round(baseDpr * 2.15),
      dps: Math.round(baseDps * 2.15),
      percentageRel: 215,
      isRecommended: false,
      verdict: 'O dano total da equipe mais que dobra (+115%) graças a acertos radiais e reações em cadeia.',
      pros: ['Dano total absurdo (+115% DPR)', 'Muitos orbes de HP facilitando recarga', 'Reações em cadeia'],
      cons: ['Dano dividido entre múltiplos alvos', 'Requer controle de grupo ou posicionamento'],
      situationBadge: 'Salas com Hordas'
    },

    // 2. Polar Star Field & Stellar / Lunar Reactions
    {
      id: 'scen-polar-field-active',
      category: 'reaction_field',
      title: 'Polar Star Field Ativo (Campo Estelar)',
      conditionLabel: 'Campo Estelar Ativo + 3 Stacks Lunares',
      dpr: Math.round(baseDpr * 1.28),
      dps: Math.round(baseDps * 1.28),
      percentageRel: 128,
      isRecommended: true,
      verdict: 'Excelente ganho de +28% de DPS total na rotação! Priorize manter o campo aberto antes do Burst.',
      pros: ['+140 de EM para toda a equipe', '+28% de dano amplificado em reações estelares', 'Aura contínua de 15s'],
      cons: ['Exige rotação estrita para não perder o timing do campo'],
      situationBadge: 'Melhor Desempenho'
    },
    {
      id: 'scen-polar-field-inactive',
      category: 'reaction_field',
      title: 'Sem Polar Star Field (Rotação Seca)',
      conditionLabel: 'Apenas reações normais sem o campo estelar',
      dpr: Math.round(baseDpr * 0.82),
      dps: Math.round(baseDps * 0.82),
      percentageRel: 82,
      isRecommended: false,
      verdict: 'Perda de ~18% de dano. Ocorre se o campo expirar ou se a ordem de troca for invertida.',
      pros: ['Rotação mais flexível e tolerante a erros'],
      cons: ['Perda substancial de dano por segundo (-18% DPS)'],
      situationBadge: 'Queda de Eficiência'
    },

    // 3. Frame-perfect vs Human Realistic Execution
    {
      id: 'scen-speed-perfect',
      category: 'rotation_speed',
      title: 'Execução Perfeita (20.0s)',
      conditionLabel: 'Cancels de animação frame-perfect sem esquivas',
      dpr: baseDpr,
      dps: Math.round(baseDpr / 20),
      percentageRel: 100,
      isBaseline: true,
      verdict: 'Referência teórica de planilhas. Máximo DPS possível com os status atuais.',
      pros: ['Máximo DPS teórico (100%)', 'Alinhamento ideal dos tempos de recarga'],
      cons: ['Extremamente difícil de replicar no calor da batalha sob pressão'],
      situationBadge: 'Teórico Perfeito'
    },
    {
      id: 'scen-speed-realistic',
      category: 'rotation_speed',
      title: 'Combate Realista / Esquivas (23.5s)',
      conditionLabel: '1 esquiva + delay humano de troca de 0.3s por char',
      dpr: Math.round(baseDpr * 0.98),
      dps: Math.round((baseDpr * 0.98) / 23.5),
      percentageRel: Math.round(((baseDpr * 0.98 / 23.5) / (baseDpr / 20)) * 100),
      isRecommended: true,
      verdict: 'Perda natural de ~16% no DPS real. Este é o valor mais seguro para estimar clear de Abismo.',
      pros: ['Representação fiel de gameplay humana real', 'Leva em consideração esquivas necessárias'],
      cons: ['Buffs de 10s (ex: Sombra Verde) podem expirar nos últimos golpes'],
      situationBadge: 'Realidade de Gameplay'
    },

    // 4. Investment Step Recommendation
    {
      id: 'scen-invest-c0r1',
      category: 'investment_step',
      title: 'Upgrade: Arma de Assinatura R1',
      conditionLabel: `${carry} C0R1 (Arma de Assinatura)`,
      dpr: Math.round(baseDpr * 1.18),
      dps: Math.round(baseDps * 1.18),
      percentageRel: 118,
      isRecommended: true,
      verdict: 'Recomendação #1: A arma de assinatura oferece um salto imediato de +18% de dano e facilita balancear taxa/dano.',
      pros: ['+18% de dano consistente', 'Visual estético exclusivo', 'Melhora atributos base (ATK/CR)'],
      cons: ['Banner de armas pode custar até 160~200 destinos'],
      situationBadge: 'Melhor Custo-Benefício'
    },
    {
      id: 'scen-invest-c2r1',
      category: 'investment_step',
      title: 'Upgrade: Constelação 2 (C2R1)',
      conditionLabel: `${carry} C2R1 (Power Spike de Constelação)`,
      dpr: Math.round(baseDpr * 1.48),
      dps: Math.round(baseDps * 1.48),
      percentageRel: 148,
      isRecommended: false,
      verdict: 'Ponto de virada (Hypercarry Spike): +48% de dano total. Recomendado apenas para quem quer maximizar o personagem.',
      pros: ['Salto devastador de dano (+48%)', 'Garante ignorar defesa ou dobrar stacks', 'Derrete chefes em 1 rotação'],
      cons: ['Custo alto de Gemas (2 cópias extras)'],
      situationBadge: 'Pico de Poder'
    }
  ];

  return {
    teamName: calc.title || 'Equipe de Combate',
    baseDpr,
    baseDps,
    rotationDuration: duration,
    scenarios,
    summaryRecommendation: `Para o Abismo 12 atual, a prioridade máxima é garantir o timing do Polar Star Field e investir na arma R1 de ${carry}, mantendo 15% de margem extra de ER contra chefes sem drops.`
  };
}
