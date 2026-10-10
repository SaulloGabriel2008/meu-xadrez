import { describe, it, expect, vi } from 'vitest';
import { ReviewEngine, MOVE_CLASSIFICATIONS } from '../../src/engine/reviewEngine.js';

describe('ReviewEngine', () => {
  const engine = new ReviewEngine();

  describe('winProbability', () => {
    it('deve retornar 0.5 para posição perfeitamente equilibrada (0 cp)', () => {
      const prob = engine.winProbability({ type: 'cp', value: 0 });
      expect(prob).toBeCloseTo(0.5, 2);
    });

    it('deve retornar probabilidade alta (> 0.74) para vantagem de +300 cp', () => {
      const prob = engine.winProbability({ type: 'cp', value: 300 });
      expect(prob).toBeGreaterThan(0.74);
    });

    it('deve retornar probabilidade muito alta (> 0.95) para vantagem de +1000 cp', () => {
      const prob = engine.winProbability({ type: 'cp', value: 1000 });
      expect(prob).toBeGreaterThan(0.95);
    });

    it('deve retornar probabilidade moderada (~0.59) para leve vantagem de +100 cp', () => {
      const prob = engine.winProbability({ type: 'cp', value: 100 });
      expect(prob).toBeGreaterThan(0.55);
      expect(prob).toBeLessThan(0.65);
    });

    it('deve retornar probabilidade baixa (< 0.26) para desvantagem de -300 cp', () => {
      const prob = engine.winProbability({ type: 'cp', value: -300 });
      expect(prob).toBeLessThan(0.26);
    });

    it('deve retornar probabilidade muito baixa (< 0.05) para desvantagem de -1000 cp', () => {
      const prob = engine.winProbability({ type: 'cp', value: -1000 });
      expect(prob).toBeLessThan(0.05);
    });

    it('deve retornar 1.0 para mate forçado a favor com qualquer número de lances', () => {
      expect(engine.winProbability({ type: 'mate', value: 1 })).toBe(1.0);
      expect(engine.winProbability({ type: 'mate', value: 5 })).toBe(1.0);
    });

    it('deve retornar 0.0 para mate forçado contra com qualquer número de lances', () => {
      expect(engine.winProbability({ type: 'mate', value: -1 })).toBe(0.0);
      expect(engine.winProbability({ type: 'mate', value: -4 })).toBe(0.0);
    });

    it('deve retornar 0.5 quando mate for 0 ou score for nulo/inválido', () => {
      expect(engine.winProbability({ type: 'mate', value: 0 })).toBe(0.5);
      expect(engine.winProbability(null)).toBe(0.5);
      expect(engine.winProbability(undefined)).toBe(0.5);
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
      expect(classification.label).toBe('Perda de Oportunidade');
      expect(classification.badge).toBe('✖');
    });

    it('deve classificar como BLUNDER (Capivarada) quando perda for severa (> 0.30)', () => {
      const classification = engine.classifyMove({
        move: { from: 'g1', to: 'f3' },
        beforeProb: 0.50,
        afterProb: 0.15,
        probLoss: 0.35,
        engineBestMove: 'e2e4'
      });
      expect(classification.key).toBe(MOVE_CLASSIFICATIONS.BLUNDER.key);
      expect(classification.label).toBe('Capivarada');
      expect(classification.badge).toBe('??');
    });

    it('deve classificar como MISTAKE (Erro) quando perda for entre 0.15 e 0.30', () => {
      const classification = engine.classifyMove({
        move: { from: 'b1', to: 'c3' },
        beforeProb: 0.50,
        afterProb: 0.30,
        probLoss: 0.20,
        engineBestMove: 'e2e4'
      });
      expect(classification.key).toBe(MOVE_CLASSIFICATIONS.MISTAKE.key);
      expect(classification.label).toBe('Erro');
      expect(classification.badge).toBe('?');
    });

    it('deve classificar como INACCURACY (Imprecisão) quando perda for entre 0.07 e 0.15', () => {
      const classification = engine.classifyMove({
        move: { from: 'h2', to: 'h3' },
        beforeProb: 0.50,
        afterProb: 0.40,
        probLoss: 0.10,
        engineBestMove: 'e2e4'
      });
      expect(classification.key).toBe(MOVE_CLASSIFICATIONS.INACCURACY.key);
      expect(classification.label).toBe('Imprecisão');
      expect(classification.badge).toBe('?!');
    });

    it('deve classificar como BRILLIANT (Brilhante) quando for sacrifício vencedor comprovado', () => {
      const classification = engine.classifyMove({
        move: { from: 'd1', to: 'h5' },
        beforeProb: 0.65,
        afterProb: 0.65,
        probLoss: 0.0,
        engineBestMove: 'd1h5',
        isSacrifice: true
      });
      expect(classification.key).toBe(MOVE_CLASSIFICATIONS.BRILLIANT.key);
      expect(classification.label).toBe('Brilhante');
      expect(classification.badge).toBe('!!');
      expect(classification.color).toBe('#1ba7a6');
    });

    it('deve classificar como BEST (Melhor Lance) quando coincide com o motor ou perda <= 1%', () => {
      const matchMove = engine.classifyMove({
        move: { from: 'e2', to: 'e4' },
        beforeProb: 0.50,
        afterProb: 0.50,
        probLoss: 0.0,
        engineBestMove: 'e2e4'
      });
      expect(matchMove.key).toBe(MOVE_CLASSIFICATIONS.BEST.key);
      expect(matchMove.label).toBe('Melhor Lance');

      const lowLossMove = engine.classifyMove({
        move: { from: 'd2', to: 'd4' },
        beforeProb: 0.50,
        afterProb: 0.495,
        probLoss: 0.005,
        engineBestMove: 'c2c4'
      });
      expect(lowLossMove.key).toBe(MOVE_CLASSIFICATIONS.BEST.key);
    });

    it('deve classificar como EXCELLENT (Excelente) quando perda <= 3%', () => {
      const classification = engine.classifyMove({
        move: { from: 'g1', to: 'f3' },
        beforeProb: 0.50,
        afterProb: 0.475,
        probLoss: 0.025,
        engineBestMove: 'e2e4'
      });
      expect(classification.key).toBe(MOVE_CLASSIFICATIONS.EXCELLENT.key);
      expect(classification.label).toBe('Excelente');
    });

    it('deve classificar como GOOD (Bom) quando perda for entre 3% e 7%', () => {
      const classification = engine.classifyMove({
        move: { from: 'c2', to: 'c4' },
        beforeProb: 0.50,
        afterProb: 0.45,
        probLoss: 0.05,
        engineBestMove: 'e2e4'
      });
      expect(classification.key).toBe(MOVE_CLASSIFICATIONS.GOOD.key);
      expect(classification.label).toBe('Bom');
    });
  });

  describe('detectSacrifice', () => {
    it('deve detectar sacrifício quando entrega dama sem capturar ou capturando peão', () => {
      // Dama (valor 9) sem captura
      const queenSac = engine.detectSacrifice({ piece: 'q', captured: null });
      expect(queenSac).toBe(true);

      // Dama capturando peão (1) -> 9 > 1 + 2 (9 > 3)
      const queenForPawn = engine.detectSacrifice({ piece: 'q', captured: 'p' });
      expect(queenForPawn).toBe(true);
    });

    it('deve detectar sacrifício quando entrega torre sem capturar ou por peão', () => {
      // Torre (valor 5) por nada
      const rookSac = engine.detectSacrifice({ piece: 'r', captured: null });
      expect(rookSac).toBe(true);

      // Torre (valor 5) por peão (1) -> 5 > 1 + 2 (5 > 3)
      const rookForPawn = engine.detectSacrifice({ piece: 'r', captured: 'p' });
      expect(rookForPawn).toBe(true);
    });

    it('não deve considerar sacrifício ao mover peão, cavalo ou bispo simples', () => {
      expect(engine.detectSacrifice({ piece: 'p', captured: null })).toBe(false);
      expect(engine.detectSacrifice({ piece: 'n', captured: null })).toBe(false);
      expect(engine.detectSacrifice({ piece: 'b', captured: null })).toBe(false);
    });

    it('não deve considerar sacrifício troca equivalente de torre por torre ou dama por dama', () => {
      expect(engine.detectSacrifice({ piece: 'r', captured: 'r' })).toBe(false);
      expect(engine.detectSacrifice({ piece: 'q', captured: 'q' })).toBe(false);
    });

    it('deve lidar seguramente com lances nulos ou indefinidos', () => {
      expect(engine.detectSacrifice(null)).toBe(false);
      expect(engine.detectSacrifice(undefined)).toBe(false);
    });
  });

  describe('calculateMoveAccuracy', () => {
    it('deve retornar exatamente 100% para perda zero de probabilidade', () => {
      const acc = engine.calculateMoveAccuracy(0.0);
      expect(acc).toBe(100);
    });

    it('deve retornar 100% para perda negativa (posição melhorou)', () => {
      const acc = engine.calculateMoveAccuracy(-0.05);
      expect(acc).toBe(100);
    });

    it('deve decrescer suavemente conforme a perda de probabilidade aumenta', () => {
      const acc1 = engine.calculateMoveAccuracy(0.02);
      const acc2 = engine.calculateMoveAccuracy(0.08);
      const acc3 = engine.calculateMoveAccuracy(0.20);
      const acc4 = engine.calculateMoveAccuracy(0.50);

      expect(acc1).toBeGreaterThan(acc2);
      expect(acc2).toBeGreaterThan(acc3);
      expect(acc3).toBeGreaterThan(acc4);
      expect(acc4).toBeGreaterThan(0);
      expect(acc4).toBeLessThan(10);
    });

    it('não deve retornar valores abaixo de 0 ou acima de 100', () => {
      expect(engine.calculateMoveAccuracy(2.0)).toBeGreaterThanOrEqual(0);
      expect(engine.calculateMoveAccuracy(-1.0)).toBeLessThanOrEqual(100);
    });
  });

  describe('reviewGame integration', () => {
    it('deve lidar com lista de lances vazia sem erros', async () => {
      const mockService = {
        evaluatePosition: vi.fn()
      };
      const testEngine = new ReviewEngine(mockService);
      const result = await testEngine.reviewGame([]);

      expect(result.reviewedMoves).toHaveLength(0);
      expect(result.stats.white.accuracy).toBe(100);
      expect(result.stats.black.accuracy).toBe(100);
    });

    it('deve analisar múltiplos lances com alternância de cores e invocar callback de progresso', async () => {
      let callCount = 0;
      const evals = [
        { score: { type: 'cp', value: 15 }, bestMove: 'e2e4', depth: 8 },
        { score: { type: 'cp', value: 20 }, bestMove: 'e7e5', depth: 8 },
        { score: { type: 'cp', value: 25 }, bestMove: 'g1f3', depth: 8 },
        { score: { type: 'cp', value: 30 }, bestMove: 'b8c6', depth: 8 }
      ];

      const mockService = {
        evaluatePosition: vi.fn().mockImplementation(async () => {
          const res = evals[callCount % evals.length];
          callCount++;
          return res;
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
        },
        {
          fenBefore: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
          fenAfter: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
          move: { from: 'e7', to: 'e5', piece: 'p' },
          san: 'e5',
          color: 'b'
        },
        {
          fenBefore: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
          fenAfter: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
          move: { from: 'g1', to: 'f3', piece: 'n' },
          san: 'Nf3',
          color: 'w'
        }
      ];

      const progressCallback = vi.fn();
      const results = await testEngine.reviewGame(fakeMoves, progressCallback, 8);

      expect(results.reviewedMoves).toHaveLength(3);
      expect(progressCallback).toHaveBeenCalledTimes(3);
      expect(progressCallback).toHaveBeenLastCalledWith(100, 3, 3);

      expect(results.stats.white.accuracies).toHaveLength(2);
      expect(results.stats.black.accuracies).toHaveLength(1);

      expect(results.stats.white.accuracy).toBeGreaterThan(0);
      expect(results.stats.white.accuracy).toBeLessThanOrEqual(100);
      expect(results.stats.black.accuracy).toBeGreaterThan(0);
      expect(results.stats.black.accuracy).toBeLessThanOrEqual(100);

      const firstMove = results.reviewedMoves[0];
      expect(firstMove.san).toBe('e4');
      expect(firstMove.color).toBe('w');
      expect(firstMove.classification).toBeDefined();
      expect(firstMove.accuracy).toBeDefined();
    });
  });
});
