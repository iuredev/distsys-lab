# SPEC.md — System Design Lab

## 1. Visão do projeto

Criar um projeto chamado **System Design Lab**: um editor visual de system design com simulação matemática de tráfego, inspirado na parte de editor/simulador do projeto Dinamos.

O objetivo é construir **somente a parte do editor de arquitetura + simulation engine**, sem monetização, login, ranking, billing, game mode ou backend.

A experiência desejada é:

> O usuário monta uma arquitetura visualmente, configura capacidade/latência/falhas dos componentes, aperta Run, e vê tráfego, gargalos, filas, cache hit/miss, latência P50/P95/P99, throughput, error rate e utilização sendo simulados matematicamente.

Este projeto deve ser focado em aprendizado profundo de system design.

---

## 2. Referência principal

Repositório de referência:

```txt
https://github.com/flaviojmendes/dinamos
```

Partes úteis do Dinamos:

```txt
src/components/SystemEditor/
src/components/SystemEditor/SystemEditorV2.tsx
src/components/SystemEditor/engine/
src/components/SystemEditor/ui/
```

Partes que NÃO devem ser copiadas para o MVP:

```txt
auth
Firebase
Stripe
OpenAI
Resend
billing
game mode
leaderboard
admin spectator
backend/API
PostgreSQL
Drizzle
conteúdo MDX
roadmap educacional
```

A referência deve ser usada para entender arquitetura, engine e comportamento, mas o projeto novo deve ser limpo, menor e focado no editor.

---

## 3. Objetivo funcional

O app deve permitir:

1. Criar uma arquitetura visual em um canvas.
2. Adicionar componentes como Client, API, Cache, Database, Queue e Worker.
3. Conectar componentes com edges.
4. Configurar propriedades técnicas dos componentes.
5. Rodar uma simulação matemática por ticks.
6. Visualizar tráfego nas conexões.
7. Visualizar métricas por node.
8. Detectar gargalos automaticamente.
9. Simular falhas e cenários de carga.
10. Salvar/carregar designs localmente.


O simulador deve ser **matemático/agregado**, não operacional/real.

---

## 5. Stack técnica

Usar:

```txt
Vite
React
TypeScript
@xyflow/react
Zustand
Tailwind CSS
Lucide React
Recharts
Vitest
LocalStorage
```

Opcional depois:

```txt
Web Worker
Rust/WASM
IndexedDB
```


---

## 6. Comandos esperados

Criar projeto:

```bash
npm create vite@latest system-design-lab -- --template react-ts
cd system-design-lab
npm install
npm install @xyflow/react zustand lucide-react recharts
npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom
```

Rodar:

```bash
npm run dev
```

Testar:

```bash
npm test
```

Build:

```bash
npm run build
```

---

## 7. Arquitetura desejada de pastas

```txt
src/
  app/
    App.tsx
    main.tsx

  features/
    system-editor/
      SystemEditor.tsx

      components/
        Canvas.tsx
        Palette.tsx
        Toolbar.tsx
        InspectorPanel.tsx
        MetricsPanel.tsx
        BottleneckPanel.tsx
        ScenarioPanel.tsx
        SimNode.tsx
        EdgeTraffic.tsx

      engine/
        types.ts
        defaults.ts
        simulator.ts
        fluid-solver.ts
        queueing.ts
        latency-tracer.ts
        failure-model.ts
        routing.ts
        topology.ts
        bottlenecks.ts
        scenarios.ts
        rng.ts

      store/
        editor-store.ts
        simulation-store.ts

      persistence/
        local-storage.ts

      utils/
        graph-validation.ts
        formatters.ts
```

---

## 8. Conceito central

O canvas não é o sistema. O canvas é só a interface.

O núcleo do app é o pipeline:

```txt
Visual Graph
  -> Graph JSON
  -> Simulation Engine
  -> SimulationFrame
  -> Metrics UI
  -> Traffic Visualization
```

O engine deve ser independente de React.

Regra obrigatória:

```txt
Nenhum arquivo dentro de engine/ pode importar React, React Flow, Zustand ou componentes de UI.
```

---

