import { describe, it, expect } from 'vitest';
import { ReviewEngine, MOVE_CLASSIFICATIONS } from '../../src/engine/reviewEngine.js';

describe('ReviewEngine', () => {
  const engine = new ReviewEngine();

  describe('winProbability', () => {
    it('deve retornar 0.5 para posição perfeitamente equilibrada (0 cp)', () => {
      const prob = engine.winProbability({ type: 'cp', value: 0 });
      expect(prob).toBeCloseTo(0.5, 2);
    });

    it('deve retornar probabilidade alta (> 0.75) para vantagem de +300 cp', () => {
      const prob = engine.winProbability({ type: 'cp', value: 300 });
      expect(prob).toBeGreaterThan(0.74);
    });

    it('deve retornar probabilidade baixa (< 0.25) para desvantagem de -300 cp', () => {
      const prob = engine.winProbability({ type: 'cp', value: -300 });
      expect(prob).toBeLessThan(0.26);
    });

    it('deve retornar 1.0 para mate forçado a favor', () => {
      const prob = engine.winProbability({ type: 'mate', value: 2 });
      expect(prob).toBe(1.0);
    });

    it('deve retornar 0.0 para mate forçado contra', () => {
      const prob = engine.winProbability({ type: 'mate', value: -2 });
      expect(prob).toBe(0.0);
    });
  });

  describe('classifyMove', () => {
    it('deve classificar como MISSED_WIN quando perde grande vantagem vencedora', () => {
      const classification = engine.classifyMove({
        move: { from: 'e2', to: 'e4' },
        beforeProb: 0.85,
        afterProb: 0.40,
        probLoss: 0.45,
        engineBestMove: 'd2d4'
      });
      expect(classification.key).toBe(MOVE_CLASSIFICATIONS.MISSED_WIN.key);
    });

    it('deve classificar como BLUNDER quando perda de probabilidade for > 0.30', () => {
      const classification = engine.classifyMove({
        move: { from: 'g1', to: 'f3' },
        beforeProb: 0.50,
        afterProb: 0.15,
        probLoss: 0.35,
        engineBestMove: 'e2e4'
      });
      expect(classification.key).toBe(MOVE_CLASSIFICATIONS.BLUNDER.key);
    });

    it('deve classificar como MISTAKE quando perda for entre 0.15 e 0.30', () => {
      const classification = engine.classifyMove({
        move: { from: 'b1', to: 'c3' },
        beforeProb: 0.50,
        afterProb: 0.30,
        probLoss: 0.20,
        engineBestMove: 'e2e4'
      });
      expect(classification.key).toBe(MOVE_CLASSIFICATIONS.MISTAKE.key);
    });

    it('deve classificar como INACCURACY quando perda for entre 0.07 e 0.15', () => {
      const classification = engine.classifyMove({
        move: { from: 'h2', to: 'h3' },
        beforeProb: 0.50,
        afterProb: 0.40,
        probLoss: 0.10,
        engineBestMove: 'e2e4'
      });
      expect(classification.key).toBe(MOVE_CLASSIFICATIONS.INACCURACY.key);
    });

    it('deve classificar como BEST quando for lance idêntico ao motor ou probLoss <= 0.01', () => {
      const classification = engine.classifyMove({
        move: { from: 'e2', to: 'e4' },
        beforeProb: 0.50,
        afterProb: 0.50,
        probLoss: 0.0,
        engineBestMove: 'e2e4'
      });
      expect(classification.key).toBe(MOVE_CLASSIFICATIONS.BEST.key);
    });

    it('deve classificar como BRILLIANT quando for sacrifício vencedor comprovado', () => {
      const classification = engine.classifyMove({
        move: { from: 'd1', to: 'h5' },
        beforeProb: 0.65,
        afterProb: 0.65,
        probLoss: 0.0,
        engineBestMove: 'd1h5',
        isSacrifice: true
      });
      expect(classification.key).toBe(MOVE_CLASSIFICATIONS.BRILLIANT.key);
    });
  });

  describe('calculateMoveAccuracy', () => {
    it('deve retornar 100% para perda zero de probabilidade', () => {
      const acc = engine.calculateMoveAccuracy(0.0);
      expect(acc).toBe(100);
    });

    it('deve retornar valor menor para perdas maiores', () => {
      const acc1 = engine.calculateMoveAccuracy(0.05);
      const acc2 = engine.calculateMoveAccuracy(0.20);
      expect(acc1).toBeGreaterThan(acc2);
    });
  });

  describe('reviewGame integration', () => {
    it('deve avaliar a partida e retornar estatísticas completas', async () => {
      const mockService = {
        evaluatePosition: async (fen) => ({
          score: { type: 'cp', value: 25 },
          bestMove: 'e2e4',
          pv: ['e2e4'],
          depth: 6
        })
      };

      const testEngine = new ReviewEngine(mockService);
      const fakeMoves = [
        {
          fenBefore: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          fenAfter: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
          move: { from: 'e2', to: 'e4', piece: 'p' },
          san: 'e4',
          color: 'w'
        }
      ];

      const results = await testEngine.reviewGame(fakeMoves);
      expect(results.reviewedMoves).toHaveLength(1);
      expect(results.stats.white.accuracy).toBeGreaterThan(0);
      expect(results.stats.white.accuracy).toBeLessThanOrEqual(100);
    });
  });
});
