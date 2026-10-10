/**
 * Board Controller
 * Renderização dinâmica do tabuleiro com peças SVG de alta resolução,
 * suporte duplo a Drag & Drop e Clique, setas SVG vetoriais sobrepostas,
 * destaques de xeque/último lance e modal de promoção de peão.
 */

// Conjunto de peças em SVG vetorial nítido (Padrão de alta fidelidade)
export const PIECE_SVGS = {
  wP: `<svg viewBox="0 0 45 45"><path d="m22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  wN: `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#fff"/><path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3" fill="#fff"/><circle cx="9.5" cy="25.5" r=".5" fill="#000"/><path d="M15 15.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0" fill="#000"/></g></svg>`,
  wB: `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g fill="#fff" stroke-linecap="butt"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g><path d="M17.5 26h10M15 30h15m-7.5-14.5v5m-2.5-2.5h5"/></g></svg>`,
  wR: `<svg viewBox="0 0 45 45"><g fill="#fff" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zm3-3v-4h21v4H12zm1-4h19v-2H13v2zm1-2h17v-1H14v1zm.5-1v-8.5l2-3.5h12l2 3.5V30h-16zm2.5-12.5l-2-2.5h15l-2 2.5h-11zM11 14h23v-5h-4v2h-4v-2h-7v2h-4v-2h-4v5z" stroke-linecap="butt"/></g></svg>`,
  wQ: `<svg viewBox="0 0 45 45"><g fill="#fff" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm16.5-4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM14 8a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm21 0a2 2 0 1 1-4 0 2 2 0 1 1 4 0z"/><path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25l-7-11 2 12zm0 3c9-1 18-1 27 0v3H9v-3zm0 5c9-1 18-1 27 0v3H9v-3z" stroke-linecap="butt"/><circle cx="6" cy="12" r="2"/><circle cx="14" cy="9" r="2"/><circle cx="22.5" cy="8" r="2"/><circle cx="31" cy="9" r="2"/><circle cx="39" cy="12" r="2"/></g></svg>`,
  wK: `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 11.63V6M20 8h5" stroke-linejoin="miter"/><path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#fff" stroke-linecap="butt"/><path d="M11.5 37c5.5 3.5 16.5 3.5 22 0v-7s9-4.5 6-10.5c-4-1-6 2-6 2s-3-2.5-6-2.5c-3 0-5 2.5-5 2.5s-2-3-5-2.5c-3 0-6 2.5-6 2.5s-2-3-6-2c-3 6 6 10.5 6 10.5v7z" fill="#fff"/><path d="M11.5 30c5.5-3 16.5-3 22 0m-22 3.5c5.5-3 16.5-3 22 0m-22 3.5c5.5-3 16.5-3 22 0"/></g></svg>`,

  bP: `<svg viewBox="0 0 45 45"><path d="m22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#312e2b" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/></svg>`,
  bN: `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#312e2b"/><path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3" fill="#312e2b"/><circle cx="9.5" cy="25.5" r=".5" fill="#fff"/><path d="M15 15.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0" fill="#fff"/></g></svg>`,
  bB: `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><g fill="#312e2b" stroke-linecap="butt"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g><path d="M17.5 26h10M15 30h15m-7.5-14.5v5m-2.5-2.5h5"/></g></svg>`,
  bR: `<svg viewBox="0 0 45 45"><g fill="#312e2b" fill-rule="evenodd" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zm3-3v-4h21v4H12zm1-4h19v-2H13v2zm1-2h17v-1H14v1zm.5-1v-8.5l2-3.5h12l2 3.5V30h-16zm2.5-12.5l-2-2.5h15l-2 2.5h-11zM11 14h23v-5h-4v2h-4v-2h-7v2h-4v-2h-4v5z" stroke-linecap="butt"/></g></svg>`,
  bQ: `<svg viewBox="0 0 45 45"><g fill="#312e2b" fill-rule="evenodd" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm16.5-4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM14 8a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm21 0a2 2 0 1 1-4 0 2 2 0 1 1 4 0z"/><path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25l-7-11 2 12zm0 3c9-1 18-1 27 0v3H9v-3zm0 5c9-1 18-1 27 0v3H9v-3z" stroke-linecap="butt"/><circle cx="6" cy="12" r="2"/><circle cx="14" cy="9" r="2"/><circle cx="22.5" cy="8" r="2"/><circle cx="31" cy="9" r="2"/><circle cx="39" cy="12" r="2"/></g></svg>`,
  bK: `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 11.63V6M20 8h5" stroke-linejoin="miter"/><path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#312e2b" stroke-linecap="butt"/><path d="M11.5 37c5.5 3.5 16.5 3.5 22 0v-7s9-4.5 6-10.5c-4-1-6 2-6 2s-3-2.5-6-2.5c-3 0-5 2.5-5 2.5s-2-3-5-2.5c-3 0-6 2.5-6 2.5s-2-3-6-2c-3 6 6 10.5 6 10.5v7z" fill="#312e2b"/><path d="M11.5 30c5.5-3 16.5-3 22 0m-22 3.5c5.5-3 16.5-3 22 0m-22 3.5c5.5-3 16.5-3 22 0"/></g></svg>`
};

