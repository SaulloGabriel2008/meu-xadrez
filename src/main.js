/**
 * Main Application Orchestrator
 * Integração da Máquina de Estados, Chess.js, BoardController, StockfishService,
 * ReviewEngine, EvalBar, ChartRenderer e SoundManager.
 */

import { Chess } from 'chess.js';
import { BoardController } from './game/boardController.js';
import { BOTS, getBotById } from './game/bots.js';
import { stockfishService } from './engine/stockfishService.js';
import { reviewEngine, MOVE_CLASSIFICATIONS } from './engine/reviewEngine.js';
import { EvalBar } from './ui/evalBar.js';
import { ChartRenderer } from './ui/chartRenderer.js';
import { soundManager } from './utils/audio.js';

class ChessApp {
  constructor() {
    this.chess = new Chess();
    this.boardController = null;
    this.evalBar = null;
    this.chartRenderer = null;

    // Estado da Aplicação
    this.selectedBot = BOTS[0];
    this.userSide = 'white'; // 'white' ou 'black'
    this.gameHistory = []; // { fenBefore, fenAfter, move, san, color }
    this.currentNavIndex = -1; // -1 = início, 0..N-1 = lances da partida
    this.isBotThinking = false;
    this.reviewedData = null; // Resultado do Game Review

    this.init();
  }

  async init() {
    this.setupDOM();
    this.setupBoard();
    this.setupEvalBar();
    this.setupChart();
    this.bindEvents();

    // Inicializa o motor Stockfish em segundo plano
    try {
      await stockfishService.init();
      this.updateLiveEvaluation();
    } catch (err) {
      console.warn('Inicialização Stockfish com fallback:', err);
    }
  }

