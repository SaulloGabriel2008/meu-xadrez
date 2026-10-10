import { describe, it, expect } from 'vitest';
import { BOTS, getBotById } from '../../src/game/bots.js';

describe('Bots Configuration', () => {
  it('deve conter exatamente 6 bots calibrados', () => {
    expect(BOTS).toHaveLength(6);
  });

  it('deve conter bots com ELO crescente e avatares SVG válidos', () => {
    let lastElo = 0;
    BOTS.forEach(bot => {
      expect(bot.id).toBeDefined();
      expect(bot.name).toBeDefined();
      expect(bot.elo).toBeGreaterThan(lastElo);
      expect(bot.skillLevel).toBeGreaterThanOrEqual(0);
      expect(bot.skillLevel).toBeLessThanOrEqual(20);
      expect(bot.depth).toBeGreaterThanOrEqual(1);
      expect(bot.movetime).toBeGreaterThanOrEqual(100);
      expect(bot.avatar).toContain('<svg');
      lastElo = bot.elo;
    });
  });

  it('getBotById deve encontrar bots existentes e retornar default para id inválido', () => {
    const pipoca = getBotById('pipoca');
    expect(pipoca.name).toBe('Pipoca');

    const deepNova = getBotById('deep-nova');
    expect(deepNova.name).toBe('Deep Nova');

    const fallback = getBotById('inexistente');
    expect(fallback).toBe(BOTS[0]);
  });
});
