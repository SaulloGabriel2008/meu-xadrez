import { describe, it, expect } from 'vitest';
import { BOTS, getBotById } from '../../src/game/bots.js';

describe('Bots Configuration and Calibration', () => {
  it('deve conter exatamente 6 bots calibrados com IDs exclusivos', () => {
    expect(BOTS).toHaveLength(6);
    const ids = BOTS.map(b => b.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(6);
  });

  it('deve conter bots com progressão estrita de ELO (de 400 a 3000+)', () => {
    const expectedElos = [400, 800, 1200, 1600, 2000, 3200];
    const actualElos = BOTS.map(b => b.elo);
    expect(actualElos).toEqual(expectedElos);

    let lastElo = 0;
    BOTS.forEach(bot => {
      expect(bot.elo).toBeGreaterThan(lastElo);
      lastElo = bot.elo;
    });
  });

  it('deve calibrar parâmetros UCI (skillLevel, depth, movetime) coerentes com o rating', () => {
    let lastSkill = -1;
    let lastDepth = 0;
    let lastMovetime = 0;

    BOTS.forEach(bot => {
      // Skill Level deve estar entre 0 e 20 e ser não decrescente
      expect(bot.skillLevel).toBeGreaterThanOrEqual(0);
      expect(bot.skillLevel).toBeLessThanOrEqual(20);
      expect(bot.skillLevel).toBeGreaterThanOrEqual(lastSkill);

      // Depth deve ser crescente
      expect(bot.depth).toBeGreaterThan(lastDepth);
      expect(bot.depth).toBeLessThanOrEqual(20);

      // Movetime deve ser crescente
      expect(bot.movetime).toBeGreaterThan(lastMovetime);
      expect(bot.movetime).toBeLessThanOrEqual(2000);

      lastSkill = bot.skillLevel;
      lastDepth = bot.depth;
      lastMovetime = bot.movetime;
    });
  });

  it('cada bot deve possuir metadados completos (nome, categoria, descrição)', () => {
    BOTS.forEach(bot => {
      expect(typeof bot.name).toBe('string');
      expect(bot.name.trim().length).toBeGreaterThan(0);

      expect(typeof bot.category).toBe('string');
      expect(bot.category.trim().length).toBeGreaterThan(0);

      expect(typeof bot.description).toBe('string');
      expect(bot.description.trim().length).toBeGreaterThan(10);
    });
  });

  it('cada bot deve possuir avatar SVG vetorial bem-formado', () => {
    BOTS.forEach(bot => {
      expect(bot.avatar).toContain('<svg');
      expect(bot.avatar).toContain('viewBox="0 0 100 100"');
      expect(bot.avatar).toContain('</svg>');
      expect(bot.avatar).toContain('class="bot-avatar-svg"');
    });
  });

  it('getBotById deve encontrar cada um dos 6 bots corretamente', () => {
    const expectedIds = ['pipoca', 'gabi', 'marcos', 'helena', 'viktor', 'deep-nova'];

    expectedIds.forEach(id => {
      const bot = getBotById(id);
      expect(bot).toBeDefined();
      expect(bot.id).toBe(id);
    });
  });

  it('getBotById deve retornar o bot padrão (Pipoca) para entradas inválidas, nulas ou inexistentes', () => {
    expect(getBotById('desconhecido')).toBe(BOTS[0]);
    expect(getBotById('')).toBe(BOTS[0]);
    expect(getBotById(null)).toBe(BOTS[0]);
    expect(getBotById(undefined)).toBe(BOTS[0]);
  });
});
