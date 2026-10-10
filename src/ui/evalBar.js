/**
 * Eval Bar Controller
 * Barra de avaliação vertical suave com transição CSS, suporte a pontuação em centipawns e mate forçado.
 */

export class EvalBar {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.orientation = options.orientation || 'white';
    this.currentScore = { type: 'cp', value: 0 }; // Positivo = vantagem branca
    this.initDOM();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="eval-bar-wrapper">
        <div class="eval-bar-fill eval-bar-white"></div>
        <div class="eval-bar-fill eval-bar-black"></div>
        <div class="eval-bar-score-badge">0.0</div>
      </div>
    `;

    this.wrapper = this.container.querySelector('.eval-bar-wrapper');
    this.whiteFill = this.container.querySelector('.eval-bar-white');
    this.blackFill = this.container.querySelector('.eval-bar-black');
    this.badge = this.container.querySelector('.eval-bar-score-badge');

    this.update();
  }

  setOrientation(orientation) {
    this.orientation = orientation;
    this.update();
  }

  /**
   * Atualiza a barra de avaliação.
   * @param {{ type: 'cp' | 'mate', value: number }} score - Score absoluto das Brancas
   */
  setScore(score) {
    if (!score) return;
    this.currentScore = score;
    this.update();
  }

  update() {
    let whitePercent = 50;
    let badgeText = '0.0';
    let isWhiteLeading = true;

    if (this.currentScore.type === 'mate') {
      const mateVal = this.currentScore.value;
      if (mateVal > 0) {
        whitePercent = 100;
        badgeText = `M${mateVal}`;
        isWhiteLeading = true;
      } else {
        whitePercent = 0;
        badgeText = `-M${Math.abs(mateVal)}`;
        isWhiteLeading = false;
      }
    } else {
      const cp = this.currentScore.value;
      // Normalização usando fórmula logística suave (0 a 100%)
      const prob = 1 / (1 + Math.exp(-0.00368208 * cp));
      whitePercent = Math.max(5, Math.min(95, prob * 100));

      const pawns = cp / 100;
      if (Math.abs(pawns) < 0.05) {
        badgeText = '0.0';
      } else if (pawns > 0) {
        badgeText = `+${pawns.toFixed(1)}`;
        isWhiteLeading = true;
      } else {
        badgeText = pawns.toFixed(1);
        isWhiteLeading = false;
      }
    }

    // Orientação visual
    // Se 'white', o lado branco fica na base.
    if (this.orientation === 'white') {
      this.whiteFill.style.height = `${whitePercent}%`;
      this.blackFill.style.height = `${100 - whitePercent}%`;
      this.badge.style.top = isWhiteLeading ? 'auto' : '8px';
      this.badge.style.bottom = isWhiteLeading ? '8px' : 'auto';
    } else {
      // Se 'black', o lado preto fica na base
      const blackPercent = 100 - whitePercent;
      this.blackFill.style.height = `${blackPercent}%`;
      this.whiteFill.style.height = `${whitePercent}%`;
      this.badge.style.top = !isWhiteLeading ? 'auto' : '8px';
      this.badge.style.bottom = !isWhiteLeading ? '8px' : 'auto';
    }

    this.badge.textContent = badgeText;
    this.badge.className = `eval-bar-score-badge ${isWhiteLeading ? 'badge-white' : 'badge-black'}`;
  }
}
