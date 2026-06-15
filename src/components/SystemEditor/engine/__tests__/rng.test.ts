import { describe, it, expect } from 'vitest';
import { Rng } from '../rng';

describe('Rng', () => {
  it('is deterministic for the same seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    for (let i = 0; i < 20; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = new Rng(1);
    const b = new Rng(2);
    const av = Array.from({ length: 10 }, () => a.next());
    const bv = Array.from({ length: 10 }, () => b.next());
    expect(av).not.toEqual(bv);
  });

  it('seed=0 does not stick at zero', () => {
    const rng = new Rng(0);
    const vals = Array.from({ length: 10 }, () => rng.next());
    expect(vals.every((v) => v === 0)).toBe(false);
  });

  it('next() stays in [0, 1)', () => {
    const rng = new Rng(99);
    for (let i = 0; i < 1000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('range(min, max) stays within bounds', () => {
    const rng = new Rng(7);
    for (let i = 0; i < 500; i++) {
      const v = rng.range(5, 10);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThan(10);
    }
  });

  it('exponential(mean) has sample mean close to specified mean', () => {
    const rng = new Rng(13);
    const mean = 50;
    const samples = Array.from({ length: 5000 }, () => rng.exponential(mean));
    const sampleMean = samples.reduce((s, v) => s + v, 0) / samples.length;
    // σ/√n = 50/√5000 ≈ 0.7; allow ±5 (7σ band) to keep the test non-flaky
    expect(sampleMean).toBeGreaterThan(45);
    expect(sampleMean).toBeLessThan(55);
  });

  it('exponential(0) returns 0', () => {
    expect(new Rng(1).exponential(0)).toBe(0);
  });

  it('lognormal(mean, cv) has sample mean close to specified mean', () => {
    const rng = new Rng(17);
    const mean = 30;
    const cv = 0.5;
    const samples = Array.from({ length: 5000 }, () => rng.lognormal(mean, cv));
    const sampleMean = samples.reduce((s, v) => s + v, 0) / samples.length;
    expect(sampleMean).toBeCloseTo(mean, 0);
  });

  it('lognormal(mean, 0) returns mean (deterministic)', () => {
    const rng = new Rng(1);
    expect(rng.lognormal(42, 0)).toBe(42);
  });

  it('lognormal(0, cv) returns 0', () => {
    const rng = new Rng(1);
    expect(rng.lognormal(0, 0.5)).toBe(0);
  });
});
