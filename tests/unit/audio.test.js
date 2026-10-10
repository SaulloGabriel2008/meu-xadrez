import { describe, it, expect } from 'vitest';
import { soundManager } from '../../src/utils/audio.js';

describe('SoundManager', () => {
  it('deve permitir mutar e desmutar sons', () => {
    expect(soundManager.isMuted).toBe(false);
    const muted = soundManager.toggleMute();
    expect(muted).toBe(true);
    expect(soundManager.isMuted).toBe(true);

    const unmuted = soundManager.toggleMute();
    expect(unmuted).toBe(false);
    expect(soundManager.isMuted).toBe(false);
  });

  it('métodos de tocar som não devem lançar exceções mesmo sem AudioContext no node', () => {
    expect(() => soundManager.playMoveSound()).not.toThrow();
    expect(() => soundManager.playCaptureSound()).not.toThrow();
    expect(() => soundManager.playCheckSound()).not.toThrow();
    expect(() => soundManager.playPromoteSound()).not.toThrow();
    expect(() => soundManager.playGameEndSound('win')).not.toThrow();
    expect(() => soundManager.playGameEndSound('lose')).not.toThrow();
  });
});
