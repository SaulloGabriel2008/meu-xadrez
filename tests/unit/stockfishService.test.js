import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StockfishService } from '../../src/engine/stockfishService.js';

describe('StockfishService', () => {
  let service;

  beforeEach(() => {
    service = new StockfishService();
  });

  describe('parseInfoLine', () => {
    it('deve extrair profundidade, centipawns e pv de linha UCI padrão para brancas', () => {
      const line = 'info depth 5 score cp 85 nodes 1420 time 230 pv e2e4 e7e5 g1f3';
      const parsed = service.parseInfoLine(line, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

      expect(parsed).toBeDefined();
      expect(parsed.depth).toBe(5);
      expect(parsed.score.type).toBe('cp');
      expect(parsed.score.value).toBe(85);
      expect(parsed.whiteScore.type).toBe('cp');
      expect(parsed.whiteScore.value).toBe(85);
      expect(parsed.pv).toEqual(['e2e4', 'e7e5', 'g1f3']);
    });

    it('deve inverter score relativo quando a vez for das pretas', () => {
      const line = 'info depth 6 score cp 120 pv e7e5';
      const parsed = service.parseInfoLine(line, 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');

      expect(parsed.score.value).toBe(120);
      expect(parsed.whiteScore.value).toBe(-120);
    });

    it('deve extrair mate forçado a favor e contra com inversão para pretas', () => {
      // Mate a favor das brancas
      const line1 = 'info depth 8 score mate 2 pv d1h5 g7g6 h5e5';
      const parsed1 = service.parseInfoLine(line1, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(parsed1.score.type).toBe('mate');
      expect(parsed1.score.value).toBe(2);
      expect(parsed1.whiteScore.value).toBe(2);

      // Mate contra na vez das pretas -> whiteScore inverte
      const line2 = 'info depth 8 score mate -3 pv g8f6';
      const parsed2 = service.parseInfoLine(line2, 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
      expect(parsed2.score.type).toBe('mate');
      expect(parsed2.score.value).toBe(-3);
      expect(parsed2.whiteScore.value).toBe(3); // Invertido porque era desvantagem das pretas
    });

    it('deve lidar com formatos sem PV e valores negativos de centipawns', () => {
      const line = 'info depth 10 score cp -45 nodes 5000';
      const parsed = service.parseInfoLine(line, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

      expect(parsed.depth).toBe(10);
      expect(parsed.score.value).toBe(-45);
      expect(parsed.whiteScore.value).toBe(-45);
      expect(parsed.pv).toEqual([]);
    });
  });

  describe('setSkillLevel', () => {
    it('deve limitar o nível entre 0 e 20 e postar mensagem para worker se existir', async () => {
      const mockWorker = {
        postMessage: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
      service.worker = mockWorker;
      service.isReady = true;

      await service.setSkillLevel(25);
      expect(service.skillLevel).toBe(20);
      expect(mockWorker.postMessage).toHaveBeenCalledWith('setoption name Skill Level value 20');

      await service.setSkillLevel(-5);
      expect(service.skillLevel).toBe(0);
      expect(mockWorker.postMessage).toHaveBeenCalledWith('setoption name Skill Level value 0');

      await service.setSkillLevel(12);
      expect(service.skillLevel).toBe(12);
      expect(mockWorker.postMessage).toHaveBeenCalledWith('setoption name Skill Level value 12');
    });
  });

  describe('init and Worker Handshake', () => {
    it('deve concluir init imediatamente quando já estiver pronto', async () => {
      service.isReady = true;
      service.worker = {};
      const ready = await service.init();
      expect(ready).toBe(true);
    });

    it('deve lidar com mensagens uciok e readyok no handshake do worker', async () => {
      let messageHandler = null;
      const mockWorker = {
        postMessage: vi.fn(),
        addEventListener: vi.fn((event, handler) => {
          if (event === 'message') messageHandler = handler;
        }),
        removeEventListener: vi.fn()
      };

      // Simula construtor de Worker
      const originalWorker = globalThis.Worker;
      globalThis.Worker = vi.fn().mockImplementation(() => mockWorker);

      const initPromise = service.init();
      expect(mockWorker.postMessage).toHaveBeenCalledWith('uci');

      // Worker responde 'uciok'
      messageHandler({ data: 'uciok' });
      expect(mockWorker.postMessage).toHaveBeenCalledWith('isready');

      // Worker responde 'readyok'
      messageHandler({ data: 'readyok' });
      const res = await initPromise;

      expect(res).toBe(true);
      expect(service.isReady).toBe(true);

      globalThis.Worker = originalWorker;
    });
  });

  describe('handleMessage and Search Lifecycle', () => {
    it('deve atualizar lastEvaluation em linhas de info', () => {
      service.currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      service.handleMessage({ data: 'info depth 7 score cp 40 pv e2e4 e7e5' });

      expect(service.lastEvaluation).toBeDefined();
      expect(service.lastEvaluation.depth).toBe(7);
      expect(service.lastEvaluation.score.value).toBe(40);
    });

    it('deve resolver promise de busca quando receber bestmove', async () => {
      const mockWorker = {
        postMessage: vi.fn()
      };
      service.worker = mockWorker;
      service.isReady = true;

      const searchPromise = service.enqueueSearch('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 6, 200);

      expect(mockWorker.postMessage).toHaveBeenCalledWith('position fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(mockWorker.postMessage).toHaveBeenCalledWith('go depth 6 movetime 200');

      service.handleMessage({ data: 'info depth 6 score cp 30 pv e2e4' });
      service.handleMessage({ data: 'bestmove e2e4 ponder e7e5' });

      const result = await searchPromise;
      expect(result.bestMove).toBe('e2e4');
      expect(result.evaluation.score.value).toBe(30);
    });
  });

  describe('evaluatePosition and getBestMove', () => {
    it('evaluatePosition deve retornar score, bestMove, depth e pv', async () => {
      vi.spyOn(service, 'enqueueSearch').mockResolvedValue({
        bestMove: 'g1f3',
        evaluation: {
          score: { type: 'cp', value: 45 },
          whiteScore: { type: 'cp', value: 45 },
          depth: 8,
          pv: ['g1f3', 'd7d5']
        }
      });

      const res = await service.evaluatePosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 8, 400);
      expect(res.bestMove).toBe('g1f3');
      expect(res.score.value).toBe(45);
      expect(res.pv).toEqual(['g1f3', 'd7d5']);
      expect(res.depth).toBe(8);
    });

    it('getBestMove deve retornar apenas a string do lance UCI', async () => {
      vi.spyOn(service, 'enqueueSearch').mockResolvedValue({
        bestMove: 'd2d4',
        evaluation: null
      });

      const move = await service.getBestMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(move).toBe('d2d4');
    });
  });

  describe('stop and resetGame', () => {
    it('stop deve enviar comando stop ao worker', () => {
      const mockWorker = { postMessage: vi.fn() };
      service.worker = mockWorker;

      service.stop();
      expect(mockWorker.postMessage).toHaveBeenCalledWith('stop');
    });

    it('resetGame deve enviar ucinewgame e limpar a fila de comandos', () => {
      const mockWorker = { postMessage: vi.fn() };
      service.worker = mockWorker;
      service.commandQueue = [{ fen: 'test' }];
      service.isProcessing = true;

      service.resetGame();
      expect(mockWorker.postMessage).toHaveBeenCalledWith('ucinewgame');
      expect(service.commandQueue).toHaveLength(0);
      expect(service.isProcessing).toBe(false);
      expect(service.lastEvaluation).toBeNull();
    });
  });
});
