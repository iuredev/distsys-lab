import { describe, it, expect } from 'vitest';
import { traceLatency, percentiles } from '../latencyTracer';
import { Rng } from '../rng';
import { Simulator } from '../simulator';
import { defaultsForKind, EdgeSpec, NodeConfig, SimConfig } from '../types';

// ---- percentiles ----

describe('percentiles', () => {
  it('returns zeros for an empty array', () => {
    const p = percentiles([]);
    expect(p.p50).toBe(0);
    expect(p.p95).toBe(0);
    expect(p.p99).toBe(0);
  });

  it('returns single value for a one-element array', () => {
    const p = percentiles([42]);
    expect(p.p50).toBe(42);
    expect(p.p95).toBe(42);
    expect(p.p99).toBe(42);
  });

  it('p50 <= p95 <= p99 for a random sample', () => {
    const rng = new Rng(5);
    const samples = Array.from({ length: 200 }, () => rng.exponential(100));
    const p = percentiles(samples);
    expect(p.p50).toBeLessThanOrEqual(p.p95);
    expect(p.p95).toBeLessThanOrEqual(p.p99);
  });

  it('median is roughly correct for a uniform distribution', () => {
    // 1000 uniform samples in [0, 100]
    const samples = Array.from({ length: 1000 }, (_, i) => (i / 1000) * 100);
    const p = percentiles(samples);
    expect(p.p50).toBeCloseTo(50, 0);
    expect(p.p95).toBeCloseTo(95, 0);
  });
});

// ---- traceLatency ----

describe('traceLatency', () => {
  function simRuntime(ticks = 5) {
    const nodes: NodeConfig[] = [
      { ...defaultsForKind('client', 'c', 'Client'), baseRate: 50 },
      defaultsForKind('server', 's', 'Server'),
      defaultsForKind('database', 'db', 'DB'),
    ];
    const edges: EdgeSpec[] = [
      { id: 'e1', source: 'c', target: 's' },
      { id: 'e2', source: 's', target: 'db' },
    ];
    const cfg: SimConfig = { nodes, edges, seed: 11, dtSeconds: 1, traceSamples: 500 };
    const sim = new Simulator(cfg);
    let frame = sim.tick();
    for (let i = 1; i < ticks; i++) frame = sim.tick();
    return frame;
  }

  it('system p50 <= p95 <= p99', () => {
    const frame = simRuntime();
    expect(frame.system.p50).toBeLessThanOrEqual(frame.system.p95 + 1e-6);
    expect(frame.system.p95).toBeLessThanOrEqual(frame.system.p99 + 1e-6);
  });

  it('all latencies are non-negative and finite', () => {
    const frame = simRuntime();
    expect(frame.system.p50).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(frame.system.p95)).toBe(true);
    expect(Number.isFinite(frame.system.p99)).toBe(true);
  });

  it('returns zeros when no clients exist', () => {
    const nodes: NodeConfig[] = [defaultsForKind('server', 's', 'Server')];
    const cfg: SimConfig = { nodes, edges: [], seed: 1, dtSeconds: 1, traceSamples: 200 };
    const sim = new Simulator(cfg);
    const frame = sim.tick();
    expect(frame.system.p50).toBe(0);
    expect(frame.system.p95).toBe(0);
  });

  it('e2e p95 is at least as large as any individual node p95', () => {
    const frame = simRuntime();
    const nodeMax = Math.max(
      ...Object.values(frame.nodeMetrics).map((m) => m.p95),
    );
    // e2e spans multiple hops so should be >= single-node p95
    expect(frame.system.p95).toBeGreaterThanOrEqual(nodeMax - 1e-6);
  });

  it('is deterministic for the same seed', () => {
    const frame1 = simRuntime();
    const frame2 = simRuntime();
    expect(frame1.system.p95).toBe(frame2.system.p95);
    expect(frame1.system.p50).toBe(frame2.system.p50);
  });
});