## 9. Modelo de simulação

O simulador deve ser baseado em **taxas agregadas** e **eventos discretos por tick**, não request por request.

Primeiro MVP:

```txt
1 tick = 1 segundo
```

Depois poderá evoluir para:

```txt
1 tick = 100ms
```

A cada tick:

1. Client gera carga inicial.
2. O grafo propaga tráfego pelas edges.
3. Cada node calcula capacidade, throughput, dropped rate, failure rate e latência.
4. O output de cada node vira input dos próximos nodes.
5. Métricas são agregadas em um `SimulationFrame`.
6. A UI usa o frame para atualizar nodes, edges e dashboards.

---

## 10. Tipos centrais

Criar `engine/types.ts`.

```ts
export type NodeKind =
  | "client"
  | "loadBalancer"
  | "apiGateway"
  | "apiService"
  | "cache"
  | "database"
  | "replicatedDatabase"
  | "messageQueue"
  | "worker"
  | "externalService"
  | "circuitBreaker"
  | "autoScaler"
  | "shardRouter";

export type LatencyDistribution =
  | "deterministic"
  | "exponential"
  | "lognormal";

export type LoadBalancerStrategy =
  | "roundRobin"
  | "leastConnections"
  | "weighted"
  | "hashing";

export interface RetryPolicy {
  maxRetries: number;
  backoffBaseMs: number;
  jitter: boolean;
}

export interface NodeConfig {
  id: string;
  kind: NodeKind;
  label: string;

  serviceTimeMs: number;
  concurrency: number;
  replicas: number;
  failureRate: number;
  timeoutMs: number;
  queueCapacity: number;

  latencyDistribution: LatencyDistribution;
  latencyCv: number;

  retry?: RetryPolicy;

  baseRate?: number;

  strategy?: LoadBalancerStrategy;
  weights?: Record<string, number>;

  rateLimit?: number;

  hitRate?: number;
  ttlSeconds?: number;

  maxQueue?: number;
  dequeueRate?: number;

  replicaCount?: number;
  writeFraction?: number;
  replicationLagMs?: number;

  shardCount?: number;
  skew?: number;

  errorThreshold?: number;
  resetTimeoutMs?: number;

  targetUtilization?: number;
  minReplicas?: number;
  maxReplicas?: number;
}

export interface EdgeSpec {
  id: string;
  source: string;
  target: string;
}

export interface NodeMetrics {
  arrivalRate: number;
  throughput: number;
  utilization: number;
  inFlight: number;
  queueLength: number;
  waitMs: number;
  responseTimeMs: number;
  failedRate: number;
  droppedRate: number;
  retriedRate: number;
  servers: number;
  replicas: number;

  p50: number;
  p95: number;
  p99: number;

  cacheHits?: number;
  cacheMisses?: number;
  hitRate?: number;

  circuitState?: "closed" | "open" | "halfOpen";
  shardLoads?: number[];
}

export interface SystemMetrics {
  time: number;
  offeredLoad: number;
  totalThroughput: number;
  successRate: number;
  errorRate: number;
  failedRate: number;
  inFlightTotal: number;
  p50: number;
  p95: number;
  p99: number;
  warnings: string[];
}

export interface SimulationFrame {
  time: number;
  nodeMetrics: Record<string, NodeMetrics>;
  edgeFlow: Record<string, number>;
  system: SystemMetrics;
}

export interface SimConfig {
  nodes: NodeConfig[];
  edges: EdgeSpec[];
  seed: number;
  dtSeconds: number;
  traceSamples: number;
}
```

---

## 11. Defaults por tipo de node

Criar `engine/defaults.ts`.

Defaults sugeridos:

