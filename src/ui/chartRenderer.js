/**
 * Chart Renderer com Chart.js
 * Gráfico interativo da curva de vantagem da partida com navegação sincronizada por clique.
 */

import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export class ChartRenderer {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.onPointClick = options.onPointClick || (() => {});
    this.chart = null;
  }

  /**
   * Renderiza os dados da partida
   * @param {Array<{ index: number, san: string, color: 'w'|'b', evalAfter: { type: 'cp'|'mate', value: number } }>} moves
   */
  render(moves = []) {
    if (this.chart) {
      this.chart.destroy();
    }

    const labels = ['Início', ...moves.map((m, idx) => {
      const moveNum = Math.floor(idx / 2) + 1;
      return m.color === 'w' ? `${moveNum}. ${m.san}` : `${moveNum}... ${m.san}`;
    })];

    // Converte centipawns para peões com corte em [-10, +10] para clareza visual
    const dataPoints = [0, ...moves.map(m => {
      if (m.evalAfter.type === 'mate') {
        return m.evalAfter.value > 0 ? 10 : -10;
      }
      const pawns = m.evalAfter.value / 100;
      return Math.max(-10, Math.min(10, pawns));
    })];

    const ctx = this.canvas.getContext('2d');

    // Gradiente sutil
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height || 180);
    gradient.addColorStop(0, 'rgba(129, 182, 76, 0.45)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
    gradient.addColorStop(1, 'rgba(38, 37, 34, 0.7)');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Vantagem (Brancas + / Pretas -)',
            data: dataPoints,
            borderColor: '#81b64c',
            borderWidth: 2.5,
            fill: {
              target: 'origin',
              above: 'rgba(129, 182, 76, 0.25)',
              below: 'rgba(200, 70, 70, 0.25)'
            },
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#81b64c',
            pointRadius: dataPoints.length > 50 ? 1.5 : 3.5,
            pointHoverRadius: 6,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, elements) => {
          if (elements && elements.length > 0) {
            const pointIndex = elements[0].index;
            // index 0 é Início, 1 é lance 0
            const moveIndex = pointIndex === 0 ? -1 : pointIndex - 1;
            this.onPointClick(moveIndex);
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#262522',
            titleColor: '#ffffff',
            bodyColor: '#bababa',
            borderColor: '#454341',
            borderWidth: 1,
            padding: 8,
            callbacks: {
              label: (context) => {
                const val = context.raw;
                if (val >= 10) return 'Vantagem: Brancas ganham (Mate)';
                if (val <= -10) return 'Vantagem: Pretas ganham (Mate)';
                return `Vantagem: ${val > 0 ? '+' : ''}${val.toFixed(2)} peões`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#8b8987',
              maxTicksLimit: 12,
              font: {
                size: 11
              }
            }
          },
          y: {
            min: -10,
            max: 10,
            grid: {
              color: (context) => {
                return context.tick.value === 0 ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)';
              }
            },
            ticks: {
              color: '#8b8987',
              stepSize: 5,
              callback: (value) => {
                if (value === 0) return '0.0';
                return value > 0 ? `+${value}` : `${value}`;
              },
              font: {
                size: 11
              }
            }
          }
        }
      }
    });
  }

  highlightPoint(moveIndex) {
    if (!this.chart) return;
    const pointIdx = moveIndex === -1 ? 0 : moveIndex + 1;
    this.chart.setActiveElements([{ datasetIndex: 0, index: pointIdx }]);
    this.chart.tooltip.setActiveElements([{ datasetIndex: 0, index: pointIdx }], { x: 0, y: 0 });
    this.chart.update('none');
  }

  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}
