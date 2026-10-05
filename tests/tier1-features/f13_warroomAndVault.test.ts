/**
 * Feature 13: Combat War Room, Interactive Timeline & Astralys Vault Tests (Tier 1)
 */

import { describe, it, expect } from '../testRunner';
import { generateTimelineFromDamageResult, calculateBuffCoverageEfficiency, getCharacterMoveOptions } from '../../src/engines/timelineEngine';
import { generateScenariosFromCalculation } from '../../src/engines/scenarioEngine';
import { DEFAULT_CALCULATION_PROJECTS } from '../../src/data/defaultProjects';
import { DamageAnalysisResult } from '../../src/types/damageBreakdown';

describe('Feature 13 (F13): War Room, Timeline & Vault Engines Coverage', () => {
  const mockCalc: DamageAnalysisResult = {
    title: 'Mavuika Natlan Overdrive',
    characters: [
      { name: 'Mavuika', element: 'Pyro', weapon: 'Verdict', artifactSet: 'Obsidian Codex', totalDamage: 3820000, damagePercentage: 81.8 },
      { name: 'Citlali', element: 'Cryo', weapon: 'TTDS', artifactSet: 'Scroll of Cinder City', totalDamage: 480000, damagePercentage: 10.3 },
      { name: 'Bennett', element: 'Pyro', weapon: 'Aquila Favonia', artifactSet: 'Noblesse Oblige', totalDamage: 180000, damagePercentage: 3.9 },
      { name: 'Xilonen', element: 'Geo', weapon: 'Peak Patrol', artifactSet: 'Scroll of Cinder City', totalDamage: 191000, damagePercentage: 4.0 }
    ],
    hits: [
      { id: '1', label: 'QM', displayName: 'Mavuika Q', charName: 'Mavuika', charIndex: 0, damage: 1450000, pctOfTotal: 31.0, category: 'burst' },
      { id: '2', label: '5N3D', displayName: 'Mavuika Stance', charName: 'Mavuika', charIndex: 0, damage: 1980000, pctOfTotal: 42.4, category: 'normal' }
    ],
    totalDpr: 4671000,
    dps: 233550,
    rotationDuration: 20,
    comboNotation: 'Xilonen E Q -> Citlali E Q -> Bennett Q E -> Mavuika Q 5N3D E'
  };

  it('F13.1: Generates frame-accurate timeline with actions and duration from calculation result', () => {
    const timeline = generateTimelineFromDamageResult(mockCalc);
    expect(timeline.totalDuration).toBe(20);
    expect(timeline.actions.length).toBeGreaterThanOrEqual(4);
    expect(timeline.actions.some(a => a.charName === 'Mavuika')).toBe(true);
    expect(timeline.actions.some(a => a.actionType === 'burst')).toBe(true);
  });

  it('F13.2: Detects and creates active buff tracks for Bennett Q and Noblesse Oblige', () => {
    const timeline = generateTimelineFromDamageResult(mockCalc);
    expect(timeline.buffs.length).toBeGreaterThan(0);
    const hasBennett = timeline.buffs.some(b => b.name.toLowerCase().includes('bennett'));
    expect(hasBennett).toBe(true);
  });

  it('F13.3: Calculates high buff coverage efficiency for the main carry during DPS window', () => {
    const timeline = generateTimelineFromDamageResult(mockCalc);
    const eff = calculateBuffCoverageEfficiency(timeline, 0);
    expect(eff).toBeGreaterThanOrEqual(80);
    expect(eff).toBeLessThanOrEqual(100);
  });

  it('F13.4: Generates situational decision scenarios (Single-Target vs AoE, Polar Star Field, Upgrades)', () => {
    const scenarios = generateScenariosFromCalculation(mockCalc);
    expect(scenarios.baseDpr).toBe(4671000);
    expect(scenarios.scenarios.length).toBeGreaterThanOrEqual(4);
    
    // Single-target baseline
    const st = scenarios.scenarios.find(s => s.id === 'scen-single-target');
    expect(st?.percentageRel).toBe(100);

    // AoE scaling
    const aoe = scenarios.scenarios.find(s => s.id === 'scen-aoe-3');
    expect(aoe?.percentageRel).toBeGreaterThan(150);

    // Recommended upgrades
    const upgrade = scenarios.scenarios.find(s => s.category === 'investment_step');
    expect(upgrade).toBeDefined();
  });

  it('F13.5: Default calculation projects in Vault contain valid Mavuika and Flins data', () => {
    expect(DEFAULT_CALCULATION_PROJECTS.length).toBeGreaterThanOrEqual(3);
    const carries = DEFAULT_CALCULATION_PROJECTS.map(p => p.carryName);
    expect(carries).toContain('Mavuika');
    expect(carries).toContain('Flins');
    expect(DEFAULT_CALCULATION_PROJECTS[0].totalDpr).toBeGreaterThan(3000000);
  });

  it('F13.6: Provides character-specific strike move options for Mavuika, Bennett, and universal fallback', () => {
    const mavMoves = getCharacterMoveOptions('Mavuika', 'Pyro');
    expect(mavMoves.length).toBeGreaterThanOrEqual(4);
    expect(mavMoves.some(m => m.type === 'burst')).toBe(true);
    expect(mavMoves.some(m => m.type === 'skill')).toBe(true);
    expect(mavMoves.some(m => m.type === 'charged')).toBe(true);

    const benMoves = getCharacterMoveOptions('Bennett', 'Pyro');
    expect(benMoves.some(m => m.label.includes('Viagem Fantástica'))).toBe(true);

    const genericMoves = getCharacterMoveOptions('CustomHero', 'Hydro');
    expect(genericMoves.length).toBeGreaterThanOrEqual(5);
  });
});