```ts
export function defaultsForKind(
  kind: NodeKind,
  id: string,
  label: string
): NodeConfig {
  const base: NodeConfig = {
    id,
    kind,
    label,
    serviceTimeMs: 20,
    concurrency: 4,
    replicas: 1,
    failureRate: 0,
    timeoutMs: 1000,
    queueCapacity: Infinity,
    latencyDistribution: "lognormal",
    latencyCv: 0.5,
  };

  switch (kind) {
    case "client":
      return {
        ...base,
        baseRate: 1000,
        serviceTimeMs: 0,
        concurrency: 1,
        timeoutMs: 2000,
      };

    case "loadBalancer":
      return {
        ...base,
        serviceTimeMs: 2,
        concurrency: 16,
        strategy: "roundRobin",
      };

    case "apiGateway":
      return {
        ...base,
        serviceTimeMs: 5,
        concurrency: 16,
        rateLimit: 10000,
      };

    case "apiService":
      return {
        ...base,
        serviceTimeMs: 30,
        concurrency: 4,
        replicas: 2,
      };

    case "cache":
      return {
        ...base,
        serviceTimeMs: 2,
        concurrency: 32,
        hitRate: 0.8,
        ttlSeconds: 60,
      };

    case "database":
      return {
        ...base,
        serviceTimeMs: 15,
        concurrency: 8,
        writeFraction: 0.2,
      };

    case "replicatedDatabase":
      return {
        ...base,
        serviceTimeMs: 15,
        concurrency: 8,
        replicaCount: 3,
        writeFraction: 0.2,
        replicationLagMs: 50,
      };

    case "messageQueue":
      return {
        ...base,
        serviceTimeMs: 1,
        concurrency: 1,
        maxQueue: 100000,
        dequeueRate: 1000,
      };

    case "worker":
      return {
        ...base,
        serviceTimeMs: 40,
        concurrency: 4,
        replicas: 2,
      };

    case "externalService":
      return {
        ...base,
        serviceTimeMs: 80,
        concurrency: 8,
        failureRate: 0.01,
        latencyCv: 1.0,
      };

    case "circuitBreaker":
      return {
        ...base,
        serviceTimeMs: 1,
        concurrency: 64,
        errorThreshold: 0.5,
        resetTimeoutMs: 5000,
      };

    case "autoScaler":
      return {
        ...base,
        serviceTimeMs: 30,
        concurrency: 4,
        replicas: 1,
        targetUtilization: 0.7,
        minReplicas: 1,
        maxReplicas: 20,
      };

    case "shardRouter":
      return {
        ...base,
        serviceTimeMs: 2,
        concurrency: 16,
        shardCount: 4,
        skew: 0,
      };

    default:
      return base;
  }
}
```

---

## 12. Fórmulas base

Criar `engine/queueing.ts`.

Implementar M/M/c simplificado no MVP, evoluindo para Erlang-C.

### Capacidade

```ts
serviceRatePerServer = 1000 / serviceTimeMs
servers = concurrency * replicas
capacity = serviceRatePerServer * servers
```

### Utilização

```ts
utilization = arrivalRate / capacity
```

Pode passar de 1 quando está sobrecarregado.

### Throughput

```ts
throughput = Math.min(arrivalRate, capacity)
```

### Dropped

```ts
droppedRate = Math.max(0, arrivalRate - capacity)
```

### Latência simples inicial

```ts
if utilization < 0.7:
  responseTime = serviceTimeMs

if 0.7 <= utilization < 1:
  responseTime = serviceTimeMs / (1 - utilization)

if utilization >= 1:
  responseTime = serviceTimeMs * (10 + (utilization - 1) * 200)
```

Depois evoluir para Erlang-C/M/M/c.

### Little's Law

```ts
inFlight = arrivalRate * responseTimeSeconds
queueLength = arrivalRate * waitSeconds
```

---

## 13. Engine: simulador

Criar `engine/simulator.ts`.

Contrato:

```ts
export class Simulator {
  constructor(config: SimConfig);

  tick(): SimulationFrame;

  setGraph(nodes: NodeConfig[], edges: EdgeSpec[]): void;

  reset(): void;

  setLoadMultiplier(multiplier: number): void;

  setChaos(events: ChaosEvent[]): void;
}
```

Estado interno:

```ts
interface EngineState {
  time: number;
  queueLengths: Map<string, number>;
  circuitStates: Map<string, CircuitState>;
  breakerShed: Map<string, number>;
  replicaOverride: Map<string, number>;
  loadMultiplier: number;
}
```

A cada `tick()`:

