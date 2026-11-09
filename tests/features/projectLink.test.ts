import { describe, expect, it } from 'vitest';
import { sampleProject } from '../../src/features/rotation/persistence';
import { projectFromLink, projectLink } from '../../src/features/rotation/projectLink';

describe('link de time', () => {
  it('ida e volta mantém o projeto (só o id muda)', async () => {
    const p = sampleProject();
    const link = await projectLink(p, 'https://x.test');
    const back = await projectFromLink(link);
    expect(back).not.toBeNull();
    expect({ ...back!, id: p.id }).toEqual(p);
    expect(back!.id).not.toBe(p.id);
  });
  it('texto sem time vira null e link quebrado dá erro', async () => {
    expect(await projectFromLink('https://x.test/vault')).toBeNull();
    await expect(projectFromLink('https://x.test/vault#time=abc')).rejects.toThrow();
  });
});
