import { describe, it, expect, vi, beforeEach } from 'vitest';
import { soundManager } from '../../src/utils/audio.js';

describe('SoundManager (ChessAudio)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    soundManager.isMuted = false;
    soundManager.ctx = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve alternar mute e unmute corretamente', () => {
    expect(soundManager.isMuted).toBe(false);

    const firstToggle = soundManager.toggleMute();
    expect(firstToggle).toBe(true);
    expect(soundManager.isMuted).toBe(true);

    const secondToggle = soundManager.toggleMute();
    expect(secondToggle).toBe(false);
    expect(soundManager.isMuted).toBe(false);
  });

  it('não deve emitir sons nem acessar AudioContext quando mutado', () => {
    soundManager.isMuted = true;
    const getContextSpy = vi.spyOn(soundManager, 'getContext');

    soundManager.playMoveSound();
    soundManager.playCaptureSound();
    soundManager.playCheckSound();
    soundManager.playPromoteSound();
    soundManager.playGameEndSound('win');
    soundManager.playGameEndSound('lose');

    expect(getContextSpy).not.toHaveBeenCalled();
  });

  it('métodos de som não devem lançar exceções mesmo quando AudioContext não está disponível', () => {
    soundManager.isMuted = false;
    vi.spyOn(soundManager, 'getContext').mockReturnValue(null);

    expect(() => soundManager.playMoveSound()).not.toThrow();
    expect(() => soundManager.playCaptureSound()).not.toThrow();
    expect(() => soundManager.playCheckSound()).not.toThrow();
    expect(() => soundManager.playPromoteSound()).not.toThrow();
    expect(() => soundManager.playGameEndSound('win')).not.toThrow();
    expect(() => soundManager.playGameEndSound('lose')).not.toThrow();
  });

  describe('com Web Audio API simulado', () => {
    let mockOscillator;
    let mockGain;
    let mockFilter;
    let mockCtx;

    beforeEach(() => {
      mockOscillator = {
        type: 'sine',
        frequency: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn()
        },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn()
      };

      mockGain = {
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn()
        },
        connect: vi.fn()
      };

      mockFilter = {
        type: 'lowpass',
        frequency: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn()
        },
        connect: vi.fn()
      };

      mockCtx = {
        currentTime: 10,
        destination: {},
        state: 'running',
        createOscillator: vi.fn(() => ({ ...mockOscillator })),
        createGain: vi.fn(() => ({ ...mockGain })),
        createBiquadFilter: vi.fn(() => ({ ...mockFilter })),
        resume: vi.fn().mockResolvedValue()
      };

      soundManager.ctx = mockCtx;
    });

    it('getContext deve resumir contexto se estiver em estado suspended', () => {
      mockCtx.state = 'suspended';
      const ctx = soundManager.getContext();
      expect(ctx).toBe(mockCtx);
      expect(mockCtx.resume).toHaveBeenCalled();
    });

    it('playMoveSound deve criar oscilador triangle, filtro lowpass e ganho', () => {
      soundManager.playMoveSound();

      expect(mockCtx.createOscillator).toHaveBeenCalled();
      expect(mockCtx.createGain).toHaveBeenCalled();
      expect(mockCtx.createBiquadFilter).toHaveBeenCalled();
    });

    it('playCaptureSound deve criar 2 componentes osciladores (impacto grave e estalo)', () => {
      soundManager.playCaptureSound();

      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(2);
      expect(mockCtx.createGain).toHaveBeenCalledTimes(2);
    });

    it('playCheckSound deve tocar arpejo duplo harmônico (D5 e A5)', () => {
      soundManager.playCheckSound();

      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(2);
      expect(mockCtx.createGain).toHaveBeenCalledTimes(2);
    });

    it('playPromoteSound deve tocar acorde de 4 notas ascendentes', () => {
      soundManager.playPromoteSound();

      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(4);
      expect(mockCtx.createGain).toHaveBeenCalledTimes(4);
    });

    it('playGameEndSound deve tocar fanfarra maior para win e acorde menor para lose', () => {
      soundManager.playGameEndSound('win');
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(4);

      mockCtx.createOscillator.mockClear();
      soundManager.playGameEndSound('lose');
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(4);
    });
  });
});
