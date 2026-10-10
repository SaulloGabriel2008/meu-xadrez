/**
 * Stockfish Service
 * Gerenciador assíncrono baseado em Promises para comunicação com o Web Worker Stockfish via UCI.
 */

export class StockfishService {
  constructor(workerUrl = '/stockfish.js') {
    this.workerUrl = workerUrl;
    this.worker = null;
    this.isReady = false;
    this.currentResolver = null;
    this.currentRejecter = null;
    this.lastEvaluation = null;
    this.currentFen = null;
    this.skillLevel = 20;
    this.commandQueue = [];
    this.isProcessing = false;
  }

  /**
   * Inicializa o Web Worker e estabelece o handshake UCI.
   */
  async init() {
    if (this.isReady && this.worker) return true;

    return new Promise((resolve, reject) => {
      try {
        if (typeof window === 'undefined' || typeof Worker === 'undefined') {
          // Fallback para ambiente de teste headless
          this.isReady = true;
          return resolve(true);
        }

        this.worker = new Worker(this.workerUrl);

        const onInitMessage = (e) => {
          const line = (typeof e.data === 'string') ? e.data.trim() : '';
          if (line === 'uciok') {
            this.worker.postMessage('isready');
          } else if (line === 'readyok') {
            this.isReady = true;
            this.worker.removeEventListener('message', onInitMessage);
            this.worker.addEventListener('message', this.handleMessage.bind(this));
            resolve(true);
          }
        };

        this.worker.addEventListener('message', onInitMessage);
        this.worker.addEventListener('error', (err) => {
          console.error('[StockfishService] Erro no worker:', err);
          reject(err);
        });

        // Dispara handshake inicial
        this.worker.postMessage('uci');
      } catch (err) {
        console.warn('[StockfishService] Não foi possível carregar Worker nativo:', err);
        this.isReady = true;
        resolve(true);
      }
    });
  }

  /**
   * Trata as mensagens emitidas pelo worker durante buscas e análises.
   */
  handleMessage(e) {
    const line = (typeof e.data === 'string') ? e.data.trim() : '';
    if (!line) return;

    // Linha de informação do motor: info depth 4 score cp 45 time 120 pv e2e4 ...
    if (line.startsWith('info') && line.includes('score')) {
      const parsed = this.parseInfoLine(line, this.currentFen);
      if (parsed) {
        this.lastEvaluation = parsed;
      }
    }

    // Linha final da busca: bestmove e7e5 [ponder ...]
    if (line.startsWith('bestmove')) {
      const parts = line.split(/\s+/);
      const bestMove = parts[1] || null;

      const result = {
        bestMove,
        evaluation: this.lastEvaluation || {
          score: { type: 'cp', value: 0 },
          whiteScore: { type: 'cp', value: 0 },
          depth: 1,
          pv: [bestMove].filter(Boolean)
        }
      };

      if (this.currentResolver) {
        const resolve = this.currentResolver;
        this.currentResolver = null;
        this.currentRejecter = null;
        resolve(result);
      }

      this.processNextInQueue();
    }
  }

  /**
   * Faz o parse das linhas de avaliação do motor UCI
   */
  parseInfoLine(line, fen) {
    const isBlackTurn = fen ? fen.split(' ')[1] === 'b' : false;

    let scoreType = 'cp';
    let scoreVal = 0;
    let depth = 1;
    let pv = [];

    const depthMatch = line.match(/\bdepth\s+(\d+)/);
    if (depthMatch) depth = parseInt(depthMatch[1], 10);

    const cpMatch = line.match(/\bscore\s+cp\s+(-?\d+)/);
    if (cpMatch) {
      scoreType = 'cp';
      scoreVal = parseInt(cpMatch[1], 10);
    } else {
      const mateMatch = line.match(/\bscore\s+mate\s+(-?\d+)/);
      if (mateMatch) {
        scoreType = 'mate';
        scoreVal = parseInt(mateMatch[1], 10);
      }
    }

    const pvIndex = line.indexOf(' pv ');
    if (pvIndex !== -1) {
      pv = line.substring(pvIndex + 4).trim().split(/\s+/);
    }

    // Em UCI, score é da perspectiva de quem joga.
    // Convertemos whiteScore para perspectiva fixa das Brancas (usada na Eval Bar).
    const whiteVal = isBlackTurn ? -scoreVal : scoreVal;

    return {
      depth,
      score: { type: scoreType, value: scoreVal },
      whiteScore: { type: scoreType, value: whiteVal },
      pv
    };
  }

  /**
   * Ajusta o nível de habilidade (Skill Level 0 a 20)
   */
  async setSkillLevel(level) {
    await this.init();
    this.skillLevel = Math.max(0, Math.min(20, level));
    if (this.worker) {
      this.worker.postMessage(`setoption name Skill Level value ${this.skillLevel}`);
    }
  }

  /**
   * Envia comando de busca e aguarda o bestmove
   */
  enqueueSearch(fen, depth = 6, movetime = 500) {
    return new Promise((resolve, reject) => {
      this.commandQueue.push({ fen, depth, movetime, resolve, reject });
      if (!this.isProcessing) {
        this.processNextInQueue();
      }
    });
  }

  processNextInQueue() {
    if (this.commandQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const item = this.commandQueue.shift();
    this.currentResolver = item.resolve;
    this.currentRejecter = item.reject;
    this.currentFen = item.fen;
    this.lastEvaluation = null;

    if (!this.worker) {
      // Fallback para mock / teste sem worker
      setTimeout(() => {
        item.resolve({
          bestMove: 'e2e4',
          evaluation: {
            score: { type: 'cp', value: 20 },
            whiteScore: { type: 'cp', value: 20 },
            depth: item.depth,
            pv: ['e2e4']
          }
        });
        this.processNextInQueue();
      }, 50);
      return;
    }

    this.worker.postMessage(`position fen ${item.fen}`);
    this.worker.postMessage(`go depth ${item.depth} movetime ${item.movetime}`);
  }

  /**
   * Obtém o melhor lance para uma posição dada
   */
  async getBestMove(fen, options = {}) {
    await this.init();
    const depth = options.depth || 6;
    const movetime = options.movetime || 600;
    const result = await this.enqueueSearch(fen, depth, movetime);
    return result.bestMove;
  }

  /**
   * Avalia a posição e retorna informações detalhadas
   */
  async evaluatePosition(fen, depth = 8, movetime = 400) {
    await this.init();
    const result = await this.enqueueSearch(fen, depth, movetime);
    return {
      score: result.evaluation ? result.evaluation.whiteScore : { type: 'cp', value: 0 },
      bestMove: result.bestMove,
      pv: result.evaluation ? result.evaluation.pv : [],
      depth: result.evaluation ? result.evaluation.depth : depth
    };
  }

  /**
   * Interrompe qualquer cálculo em andamento
   */
  stop() {
    if (this.worker) {
      this.worker.postMessage('stop');
    }
  }

  /**
   * Reinicia o estado do motor
   */
  resetGame() {
    if (this.worker) {
      this.worker.postMessage('ucinewgame');
    }
    this.commandQueue = [];
    this.isProcessing = false;
    this.currentResolver = null;
    this.lastEvaluation = null;
  }
}

export const stockfishService = new StockfishService();
