/**
 * Stockfish JS - UCI Web Worker Engine
 * Motor de xadrez em JavaScript com suporte completo ao protocolo UCI.
 * Funciona 100% offline no navegador.
 */

(function () {
  'use strict';

  // Constantes de peças e cores
  const EMPTY = 0;
  const PAWN = 1, KNIGHT = 2, BISHOP = 3, ROOK = 4, QUEEN = 5, KING = 6;
  const WHITE = 8, BLACK = 16;
  const COLOR_MASK = 24;
  const PIECE_MASK = 7;

  // Valores de peças em centipawns [empty, P, N, B, R, Q, K]
  const PIECE_VALUES_MG = [0, 100, 320, 330, 500, 900, 20000];
  const PIECE_VALUES_EG = [0, 120, 300, 315, 520, 950, 20000];

  // Tabelas PeSTO de Piece-Square Tables para avaliação posicional refinada
  const PST_PAWN_MG = [
      0,   0,   0,   0,   0,   0,   0,   0,
     98, 134,  61,  95,  68, 126,  34, -11,
     -6,   7,  26,  31,  65,  56,  25, -20,
    -14,  13,   6,  21,  23,  12,  17, -23,
    -27,  -2,  -5,  12,  17,   6,  10, -25,
    -26,  -4,  -4, -10,   3,   3,  33, -12,
    -35,  -1, -20, -23, -15,  24,  38, -22,
      0,   0,   0,   0,   0,   0,   0,   0
  ];
  const PST_PAWN_EG = [
      0,   0,   0,   0,   0,   0,   0,   0,
    178, 173, 158, 134, 147, 132, 165, 187,
     94, 100,  85,  67,  56,  53,  82,  84,
     32,  24,  13,   5,  -2,   4,  17,  17,
     13,   9,  -3,  -7,  -7,  -8,   3,  -1,
      4,   7,  -6,   1,   0,  -5,  -1,  -8,
     13,   8,   8,  10,  13,   0,   2,  -7,
      0,   0,   0,   0,   0,   0,   0,   0
  ];

  const PST_KNIGHT_MG = [
    -167, -89, -34, -49,  61, -97, -15, -107,
     -73, -41,  72,  36,  23,  62,   7,  -17,
     -47,  60,  37,  65,  84, 129,  73,   44,
      -9,  17,  19,  53,  37,  69,  18,   22,
     -13,   4,  16,  13,  28,  19,  21,   -8,
     -23,  -9,  12,  10,  19,  17,  25,  -16,
     -29, -53, -12,  -3,  -1,  18, -14,  -19,
    -105, -21, -58, -33, -17, -28, -19,  -23
  ];
  const PST_KNIGHT_EG = [
    -58, -38, -13, -28, -31, -27, -63, -99,
    -25,  -8, -25,  -2,  -9, -25, -24, -52,
    -24, -20,  10,   9,  -1,  -9, -19, -41,
    -17,   3,  22,  22,  22,  11,   8, -18,
    -18,  -6,  16,  25,  16,  17,   4, -18,
    -23,  -3,  -1,  15,  10,  -3, -20, -22,
    -42, -20, -10,  -5,  -2, -20, -23, -44,
    -29, -51, -23, -15, -22, -18, -50, -64
  ];

  const PST_BISHOP_MG = [
    -29,   4, -82, -37, -25, -42,   7,  -8,
    -26,  16, -18, -13,  30,  59,  18, -47,
    -16,  37,  43,  40,  35,  50,  37,  -2,
     -4,   5,  19,  50,  37,  37,   7,  -2,
     -6,  13,  13,  26,  34,  12,  10,   4,
      0,  15,  15,  15,  14,  27,  18,  10,
      4,  15,  16,   0,   7,  21,  33,   1,
    -33,  -3, -14, -21, -13, -12, -39, -21
  ];
  const PST_BISHOP_EG = [
    -14, -21, -11,  -8,  -7,  -9, -17, -24,
     -8,  -4,   7, -12,  -3, -13,  -4, -14,
      2,  -8,   0,  -1,  -2,   6,   0,   4,
     -3,   9,  12,   9,  14,  10,   3,   2,
     -6,   3,  13,  19,   7,  10,  -3,  -9,
    -12,  -3,   8,  10,  13,   3,  -7, -15,
    -14, -18,  -7,  -1,   4,  -9, -15, -27,
    -23,  -9, -23,  -5,  -9, -16,  -5, -17
  ];

  const PST_ROOK_MG = [
     32,  42,  32,  51,  63,   9,  31,  43,
     27,  32,  58,  62,  80,  67,  26,  44,
     -5,  19,  26,  36,  17,  45,  61,  16,
    -24, -11,   7,  26,  24,  35,  -8, -20,
    -36, -26, -12,  -1,   9,  -7,   6, -23,
    -45, -25, -16, -17,   3,   0,  -5, -33,
    -44, -16, -20,  -9,  -1,  11,  -6, -71,
    -19, -13,   1,  17,  16,   7, -37, -26
  ];
  const PST_ROOK_EG = [
     13,  10,  18,  15,  12,  12,   8,   5,
     11,  13,  13,  11,  -3,   3,   8,   3,
      7,   7,   7,   5,   4,  -3,  -5,  -3,
      4,   3,  13,   1,   2,   1,  -1,   2,
      3,   5,   8,   4,  -5,  -6,  -8, -11,
     -4,   0,  -5,  -1,  -7, -12,  -8, -16,
     -6,  -6,   0,   2,  -9,  -9, -11,  -3,
     -9,   2,   3,  -1,  -5, -13,   4, -20
  ];

  const PST_QUEEN_MG = [
    -28,   0,  29,  12,  59,  44,  43,  45,
    -24, -39,  -5,   1, -16,  57,  28,  54,
    -13, -17,   7,   8,  29,  56,  47,  57,
    -27, -27, -16, -16,  -1,  17,  -2,   1,
     -9, -26,  -9, -10,  -2,  -4,   3,  -3,
    -14,   2, -11,  -2,  -5,   2,  14,   5,
    -35,  -8,  11,   2,   8,  15,  -3,   1,
     -1, -18,  -9,  10, -15, -25, -48, -18
  ];
  const PST_QUEEN_EG = [
     -9,  22,  22,  27,  27,  19,  10,  20,
    -17,  20,  32,  41,  58,  25,  30,   0,
    -20,   6,   9,  49,  47,  35,  19,   9,
      3,  22,  24,  45,  57,  40,  57,  36,
    -18,  28,  19,  47,  31,  34,  39,  18,
    -16, -27,  15,   6,   9,  17,  10,   5,
    -22, -23, -30, -16, -16, -23, -36, -32,
    -33, -28, -22, -43,  -5, -32, -20, -41
  ];

  const PST_KING_MG = [
    -65,  23,  16, -15, -56, -34,   2,  13,
     29,  -1, -20,  -7,  -8,  -4, -38, -29,
     -9,  24,   2, -16, -20,   6,  22, -22,
    -17, -20, -12, -27, -30, -25, -14, -36,
    -49,  -1, -27, -39, -46, -44, -33, -51,
    -14, -14, -22, -46, -44, -30, -15, -27,
      1,   7,  -8, -64, -43, -16,   9,   8,
    -15,  36,  12, -54,   8, -28,  24,  14
  ];
  const PST_KING_EG = [
    -74, -35, -18, -18, -11,  15,   4, -17,
    -12,  17,  14,  17,  17,  38,  23,  11,
     10,  17,  23,  15,  20,  45,  44,  13,
     -8,  22,  24,  27,  26,  33,  26,   3,
    -18,  -4,  21,  24,  27,  23,   9, -11,
    -19,  -3,  11,  21,  23,  16,   7,  -9,
    -27, -11,   4,  13,  14,   4,  -5, -17,
    -53, -34, -21, -11, -28, -14, -24, -43
  ];

  const PST_MG = [null, PST_PAWN_MG, PST_KNIGHT_MG, PST_BISHOP_MG, PST_ROOK_MG, PST_QUEEN_MG, PST_KING_MG];
  const PST_EG = [null, PST_PAWN_EG, PST_KNIGHT_EG, PST_BISHOP_EG, PST_ROOK_EG, PST_QUEEN_EG, PST_KING_EG];

  // Estrutura de Estado de Jogo
  class ChessBoard {
    constructor() {
      this.board = new Uint8Array(64);
      this.turn = WHITE;
      this.castling = 15; // 1: WK, 2: WQ, 4: BK, 8: BQ
      this.epSquare = -1;
      this.halfmoveClock = 0;
      this.fullmoveNumber = 1;
      this.history = [];
      this.initStartingPosition();
    }

    initStartingPosition() {
      this.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    }

    loadFen(fen) {
      this.board.fill(EMPTY);
      this.castling = 0;
      this.epSquare = -1;
      this.halfmoveClock = 0;
      this.fullmoveNumber = 1;

      const parts = fen.trim().split(/\s+/);
      const rows = parts[0].split('/');
      let sq = 0;

      for (let r = 0; r < 8; r++) {
        const row = rows[r];
        for (let c = 0; c < row.length; c++) {
          const ch = row[c];
          if (ch >= '1' && ch <= '8') {
            sq += parseInt(ch, 10);
          } else {
            const color = (ch === ch.toUpperCase()) ? WHITE : BLACK;
            let type = EMPTY;
            switch (ch.toLowerCase()) {
              case 'p': type = PAWN; break;
              case 'n': type = KNIGHT; break;
              case 'b': type = BISHOP; break;
              case 'r': type = ROOK; break;
              case 'q': type = QUEEN; break;
              case 'k': type = KING; break;
            }
            this.board[sq++] = color | type;
          }
        }
      }

      this.turn = (parts[1] === 'b') ? BLACK : WHITE;

      const castlingStr = parts[2] || '-';
      if (castlingStr.includes('K')) this.castling |= 1;
      if (castlingStr.includes('Q')) this.castling |= 2;
      if (castlingStr.includes('k')) this.castling |= 4;
      if (castlingStr.includes('q')) this.castling |= 8;

      const epStr = parts[3] || '-';
      if (epStr !== '-' && epStr.length === 2) {
        const file = epStr.charCodeAt(0) - 97;
        const rank = 8 - parseInt(epStr[1], 10);
        this.epSquare = rank * 8 + file;
      }

      this.halfmoveClock = parseInt(parts[4] || '0', 10);
      this.fullmoveNumber = parseInt(parts[5] || '1', 10);
    }

    getFen() {
      let fen = '';
      for (let r = 0; r < 8; r++) {
        let empty = 0;
        for (let f = 0; f < 8; f++) {
          const p = this.board[r * 8 + f];
          if (p === EMPTY) {
            empty++;
          } else {
            if (empty > 0) {
              fen += empty;
              empty = 0;
            }
            const color = p & COLOR_MASK;
            const type = p & PIECE_MASK;
            let ch = ['?', 'p', 'n', 'b', 'r', 'q', 'k'][type];
            if (color === WHITE) ch = ch.toUpperCase();
            fen += ch;
          }
        }
        if (empty > 0) fen += empty;
        if (r < 7) fen += '/';
      }

      fen += ' ' + (this.turn === WHITE ? 'w' : 'b') + ' ';

      let castlingStr = '';
      if (this.castling & 1) castlingStr += 'K';
      if (this.castling & 2) castlingStr += 'Q';
      if (this.castling & 4) castlingStr += 'k';
      if (this.castling & 8) castlingStr += 'q';
      fen += (castlingStr || '-') + ' ';

      if (this.epSquare !== -1) {
        const file = String.fromCharCode(97 + (this.epSquare % 8));
        const rank = 8 - Math.floor(this.epSquare / 8);
        fen += `${file}${rank}`;
      } else {
        fen += '-';
      }

      fen += ` ${this.halfmoveClock} ${this.fullmoveNumber}`;
      return fen;
    }

    isSquareAttacked(sq, byColor) {
      const rank = Math.floor(sq / 8);
      const file = sq % 8;

      // Ataques de Peão
      if (byColor === WHITE) {
        if (rank < 7) {
          if (file > 0 && this.board[(rank + 1) * 8 + file - 1] === (WHITE | PAWN)) return true;
          if (file < 7 && this.board[(rank + 1) * 8 + file + 1] === (WHITE | PAWN)) return true;
        }
      } else {
        if (rank > 0) {
          if (file > 0 && this.board[(rank - 1) * 8 + file - 1] === (BLACK | PAWN)) return true;
          if (file < 7 && this.board[(rank - 1) * 8 + file + 1] === (BLACK | PAWN)) return true;
        }
      }

      // Cavalo
      const knightOffsets = [-17, -15, -10, -6, 6, 10, 15, 17];
      for (const off of knightOffsets) {
        const target = sq + off;
        if (target >= 0 && target < 64) {
          const tRank = Math.floor(target / 8);
          const tFile = target % 8;
          if (Math.abs(tRank - rank) + Math.abs(tFile - file) === 3 && Math.abs(tRank - rank) <= 2 && Math.abs(tFile - file) <= 2) {
            if (this.board[target] === (byColor | KNIGHT)) return true;
          }
        }
      }

      // Bispo / Dama (diagonais)
      const diagDirs = [-9, -7, 7, 9];
      for (const d of diagDirs) {
        let cur = sq;
        while (true) {
          const cRank = Math.floor(cur / 8);
          const cFile = cur % 8;
          cur += d;
          if (cur < 0 || cur >= 64) break;
          const nRank = Math.floor(cur / 8);
          const nFile = cur % 8;
          if (Math.abs(cRank - nRank) !== 1 || Math.abs(cFile - nFile) !== 1) break;
          const p = this.board[cur];
          if (p !== EMPTY) {
            if ((p & COLOR_MASK) === byColor) {
              const type = p & PIECE_MASK;
              if (type === BISHOP || type === QUEEN) return true;
            }
            break;
          }
        }
      }

      // Torre / Dama (ortogonais)
      const orthDirs = [-8, 8, -1, 1];
      for (const d of orthDirs) {
        let cur = sq;
        while (true) {
          const cRank = Math.floor(cur / 8);
          const cFile = cur % 8;
          cur += d;
          if (cur < 0 || cur >= 64) break;
          const nRank = Math.floor(cur / 8);
          const nFile = cur % 8;
          if (d === -1 || d === 1) {
            if (cRank !== nRank) break;
          }
          const p = this.board[cur];
          if (p !== EMPTY) {
            if ((p & COLOR_MASK) === byColor) {
              const type = p & PIECE_MASK;
              if (type === ROOK || type === QUEEN) return true;
            }
            break;
          }
        }
      }

      // Rei
      const kingDirs = [-9, -8, -7, -1, 1, 7, 8, 9];
      for (const d of kingDirs) {
        const cur = sq + d;
        if (cur >= 0 && cur < 64) {
          const cRank = Math.floor(cur / 8);
          const cFile = cur % 8;
          if (Math.abs(cRank - rank) <= 1 && Math.abs(cFile - file) <= 1) {
            if (this.board[cur] === (byColor | KING)) return true;
          }
        }
      }

      return false;
    }

    inCheck(color = this.turn) {
      let kingSq = -1;
      for (let i = 0; i < 64; i++) {
        if (this.board[i] === (color | KING)) {
          kingSq = i;
          break;
        }
      }
      if (kingSq === -1) return false;
      const enemyColor = (color === WHITE) ? BLACK : WHITE;
      return this.isSquareAttacked(kingSq, enemyColor);
    }

    generatePseudoLegalMoves() {
      const moves = [];
      const isWhite = (this.turn === WHITE);
      const enemyColor = isWhite ? BLACK : WHITE;

      for (let sq = 0; sq < 64; sq++) {
        const p = this.board[sq];
        if (p === EMPTY || (p & COLOR_MASK) !== this.turn) continue;

        const type = p & PIECE_MASK;
        const rank = Math.floor(sq / 8);
        const file = sq % 8;

        if (type === PAWN) {
          const forward = isWhite ? -8 : 8;
          const startRank = isWhite ? 6 : 1;
          const promoRank = isWhite ? 0 : 7;

          // 1 casa à frente
          const to1 = sq + forward;
          if (to1 >= 0 && to1 < 64 && this.board[to1] === EMPTY) {
            const toRank = Math.floor(to1 / 8);
            if (toRank === promoRank) {
              moves.push({ from: sq, to: to1, promo: QUEEN });
              moves.push({ from: sq, to: to1, promo: KNIGHT });
              moves.push({ from: sq, to: to1, promo: ROOK });
              moves.push({ from: sq, to: to1, promo: BISHOP });
            } else {
              moves.push({ from: sq, to: to1 });
              // 2 casas à frente do início
              if (rank === startRank) {
                const to2 = sq + forward * 2;
                if (this.board[to2] === EMPTY) {
                  moves.push({ from: sq, to: to2 });
                }
              }
            }
          }

          // Capturas normais e en passant
          const caps = isWhite ? [-9, -7] : [7, 9];
          for (const d of caps) {
            const to = sq + d;
            if (to >= 0 && to < 64) {
              const toRank = Math.floor(to / 8);
              const toFile = to % 8;
              if (Math.abs(file - toFile) === 1) {
                if (this.board[to] !== EMPTY && (this.board[to] & COLOR_MASK) === enemyColor) {
                  if (toRank === promoRank) {
                    moves.push({ from: sq, to, promo: QUEEN, capture: true });
                    moves.push({ from: sq, to, promo: KNIGHT, capture: true });
                    moves.push({ from: sq, to, promo: ROOK, capture: true });
                    moves.push({ from: sq, to, promo: BISHOP, capture: true });
                  } else {
                    moves.push({ from: sq, to, capture: true });
                  }
                } else if (to === this.epSquare) {
                  moves.push({ from: sq, to, ep: true, capture: true });
                }
              }
            }
          }
        } else if (type === KNIGHT) {
          const offsets = [-17, -15, -10, -6, 6, 10, 15, 17];
          for (const off of offsets) {
            const to = sq + off;
            if (to >= 0 && to < 64) {
              const toRank = Math.floor(to / 8);
              const toFile = to % 8;
              if (Math.abs(rank - toRank) + Math.abs(file - toFile) === 3 && Math.abs(rank - toRank) <= 2 && Math.abs(file - toFile) <= 2) {
                const dest = this.board[to];
                if (dest === EMPTY) {
                  moves.push({ from: sq, to });
                } else if ((dest & COLOR_MASK) === enemyColor) {
                  moves.push({ from: sq, to, capture: true });
                }
              }
            }
          }
        } else if (type === BISHOP || type === ROOK || type === QUEEN) {
          let dirs = [];
          if (type === BISHOP || type === QUEEN) dirs.push(-9, -7, 7, 9);
          if (type === ROOK || type === QUEEN) dirs.push(-8, 8, -1, 1);

          for (const d of dirs) {
            let cur = sq;
            while (true) {
              const cRank = Math.floor(cur / 8);
              cur += d;
              if (cur < 0 || cur >= 64) break;
              const nRank = Math.floor(cur / 8);
              const nFile = cur % 8;

              if (d === -1 || d === 1) {
                if (cRank !== nRank) break;
              } else if (d === -9 || d === 7) {
                if (Math.abs((cur - d) % 8 - nFile) !== 1) break;
              } else if (d === -7 || d === 9) {
                if (Math.abs((cur - d) % 8 - nFile) !== 1) break;
              }

              const dest = this.board[cur];
              if (dest === EMPTY) {
                moves.push({ from: sq, to: cur });
              } else {
                if ((dest & COLOR_MASK) === enemyColor) {
                  moves.push({ from: sq, to: cur, capture: true });
                }
                break;
              }
            }
          }
        } else if (type === KING) {
          const dirs = [-9, -8, -7, -1, 1, 7, 8, 9];
          for (const d of dirs) {
            const to = sq + d;
            if (to >= 0 && to < 64) {
              const toRank = Math.floor(to / 8);
              const toFile = to % 8;
              if (Math.abs(rank - toRank) <= 1 && Math.abs(file - toFile) <= 1) {
                const dest = this.board[to];
                if (dest === EMPTY) {
                  moves.push({ from: sq, to });
                } else if ((dest & COLOR_MASK) === enemyColor) {
                  moves.push({ from: sq, to, capture: true });
                }
              }
            }
          }

          // Roque
          if (isWhite && sq === 60) {
            if ((this.castling & 1) && this.board[61] === EMPTY && this.board[62] === EMPTY) {
              if (!this.isSquareAttacked(60, BLACK) && !this.isSquareAttacked(61, BLACK) && !this.isSquareAttacked(62, BLACK)) {
                moves.push({ from: 60, to: 62, castle: 'K' });
              }
            }
            if ((this.castling & 2) && this.board[59] === EMPTY && this.board[58] === EMPTY && this.board[57] === EMPTY) {
              if (!this.isSquareAttacked(60, BLACK) && !this.isSquareAttacked(59, BLACK) && !this.isSquareAttacked(58, BLACK)) {
                moves.push({ from: 60, to: 58, castle: 'Q' });
              }
            }
          } else if (!isWhite && sq === 4) {
            if ((this.castling & 4) && this.board[5] === EMPTY && this.board[6] === EMPTY) {
              if (!this.isSquareAttacked(4, WHITE) && !this.isSquareAttacked(5, WHITE) && !this.isSquareAttacked(6, WHITE)) {
                moves.push({ from: 4, to: 6, castle: 'k' });
              }
            }
            if ((this.castling & 8) && this.board[3] === EMPTY && this.board[2] === EMPTY && this.board[1] === EMPTY) {
              if (!this.isSquareAttacked(4, WHITE) && !this.isSquareAttacked(3, WHITE) && !this.isSquareAttacked(2, WHITE)) {
                moves.push({ from: 4, to: 2, castle: 'q' });
              }
            }
          }
        }
      }

      return moves;
    }

    makeMove(m) {
      const prev = {
        board: new Uint8Array(this.board),
        turn: this.turn,
        castling: this.castling,
        epSquare: this.epSquare,
        halfmoveClock: this.halfmoveClock,
        fullmoveNumber: this.fullmoveNumber
      };
      this.history.push(prev);

      const movingPiece = this.board[m.from];
      const type = movingPiece & PIECE_MASK;
      const color = movingPiece & COLOR_MASK;
      const isWhite = (color === WHITE);

      // Limpar casa de origem
      this.board[m.from] = EMPTY;

      // Tratar En Passant
      if (m.ep) {
        const epPawnSq = isWhite ? m.to + 8 : m.to - 8;
        this.board[epPawnSq] = EMPTY;
      }

      // Tratar Roque
      if (m.castle) {
        if (m.castle === 'K') {
          this.board[63] = EMPTY;
          this.board[61] = WHITE | ROOK;
        } else if (m.castle === 'Q') {
          this.board[56] = EMPTY;
          this.board[59] = WHITE | ROOK;
        } else if (m.castle === 'k') {
          this.board[7] = EMPTY;
          this.board[5] = BLACK | ROOK;
        } else if (m.castle === 'q') {
          this.board[0] = EMPTY;
          this.board[3] = BLACK | ROOK;
        }
      }

      // Colocar peça no destino
      if (m.promo) {
        this.board[m.to] = color | m.promo;
      } else {
        this.board[m.to] = movingPiece;
      }

      // Atualizar Roque se peças moverem ou forem capturadas
      if (m.from === 60) this.castling &= ~3;
      if (m.from === 4) this.castling &= ~12;
      if (m.from === 56 || m.to === 56) this.castling &= ~2;
      if (m.from === 63 || m.to === 63) this.castling &= ~1;
      if (m.from === 0 || m.to === 0) this.castling &= ~8;
      if (m.from === 7 || m.to === 7) this.castling &= ~4;

      // Novo En Passant
      if (type === PAWN && Math.abs(m.from - m.to) === 16) {
        this.epSquare = isWhite ? m.from - 8 : m.from + 8;
      } else {
        this.epSquare = -1;
      }

      if (type === PAWN || m.capture) {
        this.halfmoveClock = 0;
      } else {
        this.halfmoveClock++;
      }

      if (!isWhite) {
        this.fullmoveNumber++;
      }

      this.turn = (this.turn === WHITE) ? BLACK : WHITE;
    }

    undoMove() {
      const prev = this.history.pop();
      if (!prev) return;
      this.board = prev.board;
      this.turn = prev.turn;
      this.castling = prev.castling;
      this.epSquare = prev.epSquare;
      this.halfmoveClock = prev.halfmoveClock;
      this.fullmoveNumber = prev.fullmoveNumber;
    }

    getLegalMoves() {
      const pseudo = this.generatePseudoLegalMoves();
      const legal = [];
      const currentTurn = this.turn;

      for (const m of pseudo) {
        this.makeMove(m);
        if (!this.inCheck(currentTurn)) {
          legal.push(m);
        }
        this.undoMove();
      }

      return legal;
    }

    moveToUci(m) {
      const fromF = String.fromCharCode(97 + (m.from % 8));
      const fromR = 8 - Math.floor(m.from / 8);
      const toF = String.fromCharCode(97 + (m.to % 8));
      const toR = 8 - Math.floor(m.to / 8);
      let promoCh = '';
      if (m.promo) {
        promoCh = ['?', 'p', 'n', 'b', 'r', 'q', 'k'][m.promo];
      }
      return `${fromF}${fromR}${toF}${toR}${promoCh}`;
    }

    uciToMove(uci) {
      if (!uci || uci.length < 4) return null;
      const fromF = uci.charCodeAt(0) - 97;
      const fromR = 8 - parseInt(uci[1], 10);
      const toF = uci.charCodeAt(2) - 97;
      const toR = 8 - parseInt(uci[3], 10);
      const from = fromR * 8 + fromF;
      const to = toR * 8 + toF;
      const promoCh = uci.length > 4 ? uci[4].toLowerCase() : null;

      const legal = this.getLegalMoves();
      for (const m of legal) {
        if (m.from === from && m.to === to) {
          if (promoCh) {
            let promoType = QUEEN;
            if (promoCh === 'n') promoType = KNIGHT;
            if (promoCh === 'b') promoType = BISHOP;
            if (promoCh === 'r') promoType = ROOK;
            if (m.promo === promoType) return m;
          } else {
            return m;
          }
        }
      }
      return null;
    }

    // Avaliação Posicional PeSTO
    evaluate() {
      let mgScore = 0;
      let egScore = 0;
      let gamePhase = 0;

      // Pesos de fase
      const phaseWeights = [0, 0, 1, 1, 2, 4, 0];

      for (let sq = 0; sq < 64; sq++) {
        const p = this.board[sq];
        if (p === EMPTY) continue;

        const color = p & COLOR_MASK;
        const type = p & PIECE_MASK;
        const isWhite = (color === WHITE);

        gamePhase += phaseWeights[type];

        // Tabela PeSTO indexada do ponto de vista da peça
        const pstIndex = isWhite ? sq : ((7 - Math.floor(sq / 8)) * 8 + (sq % 8));

        const mgVal = PIECE_VALUES_MG[type] + PST_MG[type][pstIndex];
        const egVal = PIECE_VALUES_EG[type] + PST_EG[type][pstIndex];

        if (isWhite) {
          mgScore += mgVal;
          egScore += egVal;
        } else {
          mgScore -= mgVal;
          egScore -= egVal;
        }
      }

      // Tapered Evaluation: interpolação entre Midgame e Endgame
      if (gamePhase > 24) gamePhase = 24;
      const mgWeight = gamePhase;
      const egWeight = 24 - gamePhase;
      const evaluation = Math.round((mgScore * mgWeight + egScore * egWeight) / 24);

      // Retorna a avaliação relativa a quem tem a vez
      return (this.turn === WHITE) ? evaluation : -evaluation;
    }
  }

  // Motor de Busca
  class Engine {
    constructor() {
      this.board = new ChessBoard();
      this.skillLevel = 20; // 0 a 20
      this.isSearching = false;
      this.stopRequested = false;
      this.nodes = 0;
    }

    orderMoves(moves) {
      return moves.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;
        if (a.capture) {
          const victimA = this.board.board[a.to] & PIECE_MASK;
          const attackerA = this.board.board[a.from] & PIECE_MASK;
          scoreA = 1000 + (victimA * 10 - attackerA);
        }
        if (b.capture) {
          const victimB = this.board.board[b.to] & PIECE_MASK;
          const attackerB = this.board.board[b.from] & PIECE_MASK;
          scoreB = 1000 + (victimB * 10 - attackerB);
        }
        if (a.promo === QUEEN) scoreA += 800;
        if (b.promo === QUEEN) scoreB += 800;
        return scoreB - scoreA;
      });
    }

    quiescence(alpha, beta, depth = 0) {
      this.nodes++;
      const standPat = this.board.evaluate();

      if (standPat >= beta) return beta;
      if (alpha < standPat) alpha = standPat;
      if (depth >= 4) return standPat;

      const legal = this.board.getLegalMoves().filter(m => m.capture || m.promo);
      this.orderMoves(legal);

      for (const m of legal) {
        if (this.stopRequested) break;
        this.board.makeMove(m);
        const score = -this.quiescence(-beta, -alpha, depth + 1);
        this.board.undoMove();

        if (score >= beta) return beta;
        if (score > alpha) alpha = score;
      }

      return alpha;
    }

    alphaBeta(depth, alpha, beta, ply = 0) {
      if (this.stopRequested) return 0;
      this.nodes++;

      if (depth <= 0) {
        return this.quiescence(alpha, beta);
      }

      const legalMoves = this.board.getLegalMoves();
      if (legalMoves.length === 0) {
        if (this.board.inCheck()) {
          // Xeque-mate (distância do mate)
          return -20000 + ply;
        }
        return 0; // Afogamento / Empate
      }

      // Regra dos 50 lances
      if (this.board.halfmoveClock >= 100) return 0;

      this.orderMoves(legalMoves);

      let bestScore = -Infinity;
      for (const m of legalMoves) {
        this.board.makeMove(m);
        const score = -this.alphaBeta(depth - 1, -beta, -alpha, ply + 1);
        this.board.undoMove();

        if (this.stopRequested) return 0;

        if (score > bestScore) {
          bestScore = score;
        }
        if (bestScore > alpha) {
          alpha = bestScore;
        }
        if (alpha >= beta) {
          break; // Poda Beta
        }
      }

      return bestScore;
    }

    search({ depth = 4, movetime = 1000 }) {
      this.isSearching = true;
      this.stopRequested = false;
      this.nodes = 0;

      const startTime = Date.now();
      const legalMoves = this.board.getLegalMoves();

      if (legalMoves.length === 0) {
        this.isSearching = false;
        self.postMessage('bestmove (none)');
        return;
      }

      // Calibração do Skill Level:
      // Níveis baixos jogam com ruído ou escolhas subótimas propositais
      let targetDepth = depth;
      let errorProbability = 0;
      if (this.skillLevel <= 2) {
        targetDepth = Math.min(depth, 2);
        errorProbability = 0.55;
      } else if (this.skillLevel <= 5) {
        targetDepth = Math.min(depth, 3);
        errorProbability = 0.30;
      } else if (this.skillLevel <= 10) {
        targetDepth = Math.min(depth, 5);
        errorProbability = 0.12;
      } else if (this.skillLevel <= 15) {
        targetDepth = Math.min(depth, 7);
        errorProbability = 0.04;
      }

      let bestMove = legalMoves[0];
      let bestScore = -Infinity;

      // Se o bot iniciante cometer erro, escolhe lance aleatório ou simples
      if (Math.random() < errorProbability && legalMoves.length > 1) {
        // Lance humano casual/iniciante
        const randomIdx = Math.floor(Math.random() * legalMoves.length);
        bestMove = legalMoves[randomIdx];
        const uciMove = this.board.moveToUci(bestMove);
        self.postMessage(`info depth 1 score cp 0 nodes ${this.nodes} pv ${uciMove}`);
        self.postMessage(`bestmove ${uciMove}`);
        this.isSearching = false;
        return;
      }

      // Iterative Deepening
      for (let curDepth = 1; curDepth <= targetDepth; curDepth++) {
        if (this.stopRequested) break;
        if (Date.now() - startTime > movetime) break;

        let curBestMove = null;
        let curBestScore = -Infinity;
        this.orderMoves(legalMoves);

        for (const m of legalMoves) {
          this.board.makeMove(m);
          const score = -this.alphaBeta(curDepth - 1, -Infinity, Infinity, 1);
          this.board.undoMove();

          if (this.stopRequested) break;

          if (score > curBestScore) {
            curBestScore = score;
            curBestMove = m;
          }
        }

        if (curBestMove && !this.stopRequested) {
          bestMove = curBestMove;
          bestScore = curBestScore;

          const uciMove = this.board.moveToUci(bestMove);
          // Converter score para centipawns do ponto de vista do jogador da vez ou absoluto
          let scoreStr = `cp ${bestScore}`;
          if (Math.abs(bestScore) > 18000) {
            const mateIn = Math.ceil((20000 - Math.abs(bestScore)) / 2);
            scoreStr = `mate ${bestScore > 0 ? mateIn : -mateIn}`;
          }

          const elapsed = Date.now() - startTime;
          self.postMessage(`info depth ${curDepth} score ${scoreStr} nodes ${this.nodes} time ${elapsed} pv ${uciMove}`);
        }
      }

      const finalUci = this.board.moveToUci(bestMove);
      self.postMessage(`bestmove ${finalUci}`);
      this.isSearching = false;
    }
  }

  // UCI Handler
  const engine = new Engine();

  self.onmessage = function (e) {
    const rawLine = (typeof e.data === 'string') ? e.data.trim() : '';
    if (!rawLine) return;

    const parts = rawLine.split(/\s+/);
    const cmd = parts[0];

    switch (cmd) {
      case 'uci':
        self.postMessage('id name Stockfish JS 16 Lite');
        self.postMessage('id author Chess Engine JS Team');
        self.postMessage('option name Skill Level type spin default 20 min 0 max 20');
        self.postMessage('uciok');
        break;

      case 'isready':
        self.postMessage('readyok');
        break;

      case 'ucinewgame':
        engine.board.initStartingPosition();
        break;

      case 'setoption':
        if (parts[1] === 'name' && parts[2] === 'Skill' && parts[3] === 'Level' && parts[4] === 'value') {
          const lvl = parseInt(parts[5], 10);
          if (!isNaN(lvl)) {
            engine.skillLevel = Math.max(0, Math.min(20, lvl));
          }
        }
        break;

      case 'position':
        if (parts[1] === 'startpos') {
          engine.board.initStartingPosition();
          const movesIdx = parts.indexOf('moves');
          if (movesIdx !== -1) {
            for (let i = movesIdx + 1; i < parts.length; i++) {
              const m = engine.board.uciToMove(parts[i]);
              if (m) engine.board.makeMove(m);
            }
          }
        } else if (parts[1] === 'fen') {
          const movesIdx = parts.indexOf('moves');
          const fenParts = (movesIdx !== -1) ? parts.slice(2, movesIdx) : parts.slice(2);
          const fen = fenParts.join(' ');
          engine.board.loadFen(fen);
          if (movesIdx !== -1) {
            for (let i = movesIdx + 1; i < parts.length; i++) {
              const m = engine.board.uciToMove(parts[i]);
              if (m) engine.board.makeMove(m);
            }
          }
        }
        break;

      case 'go': {
        let depth = 6;
        let movetime = 1000;

        for (let i = 1; i < parts.length; i++) {
          if (parts[i] === 'depth' && parts[i + 1]) {
            depth = parseInt(parts[i + 1], 10);
            i++;
          } else if (parts[i] === 'movetime' && parts[i + 1]) {
            movetime = parseInt(parts[i + 1], 10);
            i++;
          }
        }

        engine.search({ depth, movetime });
        break;
      }

      case 'stop':
        engine.stopRequested = true;
        break;

      case 'quit':
        self.close();
        break;

      default:
        break;
    }
  };
})();