export class BoardController {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.orientation = options.orientation || 'white'; // 'white' ou 'black'
    this.interactive = options.interactive !== false;
    this.onMove = options.onMove || (() => {});
    this.chess = options.chess || null; // Instância de chess.js

    this.selectedSquare = null;
    this.validMoves = [];
    this.lastMove = null; // { from: 'e2', to: 'e4' }
    this.checkSquare = null; // casa do rei em xeque
    this.arrows = []; // [{ from: 'e2', to: 'e4', color: '#81b64c' }]

    this.pendingPromotion = null; // { from, to }

    this.initDOM();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="chess-board-wrapper">
        <div class="chess-board-grid"></div>
        <svg class="board-arrows-layer" viewBox="0 0 800 800"></svg>
        <div class="promotion-modal-overlay hidden">
          <div class="promotion-modal-card">
            <h4 class="promo-title">Escolha a Promoção</h4>
            <div class="promo-choices"></div>
          </div>
        </div>
      </div>
    `;

    this.grid = this.container.querySelector('.chess-board-grid');
    this.arrowsLayer = this.container.querySelector('.board-arrows-layer');
    this.promoOverlay = this.container.querySelector('.promotion-modal-overlay');
    this.promoChoices = this.container.querySelector('.promo-choices');

    this.renderSquares();
  }

  renderSquares() {
    this.grid.innerHTML = '';
    const isFlipped = (this.orientation === 'black');

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const row = isFlipped ? 7 - r : r;
        const col = isFlipped ? 7 - c : c;

        const file = String.fromCharCode(97 + col);
        const rank = 8 - row;
        const squareKey = `${file}${rank}`;
        const isLight = ((row + col) % 2 === 0);

        const sq = document.createElement('div');
        sq.className = `board-square ${isLight ? 'light-square' : 'dark-square'}`;
        sq.dataset.square = squareKey;

        // Marcadores de rank/file nos cantos (estilo Chess.com)
        if (col === (isFlipped ? 7 : 0)) {
          const rankLabel = document.createElement('span');
          rankLabel.className = 'square-coord rank-coord';
          rankLabel.textContent = rank;
          sq.appendChild(rankLabel);
        }
        if (row === (isFlipped ? 0 : 7)) {
          const fileLabel = document.createElement('span');
          fileLabel.className = 'square-coord file-coord';
          fileLabel.textContent = file;
          sq.appendChild(fileLabel);
        }

        // Eventos de Clique e Drag & Drop
        sq.addEventListener('click', (e) => this.handleSquareClick(squareKey, e));
        sq.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        });
        sq.addEventListener('drop', (e) => this.handleDrop(squareKey, e));

        this.grid.appendChild(sq);
      }
    }

    this.updatePieces();
    this.updateHighlights();
    this.renderArrows();
  }

  flip() {
    this.orientation = (this.orientation === 'white') ? 'black' : 'white';
    this.renderSquares();
  }

  setOrientation(color) {
    if (this.orientation !== color) {
      this.orientation = color;
      this.renderSquares();
    }
  }

  setChess(chessInstance) {
    this.chess = chessInstance;
    this.selectedSquare = null;
    this.validMoves = [];
    this.updatePieces();
    this.updateHighlights();
  }

  setInteractive(val) {
    this.interactive = !!val;
  }

  setLastMove(from, to) {
    this.lastMove = (from && to) ? { from, to } : null;
    this.updateHighlights();
  }

  setCheckSquare(square) {
    this.checkSquare = square;
    this.updateHighlights();
  }

  clearArrows() {
    this.arrows = [];
    this.renderArrows();
  }

  addArrow(from, to, color = '#81b64c') {
    this.arrows.push({ from, to, color });
    this.renderArrows();
  }

  updatePieces() {
    if (!this.chess) return;

    const squares = this.grid.querySelectorAll('.board-square');
    squares.forEach(sq => {
      const squareKey = sq.dataset.square;
      const piece = this.chess.get(squareKey);

      // Remove peça anterior se houver
      const existingPiece = sq.querySelector('.chess-piece');
      if (existingPiece) {
        existingPiece.remove();
      }

      if (piece) {
        const pieceCode = `${piece.color}${piece.type.toUpperCase()}`;
        const pieceEl = document.createElement('div');
        pieceEl.className = `chess-piece ${piece.color === 'w' ? 'piece-white' : 'piece-black'}`;
        pieceEl.innerHTML = PIECE_SVGS[pieceCode] || '';
        pieceEl.draggable = this.interactive;

        pieceEl.addEventListener('dragstart', (e) => this.handleDragStart(squareKey, e));
        pieceEl.addEventListener('dragend', () => this.handleDragEnd());

        sq.appendChild(pieceEl);
      }
    });
  }

  updateHighlights() {
    const squares = this.grid.querySelectorAll('.board-square');
    squares.forEach(sq => {
      const squareKey = sq.dataset.square;

      // Limpa classes anteriores
      sq.classList.remove('square-selected', 'square-last-move', 'square-in-check', 'square-move-dest', 'square-capture-dest');

      // Seleção
      if (this.selectedSquare === squareKey) {
        sq.classList.add('square-selected');
      }

      // Último lance
      if (this.lastMove && (this.lastMove.from === squareKey || this.lastMove.to === squareKey)) {
        sq.classList.add('square-last-move');
      }

      // Xeque
      if (this.checkSquare === squareKey) {
        sq.classList.add('square-in-check');
      }

      // Destinos válidos
      const validMove = this.validMoves.find(m => m.to === squareKey);
      if (validMove) {
        if (validMove.captured || (this.chess && this.chess.get(squareKey))) {
          sq.classList.add('square-capture-dest');
        } else {
          sq.classList.add('square-move-dest');
        }
      }
    });
  }

  handleSquareClick(squareKey) {
    if (!this.interactive || !this.chess) return;

    // Se já havia uma peça selecionada e clicou num destino válido
    if (this.selectedSquare) {
      const move = this.validMoves.find(m => m.to === squareKey);
      if (move) {
        this.attemptMove(this.selectedSquare, squareKey);
        return;
      }
    }

    // Se clicou na mesma casa, cancela seleção
    if (this.selectedSquare === squareKey) {
      this.selectedSquare = null;
      this.validMoves = [];
      this.updateHighlights();
      return;
    }

    // Seleciona nova peça da vez
    const piece = this.chess.get(squareKey);
    if (piece && piece.color === this.chess.turn()) {
      this.selectedSquare = squareKey;
      this.validMoves = this.chess.moves({ square: squareKey, verbose: true });
    } else {
      this.selectedSquare = null;
      this.validMoves = [];
    }

    this.updateHighlights();
  }

  handleDragStart(squareKey, e) {
    if (!this.interactive || !this.chess) {
      e.preventDefault();
      return;
    }

    const piece = this.chess.get(squareKey);
    if (!piece || piece.color !== this.chess.turn()) {
      e.preventDefault();
      return;
    }

    this.selectedSquare = squareKey;
    this.validMoves = this.chess.moves({ square: squareKey, verbose: true });
    this.updateHighlights();

    e.dataTransfer.setData('text/plain', squareKey);
    e.dataTransfer.effectAllowed = 'move';
  }

  handleDragEnd() {
    // Mantém estado visual até próximo clique
  }

  handleDrop(toSquareKey, e) {
    e.preventDefault();
    if (!this.interactive || !this.selectedSquare) return;

    const fromSquareKey = e.dataTransfer.getData('text/plain') || this.selectedSquare;
    const move = this.validMoves.find(m => m.to === toSquareKey);

    if (move) {
      this.attemptMove(fromSquareKey, toSquareKey);
    }
  }

  attemptMove(from, to) {
    const piece = this.chess.get(from);
    if (!piece) return;

    // Verifica promoção de peão
    const isPawnPromo = (piece.type === 'p') &&
      ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'));

    if (isPawnPromo) {
      this.pendingPromotion = { from, to };
      this.showPromotionModal(piece.color);
      return;
    }

    this.executeMove({ from, to, promotion: 'q' });
  }

  showPromotionModal(color) {
    this.promoChoices.innerHTML = '';
    const choices = ['q', 'r', 'b', 'n'];

    choices.forEach(type => {
      const btn = document.createElement('button');
      btn.className = 'promo-piece-btn';
      btn.innerHTML = PIECE_SVGS[`${color}${type.toUpperCase()}`];
      btn.addEventListener('click', () => {
        this.promoOverlay.classList.add('hidden');
        if (this.pendingPromotion) {
          const { from, to } = this.pendingPromotion;
          this.pendingPromotion = null;
          this.executeMove({ from, to, promotion: type });
        }
      });
      this.promoChoices.appendChild(btn);
    });

    this.promoOverlay.classList.remove('hidden');
  }

  executeMove(moveObj) {
    this.selectedSquare = null;
    this.validMoves = [];
    this.updateHighlights();

    if (this.onMove) {
      this.onMove(moveObj);
    }
  }

  // Renderização de Setas SVG no tabuleiro
  renderArrows() {
    if (!this.arrowsLayer) return;
    this.arrowsLayer.innerHTML = '';

    const isFlipped = (this.orientation === 'black');

    const getCenter = (sq) => {
      const file = sq.charCodeAt(0) - 97;
      const rank = 8 - parseInt(sq[1], 10);
      const col = isFlipped ? 7 - file : file;
      const row = isFlipped ? 7 - rank : rank;
      return {
        x: col * 100 + 50,
        y: row * 100 + 50
      };
    };

    // Definição de marcadores para as setas
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    this.arrowsLayer.appendChild(defs);

    this.arrows.forEach((arr, idx) => {
      const from = getCenter(arr.from);
      const to = getCenter(arr.to);

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy);
      if (len === 0) return;

      const normX = dx / len;
      const normY = dy / len;

      // Encurta ligeiramente a ponta e a cauda para estética refinada
      const startX = from.x + normX * 18;
      const startY = from.y + normY * 18;
      const endX = to.x - normX * 22;
      const endY = to.y - normY * 22;

      const markerId = `arrowhead-${idx}`;
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      marker.setAttribute('id', markerId);
      marker.setAttribute('viewBox', '0 0 10 10');
      marker.setAttribute('refX', '7');
      marker.setAttribute('refY', '5');
      marker.setAttribute('markerWidth', '5');
      marker.setAttribute('markerHeight', '5');
      marker.setAttribute('orient', 'auto-start-reverse');

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M 0 1 L 9 5 L 0 9 z');
      path.setAttribute('fill', arr.color);
      marker.appendChild(path);
      defs.appendChild(marker);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', startX);
      line.setAttribute('y1', startY);
      line.setAttribute('x2', endX);
      line.setAttribute('y2', endY);
      line.setAttribute('stroke', arr.color);
      line.setAttribute('stroke-width', '16');
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('opacity', '0.85');
      line.setAttribute('marker-end', `url(#${markerId})`);

      this.arrowsLayer.appendChild(line);
    });
  }
}