1. Construir topologia.
2. Resolver fluxo agregado.
3. Atualizar filas.
4. Aplicar falhas.
5. Aplicar autoscaling.
6. Gerar percentis.
7. Detectar warnings.
8. Retornar `SimulationFrame`.

---

## 14. Solver de fluxo

Criar `engine/fluid-solver.ts`.

Objetivo:

> Resolver fluxo em grafos direcionados com taxas agregadas, incluindo cache, filas, retries, fan-out e ciclos.

Regras:

### Client

Client gera:

```ts
arrival = baseRate * loadMultiplier
throughput = arrival * (1 - failureRate)
```

Client sempre encaminha para os próximos nodes.

### Node comum

Para API, database, worker, external service:

```ts
capacity = servers * serviceRate
processed = Math.min(arrival, capacity)
dropped = Math.max(0, arrival - capacity)
failed = processed * effectiveFailureProbability
throughput = processed - failed
forwarded = throughput
```

### Cache

Cache processa chegada usando sua capacidade.

```ts
cacheHits = throughput * hitRate
cacheMisses = throughput * (1 - hitRate)
```

Regra:

```txt
cache hit termina ali como sucesso
cache miss segue para próximos nodes
```

### Queue

Queue possui estado entre ticks.

```ts
incomingMessages = arrival * dtSeconds
backlog += incomingMessages
drained = min(backlog, dequeueRate * dtSeconds)
backlog -= drained
throughput = drained / dtSeconds
```

Se `backlog > maxQueue`, excedente é dropped.

Wait aproximado:

```ts
waitMs = (backlog / dequeueRate) * 1000
```

### Load Balancer

No MVP:

```txt
dividir tráfego igualmente entre saídas
```

Depois:

```txt
roundRobin
leastConnections
weighted
hashing
```

### API Gateway

Aplicar rate limit:

```ts
admitted = min(arrival, rateLimit)
throttled = max(0, arrival - rateLimit)
```

### Replicated Database

Aproximação:

```ts
readCapacity = serviceRate * concurrency * replicaCount
writeCapacity = serviceRate * concurrency
effectiveCapacity =
  1 / ((1 - writeFraction) / readCapacity + writeFraction / writeCapacity)
```

### Shard Router

Aproximação:

```ts
hotShare = 1 / shardCount + skew * (1 - 1 / shardCount)
effectiveCapacity = baseCapacity / max(hotShare * shardCount, 1)
```

### Retries

Se um node tem retry policy:

```ts
expectedAttempts = 1 + failureProbability + failureProbability^2 ...
```

Limitado por `maxRetries`.

Retry deve aumentar o tráfego downstream.

---

## 15. Latência e percentis

Criar `engine/latency-tracer.ts`.

No MVP simples, calcular:

```ts
p50 = responseTimeMs
p95 = responseTimeMs * 2
p99 = responseTimeMs * 3
```

Depois evoluir para Monte Carlo.

Versão avançada:

1. Gerar N traces sintéticos por tick.
2. Escolher client proporcional à carga.
3. Percorrer o grafo conforme probabilidades de roteamento.
4. Para cada hop, amostrar:
   - service time
   - queue wait
   - replication lag
5. Agregar:
   - per-node p50/p95/p99
   - system p50/p95/p99

Distribuições:

```txt
deterministic
exponential
lognormal
```

Funções esperadas:

```ts
export function traceLatency(
  runtime: Map<string, NodeRuntime>,
  rng: Rng,
  samples: number
): TraceResult;
```

---

## 16. Failure model

Criar `engine/failure-model.ts`.

Implementar:

```ts
combineFailureProbs(...probs: number[]): number
timeoutFailureProb(responseTimeMs: number, timeoutMs: number): number
expectedAttempts(failureProb: number, retry?: RetryPolicy): number
afterRetryFailProb(failureProb: number, retry?: RetryPolicy): number
```

Regras:

### Falha combinada

```ts
combined = 1 - product(1 - p)
```

### Timeout

Se `responseTimeMs > timeoutMs`, gerar probabilidade de falha.

MVP:

