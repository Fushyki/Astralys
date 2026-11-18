import { describe, expect, it } from 'vitest';
import { messageOf } from '../../src/online/api';

describe('API', () => {
  it('traduz erros do FastAPI', () => {
    expect(messageOf(400, { detail: 'Nome inválido.' })).toBe('Nome inválido.');
    expect(messageOf(422, { detail: [{ msg: 'Value error, Dê um nome ao time.' }] })).toBe('Dê um nome ao time.');
    expect(messageOf(429, null)).toMatch(/Muitas tentativas/);
    expect(messageOf(500, null)).toBe('Erro 500 ao falar com o servidor.');
  });
});
