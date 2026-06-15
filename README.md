# system-design-lab

A visual distributed systems simulator for learning how real architectures behave under load.

Build a system on a canvas — nodes, edges, config — run a tick-based simulation, and read live metrics: throughput, error rate, queue backlog, P50/P95/P99 latency, utilization, cache hit rate, cloud cost.

## What it simulates

**Node kinds**

| Kind | Models |
|------|--------|
| Client | Load generator with configurable base rate and load profile |
| Load Balancer | Round-robin, weighted, or least-connections routing |
| API Gateway | Rate limiting + downstream fan-out |
| CDN | Edge cache with hit-rate, TTL, and dynamic warmup |
| Cache | Hit-rate based termination, miss forwarding, warmup model |
| Server | M/M/c queue — concurrency, replicas, service time, failure rate |
| Auto Scaler | Dynamic replica scaling with configurable up/down cooldowns |
| Circuit Breaker | Closed → Open → Half-open state machine |
| Message Queue | Bounded backlog, configurable drain rate |
| Shard Router | Consistent hashing with hot-shard skew |
| Replicated DB | Primary + N replicas; separate read/write service times and consistency levels |
| Database | Single-node database sink |
| External Dependency | Tail-latency injection, configurable failure rate |
| Rate Limiter | Token-bucket rate limiter — drop or queue overflow behavior |
| Fan-Out | Scatter-gather aggregator — parallel fan-out to N downstream, waits for k-of-N replies |

**Engine**

- Fluid / rate-based steady-state solver (Gauss-Seidel relaxation, adaptive epsilon convergence)
- M/M/c queueing theory for utilization, queue length, wait time
- Continuous overload model — no discontinuity at ρ=1 (two-term divergence formula)
- Monte Carlo latency tracing (seeded PRNG, configurable samples, k-of-N fan-out tracing)
- Write-aware replicatedDb latency — reads vs writes sampled independently per writeFraction
- Dynamic cache hit rate — exponential warmup from cold; thundering herd on chaos kill
- Autoscaler cooldown timers (separate scale-up / scale-down cooldowns)
- Tarjan SCC for cycle detection
- Load profiles: constant, ramp, spike, diurnal, step
- Chaos events: kill node, latency injection, network partition
- Per-edge traffic weights for explicit read/write routing

**Dashboard**

Live golden signals: throughput, error rate, P95 latency, saturation. Time-series charts for all four. Per-node utilization bars, queue depths, circuit breaker state.

## Presets

| Preset | Demonstrates |
|--------|-------------|
| Three-Tier Web App | Classic client → LB → servers → DB |
| Read-Heavy + Cache | Cache hit-rate termination, miss forwarding |
| Event-Driven + Queue | Async decoupling, bounded buffer, circuit breaker |
| Sharded Datastore | Consistent hashing, hot-shard skew |
| Microservice Mesh | Autoscaling, shared cache, replicated DB |
| URL Shortener | 92% cache hit rate, read-heavy redirect path |
| Ticket Booking | Spiky on-sale traffic, waiting-room queue |
| Chat / Messaging | Fan-out workers, message bus, sharded store |
| Social News Feed | Fan-out on write, cache-fronted read path |
| Video Streaming | CDN edge cache (95% hit), object storage |
| Open Banking (Rate Limiting) | Two rate limiters in series, fraud check path |
| Primary / Read-Replica DB | Write primary + read replicas, 1:4 traffic split |
| BFF / Scatter-Gather | Fan-out to 3 microservices in parallel, k-of-N wait |

## Features

- **Drag-and-drop canvas** — 15 node kinds
- **Alt + drag** — duplicate a node in place
- **Edge reconnect** — drag edge endpoints to rewire without deleting
- **Traffic weights** — right-click an edge to set relative routing weight
- **Inspector panel** — configure every parameter of a selected node
- **Scenario bar** — load profile presets, chaos injection
- **Cloud cost model** — AWS / GCP instance catalog with real pricing; usage-based rates for gateways, queues, CDN
- **Undo / redo** — full graph history (Cmd/Ctrl+Z)
- **Export / Import** — `.din` JSON design files
- **Auto layout** — vertical or horizontal rank arrangement
- **i18n** — English and Brazilian Portuguese