```ts
if responseTimeMs <= timeoutMs:
  return 0

over = responseTimeMs / timeoutMs
return clamp((over - 1) / over, 0, 1)
```

### Retry amplification

Se failureProb = 0.2 e maxRetries = 2:

```txt
tentativa 1: 1
tentativa 2: 0.2
tentativa 3: 0.04
expectedAttempts = 1.24
```

---

## 17. Bottleneck detection

Criar `engine/bottlenecks.ts`.

Detectar gargalos com base em:

```txt
utilization >= 0.85
utilization >= 1.0
queueLength crescendo
droppedRate > 0
failedRate > 0
p95 > timeoutMs * 0.8
cache hitRate baixo em sistema read-heavy
database recebendo tráfego demais
queue backlog aumentando
external service failure alto
```

Tipo:

```ts
export type BottleneckSeverity = "info" | "warning" | "critical";

export interface Bottleneck {
  nodeId: string;
  severity: BottleneckSeverity;
  title: string;
  message: string;
  suggestion: string;
}
```

Exemplos de mensagens:

```txt
Database saturated
O banco está recebendo mais tráfego do que sua capacidade. Adicione cache, read replica ou reduza queries síncronas.

Queue backlog growing
A fila está recebendo mais mensagens do que os consumers conseguem processar. Aumente workers ou reduza a taxa de entrada.

Retry storm risk
Retries estão amplificando a carga. Considere backoff, jitter e circuit breaker.

Cache miss pressure
A taxa de cache miss está pressionando o banco. Aumente hitRate, TTL ou pré-aqueça o cache.
```

---

## 18. UI: layout geral

A tela principal deve ter:

```txt
+-----------------+------------------------------+----------------------+
| Palette         | Canvas                       | Inspector / Metrics  |
| Components      | React Flow                   | Selected Node        |
| Scenarios       | Nodes + Edges                | Metrics              |
| Toolbar         | Animated traffic             | Bottlenecks          |
+-----------------+------------------------------+----------------------+
```

### Sidebar esquerda

Componentes:

```txt
Client
Load Balancer
API Gateway
API Service
Cache
Database
Replicated DB
Message Queue
Worker
External Service
Circuit Breaker
AutoScaler
Shard Router
```

Cenários:

```txt
URL Shortener
Notification System
E-commerce Checkout
Chat System
File Processing
```

### Centro

Canvas com React Flow:

```txt
- drag/move nodes
- connect edges
- delete nodes/edges
- pan/zoom
- fit view
- animated edges
- status color por node
```

### Painel direito

Quando nenhum node está selecionado:

```txt
Global Metrics
Bottlenecks
Simulation Settings
```

Quando node selecionado:

```txt
Node Inspector
Node Metrics
Config Fields
```

---

## 19. Node visual

Criar `components/SimNode.tsx`.

Cada node deve mostrar:

```txt
Label
Kind
Status
Arrival RPS
Throughput RPS
Utilization %
P95 latency
Error rate
Queue size quando aplicável
```

Status:

```txt
healthy: utilization < 0.7 and errorRate low
warning: utilization >= 0.7 or p95 high
critical: utilization >= 1 or droppedRate > 0 or failedRate high
```

Cores sugeridas:

```txt
healthy: verde
warning: amarelo
critical: vermelho
idle: cinza
```

---

## 20. Edges visuais

As edges devem refletir `edgeFlow`.

Regras:

```ts
strokeWidth = clamp(2, 12, log10(edgeFlow + 1) * 3)
animated = edgeFlow > 0
```

Cores:

```txt
normal: slate
warning: amber
critical: red
```

Edge tooltip:

```txt
Flow: 1,250 req/s
Source: API
Target: Database
```

---

## 21. Inspector Panel

Campos editáveis por node:

### Comum

```txt
label
serviceTimeMs
concurrency
replicas
failureRate
timeoutMs
queueCapacity
latencyDistribution
latencyCv
```

### Client

```txt
baseRate
```

### API Gateway

```txt
rateLimit
```

### Cache

```txt
hitRate
ttlSeconds
```

### Database

```txt
writeFraction
```

### Replicated Database

