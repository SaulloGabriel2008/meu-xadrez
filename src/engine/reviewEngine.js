/**
 * Review Engine - Game Review estilo Chess.com
 * Avaliação assíncrona lance a lance, cálculo de probabilidade logística de vitória,
 * classificação estrita de lances e cálculo de precisão (Accuracy Score).
 */

import { stockfishService } from './stockfishService.js';

export const MOVE_CLASSIFICATIONS = {
  BRILLIANT: { key: 'brilliant', label: 'Brilhante', badge: '!!', color: '#1ba7a6', symbol: '!!' },
  BEST: { key: 'best', label: 'Melhor Lance', badge: '★', color: '#81b64c', symbol: '★' },
  EXCELLENT: { key: 'excellent', label: 'Excelente', badge: '✓', color: '#8ebf42', symbol: '✓' },
  GOOD: { key: 'good', label: 'Bom', badge: '👍', color: '#96bc66', symbol: '👍' },
  INACCURACY: { key: 'inaccuracy', label: 'Imprecisão', badge: '?!', color: '#f7c631', symbol: '?!' },
  MISTAKE: { key: 'mistake', label: 'Erro', badge: '?', color: '#e58f2a', symbol: '?' },
  BLUNDER: { key: 'blunder', label: 'Capivarada', badge: '??', color: '#ca3431', symbol: '??' },
  MISSED_WIN: { key: 'missed_win', label: 'Perda de Oportunidade', badge: '✖', color: '#db5656', symbol: '✖' }
};

export class ReviewEngine {
  constructor(service = stockfishService) {
    this.service = service;
  }

  /**
   * Converte avaliação em centipawns para probabilidade de vitória (0.0 a 1.0)
   * Fórmula logística padrão do xadrez moderno (Lichess/Chess.com)
   * @param {{ type: 'cp' | 'mate', value: number }} score - Score relativo ao jogador da vez
   * @returns {number} Valor entre 0 e 1
   */
  winProbability(score) {
    if (!score) return 0.5;

    if (score.type === 'mate') {
      if (score.value > 0) return 1.0;
      if (score.value < 0) return 0.0;
      return 0.5;
    }

    const cp = score.value;
    // Logística baseada em constantes calibradas para xadrez
    return 1 / (1 + Math.exp(-0.00368208 * cp));
  }

  /**
   * Classifica um lance com base na perda de probabilidade e dinâmica tática.
   */
  classifyMove({
    move,
    beforeProb,
    afterProb,
    probLoss,
    engineBestMove,
    isSacrifice = false
  }) {
    // 1. Perda de Oportunidade (Missed Win):
    // Jogador tinha vantagem quase vencedora (>= 80%) e caiu para situação disputada ou inferior (< 55%)
    if (beforeProb >= 0.80 && afterProb < 0.55) {
      return MOVE_CLASSIFICATIONS.MISSED_WIN;
    }

    // 2. Capivarada / Blunder (??): Perda severa > 30%
    if (probLoss > 0.30) {
      return MOVE_CLASSIFICATIONS.BLUNDER;
    }

    // 3. Erro (?): Perda entre 15% e 30%
    if (probLoss > 0.15) {
      return MOVE_CLASSIFICATIONS.MISTAKE;
    }

    // 4. Imprecisão (?!): Perda entre 7% e 15%
    if (probLoss > 0.07) {
      return MOVE_CLASSIFICATIONS.INACCURACY;
    }

    // 5. Brilhante (!!):
    // Sacrifício intencional de peça maior com retenção de vitória ou ganho tático comprovado
    const uciMove = move.from + move.to + (move.promotion || '');
    const isEngineMatch = engineBestMove && (uciMove === engineBestMove);

    if (isSacrifice && probLoss <= 0.02 && afterProb >= 0.60) {
      return MOVE_CLASSIFICATIONS.BRILLIANT;
    }

    // 6. Melhor Lance (★): Lance idêntico à escolha do motor ou perda ínfima <= 1%
    if (isEngineMatch || probLoss <= 0.01) {
      return MOVE_CLASSIFICATIONS.BEST;
    }

    // 7. Excelente (✓): Perda <= 3%
    if (probLoss <= 0.03) {
      return MOVE_CLASSIFICATIONS.EXCELLENT;
    }

    // 8. Bom (👍): Perda <= 7%
    return MOVE_CLASSIFICATIONS.GOOD;
  }

