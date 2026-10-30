import { describe, expect, it } from 'vitest';
import { applyImport, diffGood, summarize } from '../../src/features/good/goodDiff';
import type { Good } from '../../src/features/good/goodImport';

const art = (over: Partial<Good['artifacts'][number]> = {}): Good['artifacts'][number] => ({
  setKey: 'ObsidianCodex', slotKey: 'flower', rarity: 5, mainStatKey: 'hp', level: 20, location: '',
  substats: [{ key: 'critRate_', value: 3.9 }, { key: 'atk_', value: 5.3 }], ...over,
});
const good = (over: Partial<Good> = {}): Good => ({ format: 'GOOD', characters: [], weapons: [], artifacts: [], ...over });

describe('importar GOOD em uma base existente', () => {
  it('artefato igual (mesmo com outro dono) é igual; evoluído é atualizado; outro é novo; o que sumiu fica fora do arquivo', () => {
    const base = good({ artifacts: [art({ location: 'Mavuika' }), art({ level: 12, substats: [{ key: 'critRate_', value: 3.9 }] }), art({ setKey: 'Other' })] });
    const incoming = good({ artifacts: [art({ location: 'Citlali' }), art({ level: 16, substats: [{ key: 'critRate_', value: 3.9 }, { key: 'em', value: 19 }] }), art({ setKey: 'Brand', slotKey: 'plume', mainStatKey: 'atk' })] });
    const d = diffGood(base, incoming);
    expect(summarize(d.artifacts)).toEqual({ added: 1, updated: 1, unchanged: 1, missing: 1 });
    expect(d.artifacts.unchanged[0].next.location).toBe('Citlali');
  });

  it('dois artefatos idênticos na base casam um a um (duplicados não somem nem se multiplicam)', () => {
    const base = good({ artifacts: [art(), art()] });
    expect(summarize(diffGood(base, good({ artifacts: [art()] })).artifacts)).toEqual({ added: 0, updated: 0, unchanged: 1, missing: 1 });
    expect(summarize(diffGood(base, good({ artifacts: [art(), art(), art()] })).artifacts)).toEqual({ added: 1, updated: 0, unchanged: 2, missing: 0 });
  });

  it('substat mais baixo não é evolução (é outro artefato)', () => {
    const d = diffGood(good({ artifacts: [art({ substats: [{ key: 'critRate_', value: 7.8 }] })] }), good({ artifacts: [art({ level: 20, substats: [{ key: 'critRate_', value: 3.9 }] })] }));
    expect(summarize(d.artifacts)).toEqual({ added: 1, updated: 0, unchanged: 0, missing: 1 });
  });

  it('armas: nível e refinamento maiores atualizam; chave diferente é nova', () => {
    const base = good({ weapons: [{ key: 'Vortex', level: 70, refinement: 1, location: '' }, { key: 'Sword', level: 90, refinement: 1, location: '' }] });
    const incoming = good({ weapons: [{ key: 'Vortex', level: 90, refinement: 2, location: 'Mavuika' }, { key: 'Bow', level: 1, refinement: 1, location: '' }] });
    expect(summarize(diffGood(base, incoming).weapons)).toEqual({ added: 1, updated: 1, unchanged: 0, missing: 1 });
  });

  it('personagens: por chave; igual, atualizado, novo e fora do arquivo', () => {
    const base = good({ characters: [{ key: 'Mavuika', level: 80, constellation: 0 }, { key: 'Citlali', level: 90, constellation: 0 }, { key: 'Bennett', level: 90, constellation: 6 }] });
    const incoming = good({ characters: [{ key: 'Mavuika', level: 90, constellation: 1 }, { key: 'Citlali', level: 90, constellation: 0 }, { key: 'Iansan', level: 90, constellation: 0 }] });
    expect(summarize(diffGood(base, incoming).characters)).toEqual({ added: 1, updated: 1, unchanged: 1, missing: 1 });
  });

  it('aplicar: mantém o que só existe na base por padrão e apaga quando pedido', () => {
    const base = good({ characters: [{ key: 'Bennett' }], weapons: [{ key: 'Sword', location: 'Bennett' }], artifacts: [art({ setKey: 'Only', location: 'Bennett' })] });
    const incoming = good({ characters: [{ key: 'Mavuika' }], weapons: [], artifacts: [] });
    const keep = applyImport(base, incoming);
    expect(keep.characters.map((c) => c.key).sort()).toEqual(['Bennett', 'Mavuika']);
    expect(keep.weapons).toHaveLength(1);
    expect(keep.artifacts).toHaveLength(1);
    const del = applyImport(base, incoming, { updateExisting: true, deleteMissingItems: true, deleteMissingCharacters: true });
    expect(del.characters.map((c) => c.key)).toEqual(['Mavuika']);
    expect(del.weapons).toHaveLength(0);
    expect(del.artifacts).toHaveLength(0);
  });

  it('aplicar sem atualizar: a versão antiga fica e a nova não entra duplicada', () => {
    const base = good({ artifacts: [art({ level: 12, substats: [{ key: 'critRate_', value: 3.9 }] })] });
    const incoming = good({ artifacts: [art({ level: 20, substats: [{ key: 'critRate_', value: 3.9 }, { key: 'em', value: 19 }] })] });
    const r = applyImport(base, incoming, { updateExisting: false, deleteMissingItems: false, deleteMissingCharacters: false });
    expect(r.artifacts).toHaveLength(1);
    expect(r.artifacts[0].level).toBe(12);
    expect(applyImport(base, incoming).artifacts[0].level).toBe(20);
  });

  it('peça mantida que ficaria na mesma posição e dono de uma do arquivo perde o dono (uma peça por posição)', () => {
    const base = good({ artifacts: [art({ setKey: 'Old', location: 'Mavuika' })] });
    const incoming = good({ artifacts: [art({ setKey: 'New', location: 'Mavuika' })] });
    const r = applyImport(base, incoming);
    expect(r.artifacts.filter((a) => a.location === 'Mavuika')).toHaveLength(1);
    expect(r.artifacts.find((a) => a.setKey === 'Old')!.location).toBe('');
  });

  it('base vazia: tudo é novo e o resultado é o arquivo', () => {
    const incoming = good({ characters: [{ key: 'Mavuika' }], artifacts: [art()] });
    expect(applyImport(null, incoming)).toEqual(incoming);
  });
});
