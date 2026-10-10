import { describe, it, expect, beforeEach } from 'vitest';
import { EvalBar } from '../../src/ui/evalBar.js';

describe('EvalBar', () => {
  let container;
  let evalBar;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    evalBar = new EvalBar(container);
  });

  it('deve inicializar com 50% para score neutro e badge "0.0"', () => {
    const badge = container.querySelector('.eval-bar-score-badge');
    const whiteFill = container.querySelector('.eval-bar-white');
    const blackFill = container.querySelector('.eval-bar-black');

    expect(badge.textContent).toBe('0.0');
    expect(whiteFill.style.height).toBe('50%');
    expect(blackFill.style.height).toBe('50%');
  });

  it('deve exibir pontuação em peões com sinal correto (+1.5, -2.0)', () => {
    const badge = container.querySelector('.eval-bar-score-badge');

    evalBar.setScore({ type: 'cp', value: 150 });
    expect(badge.textContent).toBe('+1.5');
    expect(badge.classList.contains('badge-white')).toBe(true);

    evalBar.setScore({ type: 'cp', value: -200 });
    expect(badge.textContent).toBe('-2.0');
    expect(badge.classList.contains('badge-black')).toBe(true);
  });

  it('deve lidar com mate forçado positivo (M2) e negativo (-M3)', () => {
    const badge = container.querySelector('.eval-bar-score-badge');
    const whiteFill = container.querySelector('.eval-bar-white');
    const blackFill = container.querySelector('.eval-bar-black');

    evalBar.setScore({ type: 'mate', value: 2 });
    expect(badge.textContent).toBe('M2');
    expect(whiteFill.style.height).toBe('100%');
    expect(blackFill.style.height).toBe('0%');

    evalBar.setScore({ type: 'mate', value: -3 });
    expect(badge.textContent).toBe('-M3');
    expect(whiteFill.style.height).toBe('0%');
    expect(blackFill.style.height).toBe('100%');
  });

  it('deve ajustar o preenchimento ao inverter a orientação', () => {
    evalBar.setScore({ type: 'cp', value: 300 });
    evalBar.setOrientation('black');

    expect(evalBar.orientation).toBe('black');
    const blackFill = container.querySelector('.eval-bar-black');
    expect(parseFloat(blackFill.style.height)).toBeLessThan(50);
  });
});
