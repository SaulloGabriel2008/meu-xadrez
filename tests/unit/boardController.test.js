import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Chess } from 'chess.js';
import { BoardController } from '../../src/game/boardController.js';

describe('BoardController', () => {
  let container;
  let chess;
  let board;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    chess = new Chess();
  });

  it('deve inicializar a estrutura do tabuleiro com 64 casas', () => {
    board = new BoardController(container, { chess });
    const squares = container.querySelectorAll('.board-square');
    expect(squares).toHaveLength(64);

    const lightSquares = container.querySelectorAll('.light-square');
    const darkSquares = container.querySelectorAll('.dark-square');
    expect(lightSquares).toHaveLength(32);
    expect(darkSquares).toHaveLength(32);
  });

  it('deve posicionar peças iniciais do xadrez nas 64 casas', () => {
    board = new BoardController(container, { chess });
    const pieces = container.querySelectorAll('.chess-piece');
    expect(pieces).toHaveLength(32);

    const e2Piece = container.querySelector('[data-square="e2"] .chess-piece');
    expect(e2Piece).not.toBeNull();
    expect(e2Piece.classList.contains('piece-white')).toBe(true);

    const e7Piece = container.querySelector('[data-square="e7"] .chess-piece');
    expect(e7Piece).not.toBeNull();
    expect(e7Piece.classList.contains('piece-black')).toBe(true);
  });

  it('deve inverter a orientação com flip() e setOrientation()', () => {
    board = new BoardController(container, { chess, orientation: 'white' });
    expect(board.orientation).toBe('white');

    const firstSquareWhite = container.querySelector('.board-square').dataset.square;
    expect(firstSquareWhite).toBe('a8'); // Top-left no ponto de vista das brancas

    board.flip();
    expect(board.orientation).toBe('black');

    const firstSquareBlack = container.querySelector('.board-square').dataset.square;
    expect(firstSquareBlack).toBe('h1'); // Top-left no ponto de vista das pretas

    board.setOrientation('white');
    expect(board.orientation).toBe('white');
    expect(container.querySelector('.board-square').dataset.square).toBe('a8');
  });

  it('deve destacar peças selecionadas e casas de movimento válido no clique', () => {
    board = new BoardController(container, { chess });

    // Clica no peão e2
    const e2Square = container.querySelector('[data-square="e2"]');
    e2Square.click();

    expect(e2Square.classList.contains('square-selected')).toBe(true);
    expect(board.selectedSquare).toBe('e2');
    expect(board.validMoves.length).toBeGreaterThan(0);

    // Casas e3 e e4 devem receber destaque de destino
    const e3Square = container.querySelector('[data-square="e3"]');
    const e4Square = container.querySelector('[data-square="e4"]');
    expect(e3Square.classList.contains('square-move-dest')).toBe(true);
    expect(e4Square.classList.contains('square-move-dest')).toBe(true);

    // Clicar novamente na mesma casa cancela seleção
    e2Square.click();
    expect(e2Square.classList.contains('square-selected')).toBe(false);
    expect(board.selectedSquare).toBeNull();
  });

  it('deve disparar onMove quando o jogador clica em um destino válido', () => {
    const onMoveSpy = vi.fn();
    board = new BoardController(container, { chess, onMove: onMoveSpy });

    // Seleciona e2
    container.querySelector('[data-square="e2"]').click();
    // Destino e4
    container.querySelector('[data-square="e4"]').click();

    expect(onMoveSpy).toHaveBeenCalledWith({
      from: 'e2',
      to: 'e4',
      promotion: 'q'
    });
  });

  it('não deve permitir selecionar peças do adversário quando não for a vez', () => {
    board = new BoardController(container, { chess });

    // Vez das brancas; tenta clicar em e7 (peão preto)
    const e7Square = container.querySelector('[data-square="e7"]');
    e7Square.click();

    expect(board.selectedSquare).toBeNull();
    expect(e7Square.classList.contains('square-selected')).toBe(false);
  });

  it('deve exibir modal de promoção para peões que atingem a 8ª/1ª fileira', () => {
    const onMoveSpy = vi.fn();
    // Posição com peão branco em e7 prestes a coroar em e8 (rei preto em a8)
    chess.load('k7/4P3/8/8/8/8/8/4K3 w - - 0 1');
    board = new BoardController(container, { chess, onMove: onMoveSpy });

    // Seleciona peão e7
    container.querySelector('[data-square="e7"]').click();
    // Destino e8
    container.querySelector('[data-square="e8"]').click();

    // Modal de promoção deve estar visível
    const overlay = container.querySelector('.promotion-modal-overlay');
    expect(overlay.classList.contains('hidden')).toBe(false);

    // Escolhe cavalo ('n') no modal de opções
    const promoButtons = container.querySelectorAll('.promo-piece-btn');
    expect(promoButtons).toHaveLength(4);

    // O último botão é o cavalo (índice 3: ['q', 'r', 'b', 'n'])
    promoButtons[3].click();

    expect(overlay.classList.contains('hidden')).toBe(true);
    expect(onMoveSpy).toHaveBeenCalledWith({
      from: 'e7',
      to: 'e8',
      promotion: 'n'
    });
  });

  it('deve aplicar destaques de último lance e xeque corretamente', () => {
    board = new BoardController(container, { chess });

    board.setLastMove('g1', 'f3');
    const g1Square = container.querySelector('[data-square="g1"]');
    const f3Square = container.querySelector('[data-square="f3"]');
    expect(g1Square.classList.contains('square-last-move')).toBe(true);
    expect(f3Square.classList.contains('square-last-move')).toBe(true);

    board.setCheckSquare('e8');
    const e8Square = container.querySelector('[data-square="e8"]');
    expect(e8Square.classList.contains('square-in-check')).toBe(true);

    board.setCheckSquare(null);
    expect(e8Square.classList.contains('square-in-check')).toBe(false);
  });

  it('deve renderizar e limpar setas SVG dinamicamente', () => {
    board = new BoardController(container, { chess });

    board.addArrow('e2', 'e4', '#81b64c');
    let lines = container.querySelectorAll('.board-arrows-layer line');
    expect(lines).toHaveLength(1);
    expect(lines[0].getAttribute('stroke')).toBe('#81b64c');

    board.addArrow('g1', 'f3', '#1ba7a6');
    lines = container.querySelectorAll('.board-arrows-layer line');
    expect(lines).toHaveLength(2);

    board.clearArrows();
    lines = container.querySelectorAll('.board-arrows-layer line');
    expect(lines).toHaveLength(0);
  });

  it('deve desativar interação quando interactive for false', () => {
    board = new BoardController(container, { chess, interactive: false });

    const e2Square = container.querySelector('[data-square="e2"]');
    e2Square.click();

    expect(board.selectedSquare).toBeNull();
    expect(e2Square.classList.contains('square-selected')).toBe(false);
  });
});
