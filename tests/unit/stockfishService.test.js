import { describe, it, expect } from 'vitest';
import { StockfishService } from '../../src/engine/stockfishService.js';

describe('StockfishService', () => {
  const service = new StockfishService();

  describe('parseInfoLine', () => {
    it('deve extrair profundidade, centipawns e pv de linha UCI', () => {
      const line = 'info depth 5 score cp 85 nodes 1420 time 230 pv e2e4 e7e5 g1f3';
      const parsed = service.parseInfoLine(line, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

      expect(parsed).toBeDefined();
      expect(parsed.depth).toBe(5);
      expect(parsed.score.type).toBe('cp');
      expect(parsed.score.value).toBe(85);
      expect(parsed.whiteScore.value).toBe(85);
      expect(parsed.pv).toEqual(['e2e4', 'e7e5', 'g1f3']);
    });

    it('deve inverter score relativo quando a vez for das pretas', () => {
      const line = 'info depth 6 score cp 120 pv e7e5';
      const parsed = service.parseInfoLine(line, 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');

      expect(parsed.score.value).toBe(120);
      expect(parsed.whiteScore.value).toBe(-120);
    });

    it('deve extrair mate forçado', () => {
      const line = 'info depth 8 score mate 2 pv d1h5 g7g6 h5e5';
      const parsed = service.parseInfoLine(line, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

      expect(parsed.score.type).toBe('mate');
      expect(parsed.score.value).toBe(2);
    });
  });

  describe('setSkillLevel', () => {
    it('deve limitar o nível entre 0 e 20', async () => {
      await service.setSkillLevel(25);
      expect(service.skillLevel).toBe(20);

      await service.setSkillLevel(-5);
      expect(service.skillLevel).toBe(0);

      await service.setSkillLevel(12);
      expect(service.skillLevel).toBe(12);
    });
  });
});