  /**
   * Avalia se houve sacrifício voluntário de material de maior valor
   */
  detectSacrifice(move) {
    if (!move) return false;
    const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    const movedVal = pieceValues[move.piece] || 0;
    const capturedVal = move.captured ? (pieceValues[move.captured] || 0) : 0;

    // Entregou peça maior (ex: Torre por Bispo, ou Dama por Peão/nada)
    return (movedVal >= 5 && movedVal > (capturedVal + 2));
  }

  /**
   * Calcula a pontuação de acurácia individual do lance (0 a 100%)
   */
  calculateMoveAccuracy(probLoss) {
    // Curva exponencial suave que penaliza perdas maiores
    const acc = 100 * Math.exp(-5.0 * Math.max(0, probLoss));
    return Math.max(0, Math.min(100, acc));
  }

  /**
   * Executa a análise completa da partida lance a lance.
   * @param {Array<{ fenBefore: string, fenAfter: string, move: any, san: string, color: 'w'|'b' }>} moveList
   * @param {Function} onProgress - Callback (percent, currentMoveIdx, totalMoves)
   * @param {number} depth - Profundidade de análise do motor
   */
  async reviewGame(moveList, onProgress = null, depth = 8) {
    const total = moveList.length;
    const reviewedMoves = [];

    const stats = {
      white: {
        accuracy: 100,
        accuracies: [],
        brilliant: 0,
        best: 0,
        excellent: 0,
        good: 0,
        inaccuracy: 0,
        mistake: 0,
        blunder: 0,
        missed_win: 0
      },
      black: {
        accuracy: 100,
        accuracies: [],
        brilliant: 0,
        best: 0,
        excellent: 0,
        good: 0,
        inaccuracy: 0,
        mistake: 0,
        blunder: 0,
        missed_win: 0
      }
    };

    // Posição inicial pré-lance 1
    let previousEval = null;
    if (moveList.length > 0) {
      previousEval = await this.service.evaluatePosition(moveList[0].fenBefore, depth, 350);
    }

    for (let i = 0; i < total; i++) {
      const step = moveList[i];
      const isWhite = (step.color === 'w');
      const playerKey = isWhite ? 'white' : 'black';

      // Avaliação da posição após a jogada
      const currentEval = await this.service.evaluatePosition(step.fenAfter, depth, 350);

      // Probabilidade do ponto de vista de quem fez o lance:
      // WhiteScore é positivo para Brancas e negativo para Pretas.
      const beforeCp = isWhite ? previousEval.score.value : -previousEval.score.value;
      const afterCp = isWhite ? currentEval.score.value : -currentEval.score.value;

      const beforeProb = this.winProbability({ type: previousEval.score.type, value: beforeCp });
      const afterProb = this.winProbability({ type: currentEval.score.type, value: afterCp });

      const probLoss = Math.max(0, beforeProb - afterProb);
      const isSacrifice = this.detectSacrifice(step.move);

      const classification = this.classifyMove({
        move: step.move,
        beforeProb,
        afterProb,
        probLoss,
        engineBestMove: previousEval.bestMove,
        isSacrifice
      });

      const moveAccuracy = this.calculateMoveAccuracy(probLoss);
      stats[playerKey].accuracies.push(moveAccuracy);
      stats[playerKey][classification.key]++;

      reviewedMoves.push({
        index: i,
        san: step.san,
        color: step.color,
        fenBefore: step.fenBefore,
        fenAfter: step.fenAfter,
        move: step.move,
        classification,
        bestMove: previousEval.bestMove,
        evalBefore: previousEval.score,
        evalAfter: currentEval.score,
        beforeProb: Math.round(beforeProb * 100),
        afterProb: Math.round(afterProb * 100),
        accuracy: Math.round(moveAccuracy)
      });

      // Posição para o próximo lance
      previousEval = currentEval;

      if (onProgress) {
        const percent = Math.round(((i + 1) / total) * 100);
        onProgress(percent, i + 1, total);
      }
    }

    // Calcula acurácia geral final (média aritmética das jogadas)
    if (stats.white.accuracies.length > 0) {
      const sum = stats.white.accuracies.reduce((a, b) => a + b, 0);
      stats.white.accuracy = Math.round((sum / stats.white.accuracies.length) * 10) / 10;
    }
    if (stats.black.accuracies.length > 0) {
      const sum = stats.black.accuracies.reduce((a, b) => a + b, 0);
      stats.black.accuracy = Math.round((sum / stats.black.accuracies.length) * 10) / 10;
    }

    return {
      reviewedMoves,
      stats
    };
  }
}

export const reviewEngine = new ReviewEngine();