```txt
replicaCount
writeFraction
replicationLagMs
```

### Message Queue

```txt
maxQueue
dequeueRate
```

### Load Balancer

```txt
strategy
weights
```

### Circuit Breaker

```txt
errorThreshold
resetTimeoutMs
```

### AutoScaler

```txt
targetUtilization
minReplicas
maxReplicas
```

### Shard Router

```txt
shardCount
skew
```

---

## 22. Toolbar

Criar `components/Toolbar.tsx`.

Botões:

```txt
Run
Pause
Step
Reset
Speed: 1x / 2x / 5x / 10x
Load multiplier
Save
Load
Export JSON
Import JSON
Auto Layout
Clear
```

---

## 23. Metrics Panel

Mostrar métricas globais:

```txt
Simulated time
Offered load
Throughput
Success rate
Error rate
Failed req/s
In-flight total
P50
P95
P99
Main bottleneck
```

Mostrar top nodes:

```txt
Highest utilization
Highest p95
Highest queue
Highest dropped rate
Highest failed rate
```

---

## 24. Cenários iniciais

Criar `engine/scenarios.ts`.

### 24.1 URL Shortener

Arquitetura:

```txt
Client -> Load Balancer -> API Service -> Cache -> Database
```

Config inicial:

```txt
Client baseRate: 10000 req/s
Load Balancer serviceTimeMs: 2
API Service serviceTimeMs: 30
API Service concurrency: 4
API Service replicas: 50
Cache hitRate: 0.8
Cache serviceTimeMs: 2
Cache concurrency: 64
Database serviceTimeMs: 15
Database concurrency: 8
```

Objetivo didático:

```txt
- mostrar que cache reduz pressão no banco
- mostrar que hitRate baixo satura DB
- mostrar que aumentar API não resolve DB bottleneck
- mostrar que subir hitRate para 0.95 reduz DB load
```

Validação esperada:

```txt
Com 10.000 RPS e hitRate 0.8:
- Cache recebe tráfego da API.
- Aproximadamente 80% termina no cache.
- Aproximadamente 20% segue para DB.
```

### 24.2 Notification System

Arquitetura:

```txt
Client -> API Service -> Message Queue -> Worker -> External Service
```

Config inicial:

```txt
Client baseRate: 5000 req/s
API capacity alta
Queue dequeueRate: 2000 msg/s
Worker capacity: 2000 jobs/s
External failureRate: 0.02
```

Objetivo didático:

```txt
- mostrar backlog crescendo quando entrada > consumo
- mostrar workers resolvendo backlog
- mostrar falha externa afetando success rate
- depois adicionar retry e DLQ
```

### 24.3 E-commerce Checkout

Arquitetura:

```txt
Client -> API Gateway -> API Service -> Database
                              -> Message Queue -> Worker -> External Payment
```

Objetivo didático:

```txt
- sync vs async
- dependência externa lenta
- circuit breaker
- retry storm
```

### 24.4 Chat System

Arquitetura:

```txt
Client -> Load Balancer -> API Service -> Message Queue -> Worker
                              -> Cache
                              -> Database
```

Objetivo didático:

```txt
- fan-out
- queue
- cache
- storage
```

---

## 25. Persistência local

Criar `persistence/local-storage.ts`.

Salvar:

```ts
interface SavedDesign {
  id: string;
  name: string;
  version: number;
  nodes: EditorNode[];
  edges: EditorEdge[];
  simulationSettings: SimulationSettings;
  createdAt: string;
  updatedAt: string;
}
```

Funcionalidades:

```txt
saveDesign
loadDesign
listDesigns
deleteDesign
exportJson
importJson
```

Usar LocalStorage no MVP.

---

## 26. Estado com Zustand

Criar `store/editor-store.ts`.

Estado:

```ts
interface EditorStore {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;

  addNode(kind: NodeKind): void;
  updateNodeConfig(id: string, patch: Partial<NodeConfig>): void;
  deleteNode(id: string): void;
  setNodes(nodes: Node[]): void;
  setEdges(edges: Edge[]): void;
  selectNode(id: string | null): void;
}
```

