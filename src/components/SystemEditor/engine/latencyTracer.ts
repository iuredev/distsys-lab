// Sampled request tracing for tail-latency percentiles.
//
// The fluid solver gives us mean per-node response times and routing
// probabilities. To recover realistic p95/p99 we Monte-Carlo a batch of
// synthetic requests through the resolved graph, sampling each hop's service
// time from its configured distribution plus an exponential queue-wait whose
// mean equals the queue's Wq. End-to-end and per-node samples are reduced to
// percentiles.

import { NodeRuntime } from './fluidSolver';
import { Rng } from './rng';

export interface Percentiles {
  p50: number;
  p95: number;
  p99: number;
}

export interface TraceResult {
  perNode: Map<string, Percentiles>;
  system: Percentiles;
}

const MAX_HOPS = 64;

export function traceLatency(
  runtime: Map<string, NodeRuntime>,
  rng: Rng,
  samples: number,
): TraceResult {
  const nodes = [...runtime.values()];

  // Entry points: client nodes weighted by the load they generate.
  const clients = nodes.filter((n) => n.cfg.kind === 'client' && n.throughput > 0);
  const perNodeSamples = new Map<string, number[]>();
  const e2eSamples: number[] = [];

  if (clients.length === 0) {
    return { perNode: emptyPercentiles(runtime), system: { p50: 0, p95: 0, p99: 0 } };
  }

  const clientTotal = clients.reduce((s, c) => s + c.throughput, 0);

  for (let i = 0; i < samples; i++) {
    let current: NodeRuntime | undefined = pickWeighted(clients, clientTotal, rng);
    let latency = 0;
    let hops = 0;

    while (current && hops < MAX_HOPS) {
      hops++;
      latency += sampleNodeLatency(current, rng);
      recordSample(perNodeSamples, current.cfg.id, hopLatency(current, rng));

      // Fan-out: trace all branches in parallel; contribute the k-th smallest latency.
      if (current.cfg.kind === 'fanOut' && current.branches.length > 0) {
        const k = Math.min(
          current.branches.length,
          Math.max(1, current.cfg.scatterK ?? current.branches.length),
        );
        const bl = current.branches
          .map((b) => traceSubPath(runtime.get(b.target), runtime, rng, MAX_HOPS - hops))
          .sort((a, b) => a - b);
        latency += bl[k - 1] ?? 0;
        break;
      }

      // Terminate (cache hit, sink, answered request)?
      if (current.branches.length === 0 || rng.next() < current.terminateProb) {
        break;
      }
      const nextId = pickBranch(current, rng);
      if (!nextId) break;
      current = runtime.get(nextId);
    }

    e2eSamples.push(latency);
  }

  const perNode = new Map<string, Percentiles>();
  runtime.forEach((_, id) => {
    perNode.set(id, percentiles(perNodeSamples.get(id) ?? []));
  });

  return { perNode, system: percentiles(e2eSamples) };
}

/** A single hop's contribution to the end-to-end path latency. */
function sampleNodeLatency(rt: NodeRuntime, rng: Rng): number {
  return hopLatency(rt, rng);
}

function hopLatency(rt: NodeRuntime, rng: Rng): number {
  const cfg = rt.cfg;
  // Queue wait sampled as Exp(Wq): exact for M/M/1, approximate for M/M/c
  // (true distribution is a mixture of exponentials, but Exp(mean) is close).
  const wait = rt.queue.waitMs > 0 ? rng.exponential(rt.queue.waitMs) : 0;

  // replicatedDb: probabilistically sample a read or write request.
  // Writes use writeServiceTimeMs (may differ from serviceTimeMs) and carry
  // replication lag for non-eventual consistency — matching the solver's
  // writeServiceMs = writeServiceTimeMs + replicationLagMs formula.
  if (cfg.kind === 'replicatedDb') {
    const writeFrac = cfg.writeFraction ?? 0.2;
    const isWrite = rng.next() < writeFrac;
    const serviceMs = isWrite ? (cfg.writeServiceTimeMs ?? cfg.serviceTimeMs) : cfg.serviceTimeMs;
    const lagMs = (isWrite && cfg.consistency !== 'eventual') ? (cfg.replicationLagMs ?? 0) : 0;
    return sampleService(serviceMs, cfg.latencyDistribution, cfg.latencyCv, rng) + wait + lagMs;
  }

  return sampleService(cfg.serviceTimeMs, cfg.latencyDistribution, cfg.latencyCv, rng) + wait;
}

function sampleService(
  meanMs: number,
  dist: string,
  cv: number,
  rng: Rng,
): number {
  if (meanMs <= 0) return 0;
  switch (dist) {
    case 'deterministic':
      return meanMs;
    case 'exponential':
      return rng.exponential(meanMs);
    case 'lognormal':
    default:
      return rng.lognormal(meanMs, cv);
  }
}

function traceSubPath(
  start: NodeRuntime | undefined,
  runtime: Map<string, NodeRuntime>,
  rng: Rng,
  maxHops: number,
): number {
  let current = start;
  let latency = 0;
  let hops = 0;
  while (current && hops < maxHops) {
    hops++;
    latency += hopLatency(current, rng);
    // Nested fanOut: apply k-of-N scatter-gather recursively.
    if (current.cfg.kind === 'fanOut' && current.branches.length > 0) {
      const k = Math.min(current.branches.length, Math.max(1, current.cfg.scatterK ?? current.branches.length));
      const bl = current.branches
        .map((b) => traceSubPath(runtime.get(b.target), runtime, rng, maxHops - hops))
        .sort((a, b) => a - b);
      latency += bl[k - 1] ?? 0;
      break;
    }
    if (current.branches.length === 0 || rng.next() < current.terminateProb) break;
    const nextId = pickBranch(current, rng);
    if (!nextId) break;
    current = runtime.get(nextId);
  }
  return latency;
}

function pickWeighted(clients: NodeRuntime[], total: number, rng: Rng): NodeRuntime {
  if (total <= 0) return clients[0];
  let r = rng.next() * total;
  for (const c of clients) {
    r -= c.throughput;
    if (r <= 0) return c;
  }
  return clients[clients.length - 1];
}

function pickBranch(rt: NodeRuntime, rng: Rng): string | undefined {
  const total = rt.branches.reduce((s, b) => s + b.prob, 0);
  if (total <= 0) return rt.branches[0]?.target;
  let r = rng.next() * total;
  for (const b of rt.branches) {
    r -= b.prob;
    if (r <= 0) return b.target;
  }
  return rt.branches[rt.branches.length - 1]?.target;
}

function recordSample(map: Map<string, number[]>, id: string, value: number): void {
  const arr = map.get(id);
  if (arr) arr.push(value);
  else map.set(id, [value]);
}

export function percentiles(samples: number[]): Percentiles {
  if (samples.length === 0) return { p50: 0, p95: 0, p99: 0 };
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    p50: quantile(sorted, 0.5),
    p95: quantile(sorted, 0.95),
    p99: quantile(sorted, 0.99),
  };
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(q * sorted.length));
  return sorted[idx];
}

function emptyPercentiles(runtime: Map<string, NodeRuntime>): Map<string, Percentiles> {
  const m = new Map<string, Percentiles>();
  runtime.forEach((_, id) => m.set(id, { p50: 0, p95: 0, p99: 0 }));
  return m;
}
