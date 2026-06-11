# distsys-lab

A visual distributed systems simulator for learning how real architectures behave under load.

Build a system on a canvas — nodes, edges, config — run a tick-based simulation, and read live metrics: throughput, error rate, queue backlog, P50/P95/P99 latency, utilization, cache hit rate, cloud cost.

## What it simulates

**Node kinds**

| Kind | Models |
|------|--------|
| Client | Load generator with configurable base rate and load profile |
| Load Balancer | Round-robin, weighted, or least-connections routing |
| API Gateway | Rate limiting + downstream fan-out |
| Cache | Hit-rate based termination, miss forwarding |
| Server | M/M/c queue — concurrency, replicas, service time, failure rate |
| Auto Scaler | Dynamic replica scaling based on utilization target |
| Circuit Breaker | Closed → Open → Half-open state machine |
| Message Queue | Bounded backlog, configurable drain rate |
| Shard Router | Consistent hashing with hot-shard skew |
| Replicated DB | Primary + N replicas; write fraction models read/write split |
| Database | Single-node database sink |
| External Dependency | Tail-latency injection, configurable failure rate |

**Engine**

- Fluid / rate-based steady-state solver (Gauss-Seidel relaxation)
- M/M/c queueing theory for utilization, queue length, wait time
- Monte Carlo latency tracing (seeded PRNG, configurable samples)
- Tarjan SCC for cycle detection
- Load profiles: constant, ramp, spike, diurnal, step
- Chaos events: kill node, latency injection, network partition
- Per-edge traffic weights for explicit read/write routing

**Dashboard**

Live golden signals: throughput, error rate, P95 latency, saturation. Time-series charts for all four. Per-node utilization bars, queue depths, circuit breaker state.

## Features

- **Drag-and-drop canvas** — 12 node kinds
- **Alt + drag** — duplicate a node in place
- **Edge reconnect** — drag edge endpoints to rewire without deleting
- **Traffic weights** — right-click an edge to set relative routing weight (e.g. 75%/25% read/write split)
- **Inspector panel** — configure every parameter of a selected node
- **Scenario bar** — load profile presets, chaos injection
- **Cloud cost model** — AWS / GCP / Azure estimates per architecture
- **Undo / redo** — full graph history (Cmd/Ctrl+Z)
- **Export / Import** — `.din` JSON design files
- **Auto layout** — vertical or horizontal rank arrangement

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
pnpm test   # 52 engine unit tests
```

## License

MIT