  setupDOM() {
    // Renderiza a lista de Bots
    const botsList = document.getElementById('bots-list');
    botsList.innerHTML = '';

    BOTS.forEach((bot, idx) => {
      const card = document.createElement('div');
      card.className = `bot-card ${idx === 0 ? 'selected' : ''}`;
      card.dataset.botId = bot.id;
      card.innerHTML = `
        <div class="bot-card-avatar">${bot.avatar}</div>
        <div class="bot-card-meta">
          <div class="bot-card-header">
            <span class="bot-card-name">${bot.name}</span>
            <span class="bot-card-elo">${bot.elo} ELO</span>
          </div>
          <div class="bot-card-desc">${bot.description}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        document.querySelectorAll('.bot-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedBot = bot;
        document.getElementById('selected-bot-label').textContent = bot.name;
        this.updateOpponentDisplay(bot);
      });

      botsList.appendChild(card);
    });

    this.updateOpponentDisplay(this.selectedBot);
  }

  updateOpponentDisplay(bot) {
    const avatarSlot = document.getElementById('opponent-avatar');
    if (avatarSlot) avatarSlot.innerHTML = bot.avatar;
    const nameSlot = document.getElementById('opponent-name');
    if (nameSlot) nameSlot.textContent = bot.name;
    const eloSlot = document.getElementById('opponent-elo');
    if (eloSlot) eloSlot.textContent = `${bot.elo} ELO (${bot.category})`;
  }

  setupBoard() {
    const boardSlot = document.getElementById('board-slot');
    this.boardController = new BoardController(boardSlot, {
      orientation: this.userSide,
      interactive: true,
      chess: this.chess,
      onMove: (moveObj) => this.handlePlayerMove(moveObj)
    });
  }

  setupEvalBar() {
    const evalSlot = document.getElementById('eval-bar-slot');
    this.evalBar = new EvalBar(evalSlot, {
      orientation: this.userSide
    });
  }

  setupChart() {
    const canvas = document.getElementById('eval-chart');
    this.chartRenderer = new ChartRenderer(canvas, {
      onPointClick: (index) => {
        this.navigateToMove(index);
      }
    });
  }

  bindEvents() {
    // Alternância de Abas
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabKey = btn.dataset.tab;
        this.switchTab(tabKey);
      });
    });

    // Seletor de lado (Brancas, Pretas, Aleatório)
    document.querySelectorAll('.side-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.side-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const color = btn.dataset.color;
        if (color === 'random') {
          this.userSide = Math.random() < 0.5 ? 'white' : 'black';
        } else {
          this.userSide = color;
        }
      });
    });

    // Iniciar jogo vs Bot
    document.getElementById('btn-start-bot-game').addEventListener('click', () => {
      this.startNewGame();
      this.switchTab('moves');
    });

    // Botões de Som e Virar Tabuleiro
    document.getElementById('btn-sound-toggle').addEventListener('click', () => {
      const isMuted = soundManager.toggleMute();
      document.getElementById('btn-sound-toggle').style.opacity = isMuted ? '0.4' : '1';
    });

    document.getElementById('btn-flip-board').addEventListener('click', () => {
      this.boardController.flip();
      this.evalBar.setOrientation(this.boardController.orientation);
    });

    // Navegação de Lances
    document.getElementById('btn-nav-first').addEventListener('click', () => this.navigateToMove(-1));
    document.getElementById('btn-nav-prev').addEventListener('click', () => this.navigateToMove(this.currentNavIndex - 1));
    document.getElementById('btn-nav-next').addEventListener('click', () => this.navigateToMove(this.currentNavIndex + 1));
    document.getElementById('btn-nav-last').addEventListener('click', () => this.navigateToMove(this.gameHistory.length - 1));

    document.getElementById('btn-review-prev').addEventListener('click', () => this.navigateToMove(this.currentNavIndex - 1));
    document.getElementById('btn-review-next').addEventListener('click', () => this.navigateToMove(this.currentNavIndex + 1));

    // Reiniciar e Iniciar Análise
    document.getElementById('btn-reset-game').addEventListener('click', () => this.startNewGame());
    document.getElementById('btn-request-review').addEventListener('click', () => this.triggerGameReview());

    // Ações do Modal de Fim de Jogo
    document.getElementById('btn-go-review').addEventListener('click', () => {
      document.getElementById('game-over-modal').classList.add('hidden');
      this.triggerGameReview();
    });

    document.getElementById('btn-go-rematch').addEventListener('click', () => {
      document.getElementById('game-over-modal').classList.add('hidden');
      this.startNewGame();
    });
  }

  switchTab(tabKey) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabKey);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('hidden', content.id !== `tab-${tabKey}`);
    });
  }

  startNewGame() {
    this.chess.reset();
    this.gameHistory = [];
    this.currentNavIndex = -1;
    this.reviewedData = null;
    this.isBotThinking = false;

    // Sincroniza orientações
    this.boardController.setOrientation(this.userSide);
    this.evalBar.setOrientation(this.userSide);
    this.evalBar.setScore({ type: 'cp', value: 0 });

    this.boardController.setChess(this.chess);
    this.boardController.setLastMove(null, null);
    this.boardController.setCheckSquare(null);
    this.boardController.clearArrows();
    this.boardController.setInteractive(true);

    stockfishService.resetGame();
    stockfishService.setSkillLevel(this.selectedBot.skillLevel);

    this.renderMovesTable();
    this.updateCapturedPieces();

    // Se o usuário joga de Pretas, o bot joga de Brancas primeiro
    if (this.userSide === 'black') {
      this.triggerBotTurn();
    } else {
      this.updateLiveEvaluation();
    }
  }

  handlePlayerMove(moveObj) {
    if (this.isBotThinking) return;

    const fenBefore = this.chess.fen();
    let moveResult = null;

    try {
      moveResult = this.chess.move({
        from: moveObj.from,
        to: moveObj.to,
        promotion: moveObj.promotion || 'q'
      });
    } catch {
      return;
    }

    if (!moveResult) return;

    const fenAfter = this.chess.fen();
    this.processMoveExecuted(fenBefore, fenAfter, moveResult);

    // Se a partida não acabou e for vez do bot
    if (!this.checkGameOver()) {
      const userColor = this.userSide === 'white' ? 'w' : 'b';
      if (this.chess.turn() !== userColor) {
        this.triggerBotTurn();
      }
    }
  }

  async triggerBotTurn() {
    this.isBotThinking = true;
    this.boardController.setInteractive(false);

    const fenBefore = this.chess.fen();
    try {
      const bestMoveUci = await stockfishService.getBestMove(fenBefore, {
        depth: this.selectedBot.depth,
        movetime: this.selectedBot.movetime
      });

      if (bestMoveUci && bestMoveUci !== '(none)') {
        const from = bestMoveUci.slice(0, 2);
        const to = bestMoveUci.slice(2, 4);
        const promo = bestMoveUci.length > 4 ? bestMoveUci[4] : 'q';

        const moveResult = this.chess.move({ from, to, promotion: promo });
        if (moveResult) {
          const fenAfter = this.chess.fen();
          this.processMoveExecuted(fenBefore, fenAfter, moveResult);
        }
      }
    } catch (err) {
      console.error('Erro no turno do bot:', err);
    } finally {
      this.isBotThinking = false;
      this.boardController.setInteractive(true);
      this.checkGameOver();
    }
  }

  processMoveExecuted(fenBefore, fenAfter, moveResult) {
    // Áudio
    if (this.chess.isCheck()) {
      soundManager.playCheckSound();
    } else if (moveResult.captured) {
      soundManager.playCaptureSound();
    } else if (moveResult.promotion) {
      soundManager.playPromoteSound();
    } else {
      soundManager.playMoveSound();
    }

    // Registra histórico
    const historyItem = {
      index: this.gameHistory.length,
      fenBefore,
      fenAfter,
      move: moveResult,
      san: moveResult.san,
      color: moveResult.color
    };
    this.gameHistory.push(historyItem);
    this.currentNavIndex = this.gameHistory.length - 1;

    // Atualiza tabuleiro
    this.boardController.setChess(this.chess);
    this.boardController.setLastMove(moveResult.from, moveResult.to);

    // Destaque de xeque
    if (this.chess.isCheck()) {
      const kingSquare = this.findKingSquare(this.chess.turn());
      this.boardController.setCheckSquare(kingSquare);
    } else {
      this.boardController.setCheckSquare(null);
    }

    this.renderMovesTable();
    this.updateCapturedPieces();
    this.updateLiveEvaluation();
  }

  findKingSquare(color) {
    const board = this.chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === color) {
          return `${String.fromCharCode(97 + c)}${8 - r}`;
        }
      }
    }
    return null;
  }

  async updateLiveEvaluation() {
    if (this.gameHistory.length === 0) return;
    try {
      const evaluation = await stockfishService.evaluatePosition(this.chess.fen(), 6, 250);
      this.evalBar.setScore(evaluation.score);
    } catch {
      // Ignora erro em avaliação rápida
    }
  }

  updateCapturedPieces() {
    const counts = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const onBoard = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } };

    this.chess.board().forEach(row => {
      row.forEach(p => {
        if (p && p.type !== 'k') {
          onBoard[p.color][p.type]++;
        }
      });
    });

    const userCapturedEl = document.getElementById('user-captured');
    const oppCapturedEl = document.getElementById('opponent-captured');

    // Peças brancas capturadas pelo oponente vs peças pretas capturadas pelo usuário
    if (userCapturedEl && oppCapturedEl) {
      let userCaps = '';
      let oppCaps = '';
      const symbols = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' };

      ['p', 'n', 'b', 'r', 'q'].forEach(t => {
        const whiteLost = counts[t] - onBoard.w[t];
        const blackLost = counts[t] - onBoard.b[t];
        if (whiteLost > 0) oppCaps += symbols[t].repeat(whiteLost);
        if (blackLost > 0) userCaps += symbols[t].repeat(blackLost);
      });

      userCapturedEl.textContent = userCaps;
      oppCapturedEl.textContent = oppCaps;
    }
  }

  checkGameOver() {
    if (!this.chess.isGameOver()) return false;

    let title = 'Fim de Jogo';
    let reason = '';
    let result = 'draw';

    if (this.chess.isCheckmate()) {
      const winner = this.chess.turn() === 'w' ? 'Pretas' : 'Brancas';
      title = `Vitória das ${winner}!`;
      reason = 'Por xeque-mate.';
      const userWon = (this.userSide === 'white' && winner === 'Brancas') ||
                      (this.userSide === 'black' && winner === 'Pretas');
      result = userWon ? 'win' : 'lose';
    } else if (this.chess.isDraw()) {
      title = 'Empate!';
      if (this.chess.isStalemate()) reason = 'Por afogamento.';
      else if (this.chess.isThreefoldRepetition()) reason = 'Por repetição de lances.';
      else if (this.chess.isInsufficientMaterial()) reason = 'Por material insuficiente.';
      else reason = 'Pela regra dos 50 lances.';
      result = 'draw';
    }

    soundManager.playGameEndSound(result);

    document.getElementById('go-icon').textContent = result === 'win' ? '🏆' : (result === 'lose' ? '💀' : '🤝');
    document.getElementById('go-title').textContent = title;
    document.getElementById('go-reason').textContent = reason;
    document.getElementById('game-over-modal').classList.remove('hidden');

    return true;
  }

  renderMovesTable() {
    const tbody = document.getElementById('moves-table-body');
    tbody.innerHTML = '';

    for (let i = 0; i < this.gameHistory.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whiteMove = this.gameHistory[i];
      const blackMove = this.gameHistory[i + 1] || null;

      const tr = document.createElement('tr');

      // Número do lance
      const tdNum = document.createElement('td');
      tdNum.className = 'move-num';
      tdNum.textContent = `${moveNum}.`;
      tr.appendChild(tdNum);

      // Lance das Brancas
      const tdWhite = document.createElement('td');
      const whiteSpan = document.createElement('span');
      whiteSpan.className = `move-cell ${this.currentNavIndex === i ? 'active' : ''}`;
      whiteSpan.textContent = whiteMove.san;
      if (this.reviewedData && this.reviewedData.reviewedMoves[i]) {
        const cls = this.reviewedData.reviewedMoves[i].classification;
        whiteSpan.innerHTML += ` <span class="move-badge" style="background-color: ${cls.color}">${cls.badge}</span>`;
      }
      whiteSpan.addEventListener('click', () => this.navigateToMove(i));
      tdWhite.appendChild(whiteSpan);
      tr.appendChild(tdWhite);

      // Lance das Pretas
      const tdBlack = document.createElement('td');
      if (blackMove) {
        const blackSpan = document.createElement('span');
        blackSpan.className = `move-cell ${this.currentNavIndex === i + 1 ? 'active' : ''}`;
        blackSpan.textContent = blackMove.san;
        if (this.reviewedData && this.reviewedData.reviewedMoves[i + 1]) {
          const cls = this.reviewedData.reviewedMoves[i + 1].classification;
          blackSpan.innerHTML += ` <span class="move-badge" style="background-color: ${cls.color}">${cls.badge}</span>`;
        }
        blackSpan.addEventListener('click', () => this.navigateToMove(i + 1));
        tdBlack.appendChild(blackSpan);
      }
      tr.appendChild(tdBlack);

      tbody.appendChild(tr);
    }
  }

  navigateToMove(index) {
    if (this.gameHistory.length === 0) return;
    const clampedIndex = Math.max(-1, Math.min(this.gameHistory.length - 1, index));
    this.currentNavIndex = clampedIndex;

    const tempChess = new Chess();

    if (clampedIndex === -1) {
      this.boardController.setChess(tempChess);
      this.boardController.setLastMove(null, null);
      this.boardController.setCheckSquare(null);
      this.boardController.clearArrows();
      this.evalBar.setScore({ type: 'cp', value: 0 });
    } else {
      for (let i = 0; i <= clampedIndex; i++) {
        const item = this.gameHistory[i];
        tempChess.move({ from: item.move.from, to: item.move.to, promotion: item.move.promotion || 'q' });
      }

      const activeMove = this.gameHistory[clampedIndex];
      this.boardController.setChess(tempChess);
      this.boardController.setLastMove(activeMove.move.from, activeMove.move.to);

      if (tempChess.isCheck()) {
        const kingSq = this.findKingSquare(tempChess.turn());
        this.boardController.setCheckSquare(kingSq);
      } else {
        this.boardController.setCheckSquare(null);
      }

      this.boardController.clearArrows();
      // Mostra seta do lance jogado
      this.boardController.addArrow(activeMove.move.from, activeMove.move.to, '#f7c631');

      // Se há dados de revisão, mostra o melhor lance sugerido se diferente
      if (this.reviewedData && this.reviewedData.reviewedMoves[clampedIndex]) {
        const rev = this.reviewedData.reviewedMoves[clampedIndex];
        this.evalBar.setScore(rev.evalAfter);

        if (rev.bestMove && rev.bestMove !== '(none)') {
          const bFrom = rev.bestMove.slice(0, 2);
          const bTo = rev.bestMove.slice(2, 4);
          if (bFrom !== activeMove.move.from || bTo !== activeMove.move.to) {
            this.boardController.addArrow(bFrom, bTo, '#81b64c');
          }
        }
      }
    }

    this.renderMovesTable();
    if (this.chartRenderer) {
      this.chartRenderer.highlightPoint(clampedIndex);
    }
  }

  async triggerGameReview() {
    if (this.gameHistory.length === 0) {
      alert('Faça pelo menos um lance para analisar a partida!');
      return;
    }

    this.switchTab('review');
    const progressBox = document.getElementById('review-progress-box');
    const progressFill = document.getElementById('review-progress-fill');
    const progressPct = document.getElementById('review-progress-pct');

    progressBox.classList.remove('hidden');
    progressFill.style.width = '0%';
    progressPct.textContent = '0%';

    try {
      const results = await reviewEngine.reviewGame(this.gameHistory, (percent) => {
        progressFill.style.width = `${percent}%`;
        progressPct.textContent = `${percent}%`;
      }, 7);

      this.reviewedData = results;
      progressBox.classList.add('hidden');

      // Atualiza Acurácia
      document.getElementById('acc-white').textContent = `${results.stats.white.accuracy}%`;
      document.getElementById('acc-black').textContent = `${results.stats.black.accuracy}%`;

      // Renderiza Gráfico
      this.chartRenderer.render(results.reviewedMoves);

      // Renderiza Grade de Estatísticas
      this.renderReviewStatsGrid(results.stats);

      // Atualiza badges na tabela de lances
      this.renderMovesTable();

      // Navega para o primeiro lance para iniciar a exploração
      this.navigateToMove(0);
    } catch (err) {
      console.error('Erro na análise da partida:', err);
      progressBox.classList.add('hidden');
    }
  }

  renderReviewStatsGrid(stats) {
    const grid = document.getElementById('review-stats-grid');
    grid.innerHTML = '';

    const categories = [
      MOVE_CLASSIFICATIONS.BRILLIANT,
      MOVE_CLASSIFICATIONS.BEST,
      MOVE_CLASSIFICATIONS.EXCELLENT,
      MOVE_CLASSIFICATIONS.GOOD,
      MOVE_CLASSIFICATIONS.INACCURACY,
      MOVE_CLASSIFICATIONS.MISTAKE,
      MOVE_CLASSIFICATIONS.BLUNDER,
      MOVE_CLASSIFICATIONS.MISSED_WIN
    ];

    categories.forEach(cat => {
      const row = document.createElement('div');
      row.className = 'stat-row';
      row.innerHTML = `
        <div class="stat-row-left">
          <span class="stat-badge" style="background-color: ${cat.color}">${cat.badge}</span>
          <span>${cat.label}</span>
        </div>
        <div class="stat-counts">
          <span style="color: #ffffff;">${stats.white[cat.key]}</span>
          <span style="color: var(--text-muted);">&bull;</span>
          <span style="color: #ffffff;">${stats.black[cat.key]}</span>
        </div>
      `;
      grid.appendChild(row);
    });
  }
}

// Inicializa a aplicação ao carregar o DOM
window.addEventListener('DOMContentLoaded', () => {
  window.chessApp = new ChessApp();
});