Criar `store/simulation-store.ts`.

Estado:

```ts
interface SimulationStore {
  running: boolean;
  speed: number;
  frame: SimulationFrame | null;
  history: SimulationFrame[];
  loadMultiplier: number;

  run(): void;
  pause(): void;
  step(): void;
  reset(): void;
  setSpeed(speed: number): void;
  setLoadMultiplier(multiplier: number): void;
}
```

---

## 27. Validação do grafo

Criar `utils/graph-validation.ts`.

Validar:

```txt
- precisa ter pelo menos um client
- não pode ter edge para node inexistente
- node sem saída é sink permitido
- cycles são permitidos, mas precisam de limite de iteração no solver
- ids devem ser únicos
```

Warnings:

```txt
No client node found
Node has no incoming traffic
Database directly exposed to client
Queue without consumer
Cache without downstream database
External service without circuit breaker
```

---

## 28. Chaos mode

Não obrigatório na primeira entrega, mas preparar estrutura.

Tipo:

```ts
export type ChaosEvent =
  | {
      type: "killNode";
      nodeId: string;
      startTime: number;
      durationSeconds: number;
    }
  | {
      type: "latencyInjection";
      nodeId: string;
      extraLatencyMs: number;
      startTime: number;
      durationSeconds: number;
    }
  | {
      type: "trafficSpike";
      multiplier: number;
      startTime: number;
      durationSeconds: number;
    }
  | {
      type: "failureInjection";
      nodeId: string;
      failureRate: number;
      startTime: number;
      durationSeconds: number;
    };
```

UI:

```txt
Kill selected node
Add DB latency
Spike traffic 10x
External service degraded
Recover all
```

---

## 29. Roadmap de implementação para o Codex

### Fase 1 — Base visual

Entregas:

```txt
- criar Vite React TS
- instalar dependências
- configurar Tailwind
- criar layout de 3 colunas
- adicionar React Flow
- criar Palette
- adicionar nodes
- conectar edges
- selecionar node
- deletar node/edge
```

Critério de aceite:

```txt
Consigo abrir o app, adicionar componentes no canvas, conectar e mover nodes.
```

---

### Fase 2 — Tipos e defaults

Entregas:

```txt
- criar engine/types.ts
- criar engine/defaults.ts
- criar node config por tipo
- criar SimNode exibindo label/kind/status
```

Critério de aceite:

```txt
Cada node criado tem configuração técnica padrão e renderização customizada.
```

---

### Fase 3 — Simulation engine simples

Entregas:

```txt
- criar simulator.ts
- criar queueing.ts básico
- criar routing.ts básico
- criar bottlenecks.ts básico
- implementar tick()
```

Critério de aceite:

```txt
Clicar Step gera SimulationFrame com métricas por node e edgeFlow.
```

---

### Fase 4 — UI conectada ao engine

Entregas:

```txt
- Run/Pause/Step/Reset
- edges animadas conforme flow
- node mostra utilization/throughput/p95
- MetricsPanel mostra métricas globais
- InspectorPanel edita config
```

Critério de aceite:

```txt
Alterar baseRate, capacity ou hitRate muda a simulação visualmente.
```

---

### Fase 5 — Cenário URL Shortener

Entregas:

```txt
- criar cenário inicial
- botão Load URL Shortener
- mostrar cache hit/miss
- mostrar DB bottleneck
```

Critério de aceite:

```txt
Ao reduzir hitRate, DB satura. Ao aumentar hitRate, DB melhora.
```

---

### Fase 6 — Queue + Worker

Entregas:

```txt
- criar messageQueue stateful
- criar worker processing
- criar Notification System scenario
- mostrar backlog
```

Critério de aceite:

```txt
Se input > dequeue/worker capacity, fila cresce. Ao aumentar workers, estabiliza.
```

---

### Fase 7 — Realismo matemático

Entregas:

```txt
- M/M/c
- Erlang-C
- Little's Law
- timeout failure
- retry amplification
- p50/p95/p99
```

Critério de aceite:

```txt
Latência cresce de forma não linear perto de 100% de utilização.
```

---

### Fase 8 — Chaos mode

