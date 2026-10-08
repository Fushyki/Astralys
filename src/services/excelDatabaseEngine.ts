/**
 * Astralys - Motor de Importação e Exportação Excel (.xlsx / .csv)
 * Utiliza a biblioteca SheetJS (xlsx) para transferir bases de dados
 * com múltiplas abas: Equipes, Personagens, Armas e Rotações.
 */

import * as XLSX from 'xlsx';
import { DatabaseSlot } from './storageManager';
import { CalculationProject } from '../types/projectVault';
import { CharacterWeaponComparison, WeaponOption } from '../types/weaponComparison';
import { DamageAnalysisResult } from '../types/damageBreakdown';

export interface ExcelImportResult {
  projects: CalculationProject[];
  weaponComparisons: Record<string, CharacterWeaponComparison>;
  summary: {
    teamsCount: number;
    charactersCount: number;
    weaponsCount: number;
  };
}

/**
 * Exporta uma base de dados completa em arquivo Excel (.xlsx) com múltiplas abas formatadas
 */
export function exportSlotToExcel(slot: DatabaseSlot): void {
  const wb = XLSX.utils.book_new();

  // 1. Aba: Equipes & Rotações
  const teamsData: any[] = [];
  slot.data.projects.forEach(p => {
    teamsData.push({
      'ID': p.id,
      'Título da Equipe': p.title,
      'Carry Principal': p.carryName,
      'Equipe Completa': (p.teamNames || []).join(' + '),
      'DPR Estimado': p.totalDpr || 0,
      'DPS Estimado': p.dps || 0,
      'Duração da Rotação (s)': p.rotationDuration || 20,
      'Notação do Combo': p.comboNotation || 'N/A',
      'Qtd de Ações': p.timeline?.actions?.length || 0,
      'Tags': (p.tags || []).join(', '),
      'Data de Criação': p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : 'N/A'
    });
  });

  const wsTeams = XLSX.utils.json_to_sheet(teamsData.length > 0 ? teamsData : [{ 'Aviso': 'Nenhuma equipe cadastrada neste slot' }]);
  XLSX.utils.book_append_sheet(wb, wsTeams, 'Equipes & Rotações');

  // 2. Aba: Personagens & Builds
  const charactersData: any[] = [];
  slot.data.projects.forEach(p => {
    if (p.calculation?.characters) {
      p.calculation.characters.forEach(c => {
        charactersData.push({
          'Equipe': p.title,
          'Personagem': c.name,
          'Elemento': c.element || 'Neutro',
          'Arma': c.weapon || 'Desarmado',
          'Refinamento': 'R1',
          'Conjunto de Artefatos': c.artifactSet || 'Desconhecido',
          'Dano Individual (DPR)': c.totalDamage || 0,
          'Participação no Dano (%)': c.damagePercentage ? `${c.damagePercentage}%` : '0%'
        });
      });
    }
  });

  const wsCharacters = XLSX.utils.json_to_sheet(charactersData.length > 0 ? charactersData : [{ 'Aviso': 'Nenhum detalhamento de personagem encontrado' }]);
  XLSX.utils.book_append_sheet(wb, wsCharacters, 'Personagens & Builds');

  // 3. Aba: Armas & Comparações
  const weaponsData: any[] = [];
  Object.values(slot.data.weaponComparisons || {}).forEach(wc => {
    (wc.weapons || []).forEach(w => {
      weaponsData.push({
        'Personagem': wc.characterName,
        'Elemento': wc.characterElement,
        'Arma': w.name,
        'Refinamento': w.refinement,
        'Raridade': `${w.rarity || 5}★`,
        'ATK Base': w.baseAtk || 0,
        'Sub-Stat': `${w.subStatType} (${w.subStatValue})`,
        'DPR': w.dpr || 0,
        'DPS': w.dps || 0,
        '% da Baseline': `${w.percentageOfBaseline}%`,
        'É Baseline?': w.isBaseline ? 'Sim' : 'Não'
      });
    });
  });

  const wsWeapons = XLSX.utils.json_to_sheet(weaponsData.length > 0 ? weaponsData : [{ 'Aviso': 'Nenhum confronto de armas cadastrado' }]);
  XLSX.utils.book_append_sheet(wb, wsWeapons, 'Armas & Comparações');

  // 4. Aba: Linha do Tempo & Ações
  const actionsData: any[] = [];
  slot.data.projects.forEach(p => {
    if (p.timeline?.actions) {
      p.timeline.actions.forEach((act, idx) => {
        actionsData.push({
          'Equipe': p.title,
          '# Ação': idx + 1,
          'Personagem': act.charName,
          'Tipo de Ação': act.actionType.toUpperCase(),
          'Golpe / Habilidade': act.actionLabel,
          'Início (s)': act.startTime,
          'Duração (s)': act.duration,
          'Fim (s)': parseFloat((act.startTime + act.duration).toFixed(1)),
          'Dano Estimado': act.damage || 0
        });
      });
    }
  });

  const wsActions = XLSX.utils.json_to_sheet(actionsData.length > 0 ? actionsData : [{ 'Aviso': 'Nenhuma ação de linha do tempo registrada' }]);
  XLSX.utils.book_append_sheet(wb, wsActions, 'Linha do Tempo');

  // 5. Aba: Metadados do Sistema
  const metaData = [
    { 'Propriedade': 'Nome da Base de Dados', 'Valor': slot.name },
    { 'Propriedade': 'ID do Slot', 'Valor': slot.id },
    { 'Propriedade': 'Exportado em', 'Valor': new Date().toLocaleString('pt-BR') },
    { 'Propriedade': 'Versão do Astralys', 'Valor': '2.4.0' },
    { 'Propriedade': 'Formato', 'Valor': 'Planilha Universal Multi-Aba Excel (.xlsx)' }
  ];
  const wsMeta = XLSX.utils.json_to_sheet(metaData);
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Metadados');

  // Download no navegador
  const cleanName = slot.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `Astralys_${cleanName}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

/**
 * Lê e valida um arquivo Excel (.xlsx ou .csv) enviado pelo usuário
 */
export async function parseExcelToSlotData(file: File): Promise<ExcelImportResult> {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });

  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    throw new Error('A planilha enviada está vazia ou corrompida.');
  }

  const projects: CalculationProject[] = [];
  const weaponComparisons: Record<string, CharacterWeaponComparison> = {};

  // 1. Procura aba de Equipes
  const teamsSheetName = wb.SheetNames.find(n => 
    n.toLowerCase().includes('equipe') || 
    n.toLowerCase().includes('team') || 
    n.toLowerCase().includes('projeto') ||
    n.toLowerCase().includes('rotação') ||
    n.toLowerCase().includes('rotation')
  ) || wb.SheetNames[0];

  const teamsSheet = wb.Sheets[teamsSheetName];
  const rawTeams: any[] = XLSX.utils.sheet_to_json(teamsSheet);

  // 2. Procura aba de Personagens (opcional)
  const charactersSheetName = wb.SheetNames.find(n => 
    n.toLowerCase().includes('personagem') || 
    n.toLowerCase().includes('character') ||
    n.toLowerCase().includes('build')
  );
  const rawCharacters: any[] = charactersSheetName ? XLSX.utils.sheet_to_json(wb.Sheets[charactersSheetName]) : [];

  // 3. Procura aba de Armas (opcional)
  const weaponsSheetName = wb.SheetNames.find(n => 
    n.toLowerCase().includes('arma') || 
    n.toLowerCase().includes('weapon')
  );
  const rawWeapons: any[] = weaponsSheetName ? XLSX.utils.sheet_to_json(wb.Sheets[weaponsSheetName]) : [];

  // Mapeamento de Equipes
  rawTeams.forEach((row, idx) => {
    // Extrai propriedades com fallbacks inteligentes para diferentes padrões de cabeçalho
    const title = row['Título da Equipe'] || row['Equipe'] || row['Team'] || row['Nome'] || `Equipe Importada ${idx + 1}`;
    const carry = row['Carry Principal'] || row['Carry'] || row['DPS'] || 'Mavuika';
    const teamString = row['Equipe Completa'] || row['Membros'] || row['Personagens'] || '';
    const teamNames = teamString ? teamString.split(/\s*[\+,]\s*/) : [carry, 'Bennett', 'Citlali', 'Xilonen'];
    const totalDpr = Number(row['DPR Estimado'] || row['DPR'] || row['Total DPR'] || 2500000);
    const dps = Number(row['DPS Estimado'] || row['DPS'] || (totalDpr / 20));
    const duration = Number(row['Duração da Rotação (s)'] || row['Duração'] || row['Duration'] || 20);
    const combo = row['Notação do Combo'] || row['Combo'] || 'E Q > DPS';

    // Associa personagens correspondentes dessa equipe
    const teamChars = rawCharacters.filter(c => (c['Equipe'] || '').trim().toLowerCase() === title.trim().toLowerCase());

    const charBreakdown = teamChars.length > 0 ? teamChars.map((tc, cIdx) => ({
      characterName: tc['Personagem'] || `Personagem ${cIdx + 1}`,
      element: tc['Elemento'] || 'Pyro',
      weapon: tc['Arma'] || 'Espada Celestial',
      refinement: tc['Refinamento'] || 'R1',
      artifactSet: tc['Conjunto de Artefatos'] || 'Conjunto do Herói',
      totalDamage: Number(tc['Dano Individual (DPR)'] || 0),
      damagePercentage: parseFloat(String(tc['Participação no Dano (%)'] || '0').replace('%', '')) || 0
    })) : [
      { characterName: carry, element: 'Pyro', weapon: 'Assinatura', refinement: 'R1', artifactSet: 'Codex Obsidiana', totalDamage: Math.round(totalDpr * 0.7), damagePercentage: 70 },
      { characterName: teamNames[1] || 'Citlali', element: 'Cryo', weapon: 'Favonius', refinement: 'R5', artifactSet: 'Instrutor', totalDamage: Math.round(totalDpr * 0.1), damagePercentage: 10 },
      { characterName: teamNames[2] || 'Bennett', element: 'Pyro', weapon: 'Espada do Cavaleiro', refinement: 'R5', artifactSet: 'Nobreza', totalDamage: Math.round(totalDpr * 0.1), damagePercentage: 10 },
      { characterName: teamNames[3] || 'Xilonen', element: 'Geo', weapon: 'Favonius', refinement: 'R5', artifactSet: 'Pergaminho', totalDamage: Math.round(totalDpr * 0.1), damagePercentage: 10 }
    ];

    const calculationResult: DamageAnalysisResult = {
      title,
      characters: charBreakdown.map(c => ({
        name: c.characterName,
        element: c.element,
        weapon: c.weapon,
        artifactSet: c.artifactSet,
        totalDamage: c.totalDamage,
        damagePercentage: c.damagePercentage
      })),
      hits: [],
      totalDpr,
      dps,
      rotationDuration: duration,
      comboNotation: combo
    };

    projects.push({
      id: `proj-excel-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
      title,
      carryName: carry,
      teamNames,
      totalDpr,
      dps,
      rotationDuration: duration,
      comboNotation: combo,
      tags: ['Excel Import', 'XLSX'],
      sheetOrigin: file.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      calculation: calculationResult
    });
  });

  // Mapeamento de Armas
  rawWeapons.forEach(row => {
    const char = row['Personagem'];
    if (!char) return;

    if (!weaponComparisons[char]) {
      weaponComparisons[char] = {
        characterName: char,
        characterElement: row['Elemento'] || 'Pyro',
        carryArchetype: 'Carry On-field',
        baselineWeaponId: '',
        rotationDuration: 20,
        weapons: []
      };
    }

    const isBaseline = String(row['É Baseline?'] || '').toLowerCase().includes('sim');
    const weaponOption: WeaponOption = {
      id: `wep-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: row['Arma'] || 'Arma Importada',
      refinement: row['Refinamento'] || 'R1',
      rarity: (parseInt(row['Raridade'] || '5') || 5) as 3 | 4 | 5,
      baseAtk: Number(row['ATK Base'] || 510),
      subStatType: 'CR',
      subStatValue: 33.1,
      passiveEffect: 'Efeito importado da planilha',
      dpr: Number(row['DPR'] || 1000000),
      dps: Number(row['DPS'] || 50000),
      percentageOfBaseline: parseFloat(String(row['% da Baseline'] || '100').replace('%', '')) || 100,
      isBaseline
    };

    if (isBaseline || !weaponComparisons[char].baselineWeaponId) {
      weaponComparisons[char].baselineWeaponId = weaponOption.id;
    }

    weaponComparisons[char].weapons.push(weaponOption);
  });

  if (projects.length === 0 && Object.keys(weaponComparisons).length === 0) {
    throw new Error('Não foi possível identificar equipes ou dados compatíveis nas abas da planilha.');
  }

  return {
    projects,
    weaponComparisons,
    summary: {
      teamsCount: projects.length,
      charactersCount: projects.reduce((acc, p) => acc + (p.teamNames?.length || 0), 0),
      weaponsCount: Object.values(weaponComparisons).reduce((acc, wc) => acc + wc.weapons.length, 0)
    }
  };
}