## Stack

- React 18 + TypeScript
- ReactFlow v11
- Tailwind CSS v3
- Recharts
- Vite + Vitest

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
pnpm test   # 82 engine unit tests
```

---

## Changes from upstream (distsys-lab)

This fork diverges from the original [distsys-lab](https://github.com/original/distsys-lab) in the following areas.

### New node kinds

| Node | What it adds |
|------|-------------|
| **CDN** | Edge cache separate from in-memory cache; TTL, hit rate, dynamic warmup |
| **Rate Limiter** | Token-bucket, configurable burst capacity, drop-or-queue overflow |
| **Fan-Out** | Scatter-gather with k-of-N semantics; latency = k-th slowest reply |

### Engine improvements

**Queueing math**
- Fixed ρ=1 discontinuity: replaced flat overload formula with two-term max — diverges continuously from Erlang-C as ρ→1⁺, then grows linearly for severe overload
- `replicatedDb` now uses a synthetic M/M/1 with effective mixed capacity (harmonic mean of read and write throughput) instead of read-only capacity, fixing understated utilization on write-heavy workloads
- Adaptive epsilon convergence: `ε = max(0.25, 0.1% × maxFlow)` so the solver converges correctly at any traffic scale

**Autoscaler**
- Added separate `scaleUpCooldownSec` / `scaleDownCooldownSec` (were hardcoded, now configurable per node)
- Scale events track timestamps to enforce cooldown correctly across ticks

**Latency tracer**
- `replicatedDb` hops now probabilistically sample read vs write service time based on `writeFraction`; replication lag applied only on writes for non-eventual consistency (was: always using read time, lag only on `strong`)
- Fan-out tracing: k-of-N branch selection — traces all branches, sorts by latency, picks the k-th smallest
- `traceSubPath` handles nested fan-out recursively (was: treated fan-out as regular node, picked one branch)

**Cache warmup**
- Hit rate evolves over time: `current += (target - current) * (1 - e^{-dt/τ})`
- New nodes start cold (0%), existing nodes start warm (steady state)
- `killNode` chaos resets hit rate to 0 → thundering herd effect on recovery

**Cost model**
- Instance catalog: AWS and GCP instance types with real prices and CPU factors for compute, database, and cache categories
- Autoscaler cost uses `rt.replicas` (simulated count) instead of `cfg.replicas` (static config)
- Fan-out and rate limiter nodes included in cost estimates

### Bug fixes

| File | Bug | Fix |
|------|-----|-----|
| `scenarios.ts` | `shardedStore` preset: `shardCount=4` but 3 downstream edges — capacity math and `shardLoads` array were inconsistent | Changed to `shardCount=3` |
| `latencyTracer.ts` | `replicatedDb` replication lag added only for `consistency === 'strong'`; solver adds lag for quorum too | Fixed to `!== 'eventual'` |
| `costModel.ts` | GCP server baseline was `$0.0395/hr` (wrong); AWS SQS rate was `$1.00/M` (API Gateway rate) | Fixed to `$0.0971/hr` and `$0.40/M` |
| `fluidSolver.ts` | `replicatedDb` used `readCap` for M/M/c but `effectiveCapacity` for drops — inconsistency understated utilization | Unified on synthetic M/M/1 |

### New presets

- **Open Banking (Rate Limiting)** — two rate limiters in series, fraud check engine, bank API quota
- **Primary / Read-Replica DB** — write primary with strong consistency, read replicas with cache, 1:4 traffic split
- **BFF / Scatter-Gather** — BFF server fans out to User, Product, and Inventory services in parallel; demonstrates tail latency = max(legs)

### Tests

Added 30 new unit tests (52 → 82):
- `rng.test.ts` — determinism, bounds, statistical means for all distributions
- `topology.test.ts` — adjacency, SCC detection, cycle validation
- `latencyTracer.test.ts` — percentile ordering, e2e ≥ node, determinism

### i18n

- Added Brazilian Portuguese (`pt`) locale alongside English
- All node kinds, inspector labels, hints, and descriptions translated
- No `defaultValue` fallbacks in production code — all keys defined in both locales

## License

MIT