Entregas:

```txt
- traffic spike
- kill node
- latency injection
- failure injection
```

Critério de aceite:

```txt
Ao degradar um node, throughput, erro e gargalos mudam claramente.
```

---

### Fase 9 — Persistência

Entregas:

```txt
- Save
- Load
- Export JSON
- Import JSON
- Reset to scenario
```

Critério de aceite:

```txt
Consigo fechar o navegador, abrir de novo e recuperar arquitetura.
```

---

## 30. Critérios gerais de qualidade

### Código

```txt
- TypeScript strict
- engine sem dependência de UI
- funções pequenas
- tipos explícitos
- evitar any
- testes no engine
```

### Performance

```txt
- não criar objeto por request
- simular por taxa agregada
- limitar histórico de frames
- não renderizar milhares de partículas
- usar React.memo em nodes
```

### UX

```txt
- feedback visual imediato
- configs simples
- métricas legíveis
- warnings explicativos
- cenário inicial pronto
```

---

## 31. Testes mínimos

Criar testes para:

```txt
queueing
capacity calculation
cache hit/miss
queue backlog
database saturation
bottleneck detection
retry amplification
scenario loading
graph validation
```

Exemplos:

```ts
it("cache forwards only misses downstream", () => {
  // 1000 RPS, hitRate 0.8 -> approx 200 RPS downstream
});

it("queue backlog grows when arrival exceeds dequeue rate", () => {
  // arrival 5000, dequeue 2000, dt 1s -> backlog +3000
});

it("latency increases near saturation", () => {
  // utilization 0.95 should produce much higher latency than 0.5
});
```

---

## 32. Requisitos de entrega final do MVP

O MVP estará pronto quando:

```txt
1. O app abre localmente.
2. O usuário consegue montar arquitetura.
3. O usuário consegue rodar simulação.
4. O tráfego aparece nas edges.
5. Cada node mostra métricas.
6. O painel global mostra throughput, erro e latência.
7. Gargalos são detectados.
8. URL Shortener scenario funciona.
9. Notification scenario funciona.
10. É possível salvar/carregar pelo LocalStorage.
```

---

## 33. Prompt principal para o Codex

Use este prompt no Codex:

```txt
Crie o projeto System Design Lab seguindo exatamente o arquivo SPEC.md.

O objetivo é um editor visual de system design com simulação matemática agregada de tráfego, inspirado no SystemEditor do Dinamos:
https://github.com/flaviojmendes/dinamos

Não implemente login, monetização, backend, Firebase, Stripe, OpenAI, game mode, ranking ou banco remoto.

Priorize:
1. Vite + React + TypeScript
2. @xyflow/react para canvas
3. engine separado da UI
4. simulação matemática por ticks
5. métricas por node
6. tráfego visual nas edges
7. gargalos
8. URL Shortener scenario
9. Notification System scenario
10. LocalStorage

Trabalhe em fases pequenas.
Depois de cada fase, rode typecheck/test/build e corrija erros.
Não crie código complexo antes da base visual funcionar.
Não copie partes desnecessárias do Dinamos.
```

---

## 34. Filosofia do projeto

Este projeto não precisa simular infraestrutura real.

Ele precisa simular bem as relações causais de system design:

```txt
mais tráfego -> mais utilização
mais utilização -> mais latência
capacidade insuficiente -> dropped/queue
fila crescendo -> atraso
cache hit alto -> DB protegido
cache hit baixo -> DB saturado
retry sem controle -> amplificação de carga
circuit breaker -> proteção contra cascata
autoscaling -> capacidade maior após delay
external service lento -> p95/p99 alto
```

Se o usuário conseguir ver essas relações no canvas, o projeto cumpriu seu objetivo.

---

## 35. Nome interno

Nome do projeto:

```txt
System Design Lab
```

Nome alternativo:

```txt
Architecture Traffic Simulator
```

Descrição curta:

```txt
A visual system design editor with mathematical traffic simulation.
```

Descrição em português:

```txt
Um editor visual de arquitetura de sistemas com simulação matemática de tráfego, gargalos, latência, filas, cache e falhas.
```
