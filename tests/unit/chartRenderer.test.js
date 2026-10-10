import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Chart } from 'chart.js';
import { ChartRenderer } from '../../src/ui/chartRenderer.js';

vi.mock('chart.js', () => {
  const mockChartInstance = {
    destroy: vi.fn(),
    setActiveElements: vi.fn(),
    tooltip: {
      setActiveElements: vi.fn()
    },
    update: vi.fn()
  };

  const MockChart = vi.fn().mockImplementation((ctx, config) => {
    MockChart.lastConfig = config;
    return mockChartInstance;
  });

  MockChart.register = vi.fn();
  MockChart.mockInstance = mockChartInstance;

  return {
    Chart: MockChart,
    registerables: []
  };
});

describe('ChartRenderer', () => {
  let canvas;
  let renderer;

  beforeEach(() => {
    vi.clearAllMocks();
    canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 180;
    document.body.appendChild(canvas);

    const mockCtx = {
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn()
      }))
    };
    canvas.getContext = vi.fn(() => mockCtx);
  });

  it('deve inicializar com propriedades padrão', () => {
    renderer = new ChartRenderer(canvas);
    expect(renderer.canvas).toBe(canvas);
    expect(renderer.chart).toBeNull();
  });

  it('deve converter centipawns e mates em dataPoints corretos no Chart', () => {
    renderer = new ChartRenderer(canvas);
    const mockMoves = [
      { index: 0, san: 'e4', color: 'w', evalAfter: { type: 'cp', value: 150 } },
      { index: 1, san: 'e5', color: 'b', evalAfter: { type: 'cp', value: -200 } },
      { index: 2, san: 'Qh5', color: 'w', evalAfter: { type: 'mate', value: 2 } },
      { index: 3, san: 'Nf6', color: 'b', evalAfter: { type: 'mate', value: -3 } },
      { index: 4, san: 'd4', color: 'w', evalAfter: { type: 'cp', value: 1500 } } // Excede limite de 10
    ];

    renderer.render(mockMoves);

    expect(Chart).toHaveBeenCalled();
    const config = Chart.lastConfig;
    expect(config.type).toBe('line');

    const expectedLabels = ['Início', '1. e4', '1... e5', '2. Qh5', '2... Nf6', '3. d4'];
    expect(config.data.labels).toEqual(expectedLabels);

    const dataPoints = config.data.datasets[0].data;
    // Ponto 0: Início = 0
    // Ponto 1: +150 cp -> +1.5
    // Ponto 2: -200 cp -> -2.0
    // Ponto 3: mate 2 -> 10
    // Ponto 4: mate -3 -> -10
    // Ponto 5: 1500 cp -> clampado em 10
    expect(dataPoints).toEqual([0, 1.5, -2.0, 10, -10, 10]);
  });

  it('deve chamar callback onPointClick quando ponto for clicado', () => {
    const clickSpy = vi.fn();
    renderer = new ChartRenderer(canvas, { onPointClick: clickSpy });
    renderer.render([{ index: 0, san: 'e4', color: 'w', evalAfter: { type: 'cp', value: 0 } }]);

    const config = Chart.lastConfig;
    const onClickHandler = config.options.onClick;

    // Clica no ponto 0 (Início) -> deve mapear para moveIndex = -1
    onClickHandler(null, [{ index: 0 }]);
    expect(clickSpy).toHaveBeenCalledWith(-1);

    // Clica no ponto 1 (lance 0) -> deve mapear para moveIndex = 0
    onClickHandler(null, [{ index: 1 }]);
    expect(clickSpy).toHaveBeenCalledWith(0);
  });

  it('deve permitir destacar ponto do gráfico com highlightPoint', () => {
    renderer = new ChartRenderer(canvas);
    renderer.render([{ index: 0, san: 'e4', color: 'w', evalAfter: { type: 'cp', value: 0 } }]);

    renderer.highlightPoint(0);
    expect(Chart.mockInstance.setActiveElements).toHaveBeenCalledWith([{ datasetIndex: 0, index: 1 }]);
    expect(Chart.mockInstance.tooltip.setActiveElements).toHaveBeenCalled();
    expect(Chart.mockInstance.update).toHaveBeenCalledWith('none');

    // highlightPoint(-1) para a posição inicial
    renderer.highlightPoint(-1);
    expect(Chart.mockInstance.setActiveElements).toHaveBeenCalledWith([{ datasetIndex: 0, index: 0 }]);
  });

  it('deve destruir a instância existente do Chart ao chamar destroy()', () => {
    renderer = new ChartRenderer(canvas);
    renderer.render([]);
    expect(renderer.chart).not.toBeNull();

    renderer.destroy();
    expect(Chart.mockInstance.destroy).toHaveBeenCalled();
    expect(renderer.chart).toBeNull();
  });
});
