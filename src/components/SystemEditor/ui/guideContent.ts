// Guide content in EN and PT. Technical param names (serviceTimeMs etc.) and
// mathematical notation stay in English as they reference actual code/formulas.

export interface NodeParam { name: string; type: string; def: string; desc: string }
export interface NodeContent { name: string; description: string; params: NodeParam[] }
export interface MetricRow { name: string; unit: string; desc: string }
export interface GoldenSignal { name: string; unit: string; color: string; desc: string }
export interface PercentileItem { label: string; color: string; desc: string }
export interface LoadProfile { name: string; color: string; shape: string; desc: string }
export interface ChaosEvent { type: string; icon: string; color: string; desc: string; params: string }
export interface StepItem { step: string; desc: string }

export interface GuideContent {
  tabs: { nodes: string; metrics: string; engine: string };
  back: string;
  tableHeaders: { param: string; unit: string; default: string; description: string };
  nodes: NodeContent[];
  metrics: {
    goldenTitle: string;
    goldenSignals: GoldenSignal[];
    perNodeTitle: string;
    perNodeRows: MetricRow[];
    percentilesTitle: string;
    percentilesIntro: string;
    percentilesItems: PercentileItem[];
    percentilesNote: string;
  };
  engine: {
    mmcTitle: string;
    mmcIntro: string;
    mmcVars: { sym: string; name: string; desc: string }[];
    mmcErlangTitle: string;
    mmcErlangDesc: string;
    mmcInsightTitle: string;
    mmcInsightText: string;
    fluidTitle: string;
    fluidP1: string;
    fluidP2: string;
    fluidNote: string;
    monteTitle: string;
    monteIntro: string;
    monteSteps: StepItem[];
    monteNote: string;
    profilesTitle: string;
    profiles: LoadProfile[];
    chaosTitle: string;
    chaosEvents: ChaosEvent[];
    edgeTitle: string;
    edgeIntro: string;
    edgeExamples: string[];
    edgeNote: string;
  };
}

export const GUIDE_EN: GuideContent = {
  tabs: { nodes: 'Nodes', metrics: 'Metrics', engine: 'Engine' },
  back: 'back',
  tableHeaders: { param: 'param', unit: 'unit', default: 'default', description: 'description' },
  nodes: [
    {
      name: 'Client',
      description: 'Traffic generator. Emits requests into the system at a configurable rate multiplied by the active load profile. Has no upstream — it is always the graph root.',
      params: [
        { name: 'baseRate', type: 'req/s', def: '50', desc: 'Requests per second before the load-profile multiplier is applied.' },
        { name: 'timeoutMs', type: 'ms', def: '2000', desc: 'Requests not answered within this time are counted as failures from the client perspective.' },
      ],
    },
    {
      name: 'Load Balancer',
      description: 'Distributes incoming traffic across all downstream nodes. Near-zero processing cost. Strategy controls how requests are assigned.',
      params: [
        { name: 'strategy', type: 'enum', def: 'roundRobin', desc: 'roundRobin — sequential rotation. weighted — uses edge weights. leastConn — prefer least-loaded downstream.' },
        { name: 'concurrency', type: 'threads', def: '16', desc: 'Parallel connections the balancer can hold open simultaneously.' },
        { name: 'serviceTimeMs', type: 'ms', def: '2', desc: 'Routing overhead per request.' },
        { name: 'replicas', type: 'count', def: '1', desc: 'Number of LB instances (active-active).' },
      ],
    },
    {
      name: 'API Gateway',
      description: 'Entry-point proxy that enforces a hard rate limit before forwarding. Requests above the limit are throttled and counted as failures. Supports fan-out to multiple downstreams.',
      params: [
        { name: 'rateLimit', type: 'req/s', def: '1000', desc: 'Hard ceiling. Requests above this rate are dropped immediately (not queued).' },
        { name: 'concurrency', type: 'threads', def: '16', desc: 'Parallel request slots for forwarding.' },
        { name: 'serviceTimeMs', type: 'ms', def: '5', desc: 'Overhead per request for auth, routing, transformations.' },
      ],
    },
    {
      name: 'Cache',
      description: 'Hit-rate based traffic terminator. A fraction hitRate of requests are served instantly without forwarding downstream. Cache misses are forwarded. Models Redis, Memcached, CDN edge caches.',
      params: [
        { name: 'hitRate', type: '0–1', def: '0.8', desc: 'Fraction of requests served from cache. 0.8 = 80% cache hits, 20% misses forwarded.' },
        { name: 'ttlSeconds', type: 's', def: '60', desc: 'Time-to-live per entry. Lower TTL implies the engine decays effective hit rate over time.' },
        { name: 'concurrency', type: 'threads', def: '32', desc: 'Parallel reads/writes the cache can serve simultaneously.' },
        { name: 'serviceTimeMs', type: 'ms', def: '2', desc: 'Lookup latency for a cache hit.' },
      ],
    },
    {
      name: 'Server',
      description: 'General-purpose worker modeled as an M/M/c queue. serviceTimeMs and concurrency × replicas are the two levers — lower service time or more servers to reduce utilization.',
      params: [
        { name: 'serviceTimeMs', type: 'ms', def: '30', desc: 'Mean time to process one request on one thread. Directly sets throughput ceiling per server.' },
        { name: 'concurrency', type: 'threads', def: '4', desc: 'Parallel workers per replica (the c in M/M/c). Effective servers = concurrency × replicas.' },
        { name: 'replicas', type: 'count', def: '1', desc: 'Number of identical instances running in parallel.' },
        { name: 'failureRate', type: '0–1', def: '0', desc: 'Intrinsic per-request failure probability under normal load (e.g. 0.01 = 1%).' },
        { name: 'timeoutMs', type: 'ms', def: '1000', desc: 'Requests that exceed this response time are counted as timed-out failures.' },
        { name: 'queueCapacity', type: 'reqs', def: '∞', desc: 'Bounded waiting room. Requests arriving when the queue is full are dropped.' },
        { name: 'latencyDistribution', type: 'enum', def: 'lognormal', desc: 'Shape for sampled latencies: lognormal (heavy-tailed, realistic), exponential (memoryless), uniform, constant.' },
        { name: 'latencyCv', type: 'ratio', def: '0.5', desc: 'Coefficient of variation for lognormal distribution. Higher = more variable / spiky latency.' },
      ],
    },
    {
      name: 'Auto-Scaler',
      description: 'Wraps a server with horizontal auto-scaling. Each tick it measures utilization and adds/removes replicas to hold the target. Models Kubernetes HPA or AWS ASG.',
      params: [
        { name: 'targetUtilization', type: '0–1', def: '0.7', desc: 'Scaler holds utilization near this value by adjusting replica count. 0.7 = 70% CPU target.' },
        { name: 'minReplicas', type: 'count', def: '1', desc: 'Floor for scaling down.' },
        { name: 'maxReplicas', type: 'count', def: '20', desc: 'Ceiling for scaling up.' },
        { name: 'serviceTimeMs', type: 'ms', def: '30', desc: 'Processing time per server, same as a regular Server node.' },
        { name: 'concurrency', type: 'threads', def: '4', desc: 'Parallel workers per replica.' },
      ],
    },
    {
      name: 'Circuit Breaker',
      description: 'Implements the closed → open → half-open state machine. When error rate exceeds errorThreshold the breaker trips open and fast-fails all requests. After resetTimeoutMs it probes with one request; if successful it closes again.',
      params: [
        { name: 'errorThreshold', type: '0–1', def: '0.5', desc: 'Error rate that trips the breaker open. 0.5 = breaker opens when 50% of requests fail.' },
        { name: 'resetTimeoutMs', type: 'ms', def: '5000', desc: 'How long the breaker stays open before transitioning to half-open.' },
        { name: 'concurrency', type: 'threads', def: '64', desc: 'Parallel pass-through slots when closed.' },
      ],
    },
    {
      name: 'Message Queue',
      description: 'Bounded buffer that decouples producers from consumers. Producers push at the arrival rate; consumers drain at dequeueRate. When the queue is full, excess messages are dropped.',
      params: [
        { name: 'maxQueue', type: 'msgs', def: '1000', desc: 'Maximum messages the queue can hold. When full, new arrivals are dropped.' },
        { name: 'dequeueRate', type: 'msgs/s', def: '100', desc: 'Consumer processing speed. If arrival > dequeueRate the queue grows.' },
      ],
    },
    {
      name: 'Shard Router',
      description: 'Routes requests to one of N shards using consistent hashing. The skew parameter simulates a hot-shard problem where one shard receives disproportionate traffic.',
      params: [
        { name: 'shardCount', type: 'count', def: '4', desc: 'Number of downstream shards. Each shard receives ~1/N of traffic (if skew = 0).' },
        { name: 'skew', type: '0–1', def: '0', desc: '0 = uniform distribution. 1 = all traffic on one shard. Models key-space skew in real workloads.' },
        { name: 'shardStrategy', type: 'enum', def: 'hash', desc: 'hash (consistent hashing), range (key ranges), directory (lookup table).' },
      ],
    },
    {
      name: 'Database',
      description: 'Single-node storage sink. Requests terminate here — no downstream. Typical bottleneck: concurrency is low, serviceTimeMs is high (disk I/O). The standard read/write endpoint.',
      params: [
        { name: 'serviceTimeMs', type: 'ms', def: '15', desc: 'Disk or network I/O time per query.' },
        { name: 'concurrency', type: 'threads', def: '8', desc: 'Parallel connections (e.g., max_connections in Postgres).' },
        { name: 'failureRate', type: '0–1', def: '0', desc: 'Per-query failure probability (deadlocks, constraint violations, etc.).' },
        { name: 'queueCapacity', type: 'reqs', def: '∞', desc: 'Connection pool size before queries are rejected.' },
      ],
    },
    {
      name: 'Replicated DB',
      description: 'Primary + N read replicas. Writes always go to the primary; reads distribute across all replicas. writeFraction models the workload mix. Consistency mode affects which nodes accept reads.',
      params: [
        { name: 'replicaCount', type: 'count', def: '3', desc: 'Total nodes including the primary. replicaCount=3 = 1 primary + 2 replicas.' },
        { name: 'writeFraction', type: '0–1', def: '0.2', desc: 'Fraction of operations that are writes. 0.2 = 20% writes, 80% reads spread across replicas.' },
        { name: 'consistency', type: 'enum', def: 'quorum', desc: 'eventual — reads from any replica. quorum — majority acknowledgement. strong — always from primary.' },
        { name: 'replicationLagMs', type: 'ms', def: '50', desc: 'Mean lag for replica sync. Higher lag = stale reads in eventual consistency mode.' },
      ],
    },
    {
      name: 'External Dependency',
      description: 'Third-party service with no downstream. High latencyCv (default 1.0) models the tail-latency behavior typical of external APIs, payment providers, or partner services. Failure rate simulates partial outages.',
      params: [
        { name: 'serviceTimeMs', type: 'ms', def: '80', desc: 'Mean response time of the external service.' },
        { name: 'latencyCv', type: 'ratio', def: '1.0', desc: 'Coefficient of variation. 1.0 = exponential tail (high variance). Use 0.3–0.5 for stable, 1.0–2.0 for flaky services.' },
        { name: 'failureRate', type: '0–1', def: '0.01', desc: 'Probability of any given request failing (timeout, 5xx). 0.01 = 1% SLA breach rate.' },
      ],
    },
    {
      name: 'Rate Limiter',
      description: 'Token-bucket rate limiter. Caps the request rate at rateLimit req/s anywhere in the graph — not just at the edge. Use it to protect internal services from upstream traffic bursts. Unlike API Gateway (which is an edge entry-point), Rate Limiter is a passthrough component you place on any internal edge.',
      params: [
        { name: 'rateLimit', type: 'req/s', def: '100', desc: 'Maximum sustained rate. Requests above this threshold are either dropped or queued depending on rejectBehavior.' },
        { name: 'burstCapacity', type: 'reqs', def: '200', desc: 'Token bucket size. When rejectBehavior=queue, excess is buffered here before being dropped. Has no effect in drop mode.' },
        { name: 'rejectBehavior', type: 'enum', def: 'drop', desc: 'drop — excess fails immediately (low latency, hard ceiling). queue — excess is buffered up to burstCapacity, then drained at rateLimit (adds latency but smooths bursts).' },
      ],
    },
  ],
  metrics: {
    goldenTitle: 'Golden Signals',
    goldenSignals: [
      { name: 'Throughput', unit: 'req/s', color: 'text-signal-green', desc: 'Successful requests per second flowing end-to-end through the system. The primary health signal — if it drops, something upstream is failing or saturated.' },
      { name: 'Error Rate', unit: '%', color: 'text-signal-red', desc: 'Fraction of offered load that fails. Aggregates intrinsic failures (failureRate), queue overflows (dropped), timeouts, and circuit-breaker rejections.' },
      { name: 'P95 Latency', unit: 'ms', color: 'text-signal-amber', desc: '95th-percentile end-to-end response time. 5% of requests are slower than this. Most SLOs target P95 or P99.' },
      { name: 'Saturation', unit: 'utilization', color: 'text-signal-cyan', desc: 'Maximum utilization across all nodes. >0.8 = warning zone. >1.0 = overloaded (queues grow unbounded, latency explodes).' },
    ],
    perNodeTitle: 'Per-Node Metrics',
    perNodeRows: [
      { name: 'arrivalRate', unit: 'req/s', desc: 'Offered load reaching this node, including retries from upstreams.' },
      { name: 'throughput', unit: 'req/s', desc: 'Requests successfully processed and forwarded or answered.' },
      { name: 'utilization (ρ)', unit: '0–∞', desc: 'ρ = λ / (c × μ). Below 1 = capacity available. Above 1 = overloaded. From M/M/c theory.' },
      { name: 'queueLength (Lq)', unit: 'reqs', desc: 'Mean number of requests waiting in queue. Comes from the Erlang-C formula.' },
      { name: 'waitMs (Wq)', unit: 'ms', desc: 'Mean time a request spends waiting before a server picks it up.' },
      { name: 'responseTimeMs', unit: 'ms', desc: 'Mean total time at this node = service time + wait time (W = S + Wq).' },
      { name: 'failedRate', unit: 'req/s', desc: 'Requests failing per second: intrinsic failures + overload + timeouts + breaker.' },
      { name: 'droppedRate', unit: 'req/s', desc: 'Requests dropped due to full queue (bounded capacity overflow).' },
      { name: 'retriedRate', unit: 'req/s', desc: "Extra attempts generated by this node's retry policy (amplifies upstream load)." },
      { name: 'p50 / p95 / p99', unit: 'ms', desc: 'Response-time percentiles from Monte Carlo sampling. Reflect real path latency through the graph.' },
      { name: 'servers', unit: 'count', desc: 'Active concurrent workers = concurrency × replicas.' },
      { name: 'cacheHits / cacheMisses', unit: 'req/s', desc: 'Cache-specific. Hits terminate at the cache; misses are forwarded downstream.' },
      { name: 'circuitState', unit: 'state', desc: 'Circuit breaker state: closed (normal), open (fast-failing), halfOpen (probing).' },
      { name: 'shardLoads', unit: 'array', desc: 'Per-shard traffic distribution. Non-uniform = hot-shard problem visible here.' },
    ],
    percentilesTitle: 'Latency Percentiles',
    percentilesIntro: 'Percentiles describe the distribution of response times. If your P95 is 200ms it means 95% of requests finish in under 200ms — and 5% take longer.',
    percentilesItems: [
      { label: 'P50', color: 'text-signal-green', desc: 'Median — half of requests are faster. Typical user experience under normal conditions.' },
      { label: 'P95', color: 'text-signal-amber', desc: 'Tail — the latency 5% of users experience. Target for SLOs in most production systems.' },
      { label: 'P99', color: 'text-signal-red', desc: 'Extreme tail — 1 in 100 requests. High P99 often indicates queue jitter, GC pauses, or cold starts.' },
    ],
    percentilesNote: 'A large P99–P50 gap (e.g. P50=10ms, P99=800ms) is a classic sign of queueing jitter — the system is near saturation and occasional bursts cause requests to queue for a long time.',
  },
  engine: {
    mmcTitle: 'M/M/c Queueing Theory',
    mmcIntro: 'Every node is modeled as an M/M/c queue — a mathematical model of a waiting line with Markovian arrivals (Poisson process) and Markovian service times (exponential distribution) with c parallel servers.',
    mmcVars: [
      { sym: 'λ (lambda)', name: 'Arrival rate', desc: 'Requests/s reaching the node. Set by the upstream flow.' },
      { sym: 'μ (mu)', name: 'Service rate', desc: '1000 / serviceTimeMs — requests one server can handle per second.' },
      { sym: 'c', name: 'Servers', desc: 'concurrency × replicas — total parallel workers.' },
      { sym: 'ρ (rho)', name: 'Utilization', desc: 'λ / (c × μ). The key number: ρ < 1 = stable, ρ ≥ 1 = overloaded.' },
    ],
    mmcErlangTitle: 'Erlang-C formula',
    mmcErlangDesc: 'The engine uses the Erlang-C formula to compute the probability that a request must wait (Pq), then derives mean queue length (Lq) and wait time (Wq) via Little\'s Law: L = λ × W. This is what fills the "Queue" and "Wait" metrics you see per node.',
    mmcInsightTitle: 'Key insight',
    mmcInsightText: 'At ρ = 0.5 queue is short. At ρ = 0.8 it grows 4×. At ρ = 0.95 it grows 20×. Latency is non-linear — a node running at 80% util has much shorter queues than one at 95%. This is why "add 20% more capacity" can cut your P99 in half.',
    fluidTitle: 'Fluid Solver (Gauss-Seidel)',
    fluidP1: 'Each simulation tick, the engine solves for steady-state flow rates across all edges. Starting from client emission rates, it propagates traffic downstream, respecting capacity limits at each node (cache hit termination, rate-limit throttling, queue overflow, etc.).',
    fluidP2: 'Gauss-Seidel iteration updates each node\'s throughput using the most recent values from its neighbours, repeating until the values converge. Cycles in the graph (e.g. retry loops) are detected with Tarjan\'s SCC algorithm — strongly-connected components are solved as a unit to avoid infinite loops.',
    fluidNote: 'Why "fluid"? Traffic is treated as a continuous rate (requests/second), not discrete packets. This allows microsecond-level tick resolution without simulating individual requests — making it fast enough to run in a browser at 10 ticks/second.',
    monteTitle: 'Monte Carlo Latency Tracing',
    monteIntro: 'The fluid solver gives you mean metrics (throughput, utilization, mean response time), but not percentiles. To get P50/P95/P99, the engine runs 2000 simulated request traces per tick using a seeded PRNG.',
    monteSteps: [
      { step: '1', desc: 'Each trace follows one random path through the graph, branching at each node based on edge weights.' },
      { step: '2', desc: "At each node on the path, it samples from the node's latency distribution (lognormal, exponential, etc.) scaled by actual utilization — higher utilization = longer tail." },
      { step: '3', desc: 'The trace accumulates total end-to-end latency. After 2000 traces, sorting the results gives P50/P95/P99.' },
    ],
    monteNote: 'The same seed produces the same traces every run — making results reproducible and comparable across topology changes.',
    profilesTitle: 'Load Profiles',
    profiles: [
      { name: 'Constant', color: 'text-signal-green', shape: '────────', desc: 'Steady 1× throughout. Best for steady-state analysis and baseline benchmarking.' },
      { name: 'Ramp', color: 'text-signal-cyan', shape: '╱‾‾‾‾‾‾', desc: '0.2× → 2× linearly over 60s, then holds. Reveals breaking point as load climbs.' },
      { name: 'Spike', color: 'text-signal-red', shape: '─╻‾╻─', desc: '1× baseline, sudden 4× burst from t=20s to t=30s. Tests recovery from flash traffic.' },
      { name: 'Diurnal', color: 'text-signal-amber', shape: '∿∿∿∿', desc: 'Sine 0.3× to 1.7×, 120s period. Models real day/night traffic patterns.' },
      { name: 'Step', color: 'text-tactical-text', shape: '──╻──╻──', desc: '+1× every 30s (1×, 2×, 3×…). Staircase load to locate the exact saturation point.' },
    ],
    chaosTitle: 'Chaos Events',
    chaosEvents: [
      { type: 'Kill Node', icon: '☠', color: 'text-signal-red', desc: "Sets the target node's failure rate to 1.0 for durationSec seconds. All requests through that node fail. Models a crashed pod, disk failure, or OOM kill.", params: 'target: any node · startSec · durationSec' },
      { type: 'Latency Injection', icon: '⏱', color: 'text-signal-amber', desc: "Multiplies the target node's serviceTimeMs by magnitude for durationSec seconds. High magnitude causes queue buildup and timeout cascades upstream. Models GC pauses, lock contention, or slow external calls.", params: 'target: any node · magnitude (multiplier) · startSec · durationSec' },
      { type: 'Network Partition', icon: '⚡', color: 'text-signal-cyan', desc: 'Drops all traffic on edges connected to the target node. Simulates a network split or firewall rule. Traffic that cannot reach the target is counted as failed.', params: 'target: any node · startSec · durationSec' },
    ],
    edgeTitle: 'Edge Weights',
    edgeIntro: 'Right-click any edge to set a relative traffic weight. Sibling edges (same source) are normalized to percentages automatically.',
    edgeExamples: ['Weights 1, 1 → 50% / 50% (equal split)', 'Weights 1, 3 → 25% / 75% (weighted split)', 'Weights 3, 1 → 75% / 25% (flipped)'],
    edgeNote: 'Use edge weights to model: primary/replica read routing (e.g. 80% reads to replica, 20% to primary), A/B traffic splits, or explicit read/write separation through a Replicated DB.',
  },
};

export const GUIDE_PT: GuideContent = {
  tabs: { nodes: 'Nós', metrics: 'Métricas', engine: 'Motor' },
  back: 'voltar',
  tableHeaders: { param: 'parâmetro', unit: 'unidade', default: 'padrão', description: 'descrição' },
  nodes: [
    {
      name: 'Cliente',
      description: 'Gerador de tráfego. Emite requisições no sistema a uma taxa configurável multiplicada pelo perfil de carga ativo. Não tem upstream — é sempre a raiz do grafo.',
      params: [
        { name: 'baseRate', type: 'req/s', def: '50', desc: 'Requisições por segundo antes do multiplicador do perfil de carga ser aplicado.' },
        { name: 'timeoutMs', type: 'ms', def: '2000', desc: 'Requisições não respondidas dentro deste tempo são contadas como falhas pela perspectiva do cliente.' },
      ],
    },
    {
      name: 'Balanceador de Carga',
      description: 'Distribui o tráfego recebido entre todos os nós downstream. Custo de processamento quase zero. A estratégia controla como as requisições são distribuídas.',
      params: [
        { name: 'strategy', type: 'enum', def: 'roundRobin', desc: 'roundRobin — rotação sequencial. weighted — usa pesos das conexões. leastConn — prefere o downstream menos carregado.' },
        { name: 'concurrency', type: 'threads', def: '16', desc: 'Conexões paralelas que o balanceador pode manter abertas simultaneamente.' },
        { name: 'serviceTimeMs', type: 'ms', def: '2', desc: 'Overhead de roteamento por requisição.' },
        { name: 'replicas', type: 'count', def: '1', desc: 'Número de instâncias do LB (ativo-ativo).' },
      ],
    },
    {
      name: 'API Gateway',
      description: 'Proxy de entrada que aplica um limite de taxa antes de encaminhar. Requisições acima do limite são descartadas e contadas como falhas. Suporta fan-out para múltiplos downstreams.',
      params: [
        { name: 'rateLimit', type: 'req/s', def: '1000', desc: 'Teto absoluto. Requisições acima desta taxa são descartadas imediatamente (não enfileiradas).' },
        { name: 'concurrency', type: 'threads', def: '16', desc: 'Slots de requisição paralela para encaminhamento.' },
        { name: 'serviceTimeMs', type: 'ms', def: '5', desc: 'Overhead por requisição para autenticação, roteamento e transformações.' },
      ],
    },
    {
      name: 'Cache',
      description: 'Terminador de tráfego baseado em taxa de hit. Uma fração hitRate das requisições é servida instantaneamente sem encaminhar downstream. Cache misses são encaminhados. Modela Redis, Memcached, CDN.',
      params: [
        { name: 'hitRate', type: '0–1', def: '0.8', desc: 'Fração de requisições servidas do cache. 0.8 = 80% de cache hits, 20% de misses encaminhados.' },
        { name: 'ttlSeconds', type: 's', def: '60', desc: 'Tempo de vida por entrada. TTL menor implica decaimento da taxa de hit efetiva ao longo do tempo.' },
        { name: 'concurrency', type: 'threads', def: '32', desc: 'Leituras/escritas paralelas que o cache pode servir simultaneamente.' },
        { name: 'serviceTimeMs', type: 'ms', def: '2', desc: 'Latência de consulta para um cache hit.' },
      ],
    },
    {
      name: 'Servidor',
      description: 'Trabalhador de uso geral modelado como fila M/M/c. serviceTimeMs e concurrency × replicas são as duas alavancas — menor tempo de serviço ou mais servidores para reduzir a utilização.',
      params: [
        { name: 'serviceTimeMs', type: 'ms', def: '30', desc: 'Tempo médio para processar uma requisição em uma thread. Define diretamente o teto de throughput por servidor.' },
        { name: 'concurrency', type: 'threads', def: '4', desc: 'Trabalhadores paralelos por réplica (o c no M/M/c). Servidores efetivos = concurrency × replicas.' },
        { name: 'replicas', type: 'count', def: '1', desc: 'Número de instâncias idênticas rodando em paralelo.' },
        { name: 'failureRate', type: '0–1', def: '0', desc: 'Probabilidade intrínseca de falha por requisição sob carga normal (ex: 0.01 = 1%).' },
        { name: 'timeoutMs', type: 'ms', def: '1000', desc: 'Requisições que excedem este tempo de resposta são contadas como falhas por timeout.' },
        { name: 'queueCapacity', type: 'reqs', def: '∞', desc: 'Sala de espera limitada. Requisições que chegam com a fila cheia são descartadas.' },
        { name: 'latencyDistribution', type: 'enum', def: 'lognormal', desc: 'Forma para latências amostradas: lognormal (cauda pesada, realista), exponential (sem memória), uniform, constant.' },
        { name: 'latencyCv', type: 'ratio', def: '0.5', desc: 'Coeficiente de variação para distribuição log-normal. Maior = latência mais variável / espigada.' },
      ],
    },
    {
      name: 'Auto-Escalador',
      description: 'Envolve um servidor com escalonamento horizontal automático. A cada tick mede a utilização e adiciona/remove réplicas para manter a meta. Modela Kubernetes HPA ou AWS ASG.',
      params: [
        { name: 'targetUtilization', type: '0–1', def: '0.7', desc: 'O escalador mantém a utilização próxima deste valor ajustando a contagem de réplicas. 0.7 = meta de 70% de CPU.' },
        { name: 'minReplicas', type: 'count', def: '1', desc: 'Piso para redução de escala.' },
        { name: 'maxReplicas', type: 'count', def: '20', desc: 'Teto para aumento de escala.' },
        { name: 'serviceTimeMs', type: 'ms', def: '30', desc: 'Tempo de processamento por servidor, igual ao nó Servidor regular.' },
        { name: 'concurrency', type: 'threads', def: '4', desc: 'Trabalhadores paralelos por réplica.' },
      ],
    },
    {
      name: 'Circuit Breaker',
      description: 'Implementa a máquina de estados fechado → aberto → meio-aberto. Quando a taxa de erro excede errorThreshold o breaker dispara e rejeita todas as requisições (fast-fail). Após resetTimeoutMs, sonda com uma requisição; se bem-sucedida, fecha novamente.',
      params: [
        { name: 'errorThreshold', type: '0–1', def: '0.5', desc: 'Taxa de erro que abre o breaker. 0.5 = breaker abre quando 50% das requisições falham.' },
        { name: 'resetTimeoutMs', type: 'ms', def: '5000', desc: 'Quanto tempo o breaker fica aberto antes de transicionar para meio-aberto.' },
        { name: 'concurrency', type: 'threads', def: '64', desc: 'Slots de passagem paralela quando fechado.' },
      ],
    },
    {
      name: 'Fila de Mensagens',
      description: 'Buffer limitado que desacopla produtores de consumidores. Produtores empurram na taxa de chegada; consumidores drenam em dequeueRate. Quando a fila está cheia, o excesso é descartado.',
      params: [
        { name: 'maxQueue', type: 'msgs', def: '1000', desc: 'Máximo de mensagens que a fila suporta. Quando cheia, novas chegadas são descartadas.' },
        { name: 'dequeueRate', type: 'msgs/s', def: '100', desc: 'Velocidade de processamento do consumidor. Se chegada > dequeueRate a fila cresce.' },
      ],
    },
    {
      name: 'Roteador de Shard',
      description: 'Roteia requisições para um dos N shards usando hash consistente. O parâmetro skew simula o problema de hot-shard onde um shard recebe tráfego desproporcional.',
      params: [
        { name: 'shardCount', type: 'count', def: '4', desc: 'Número de shards downstream. Cada shard recebe ~1/N do tráfego (se skew = 0).' },
        { name: 'skew', type: '0–1', def: '0', desc: '0 = distribuição uniforme. 1 = todo tráfego em um shard. Modela desbalanceamento de espaço de chaves.' },
        { name: 'shardStrategy', type: 'enum', def: 'hash', desc: 'hash (hash consistente), range (intervalos de chave), directory (tabela de lookup).' },
      ],
    },
    {
      name: 'Banco de Dados',
      description: 'Sink de armazenamento de nó único. Requisições terminam aqui — sem downstream. Gargalo típico: concorrência baixa, serviceTimeMs alto (I/O de disco). O endpoint padrão de leitura/escrita.',
      params: [
        { name: 'serviceTimeMs', type: 'ms', def: '15', desc: 'Tempo de I/O de disco ou rede por consulta.' },
        { name: 'concurrency', type: 'threads', def: '8', desc: 'Conexões paralelas (ex: max_connections no Postgres).' },
        { name: 'failureRate', type: '0–1', def: '0', desc: 'Probabilidade de falha por consulta (deadlocks, violações de constraints, etc.).' },
        { name: 'queueCapacity', type: 'reqs', def: '∞', desc: 'Tamanho do pool de conexões antes de rejeitar consultas.' },
      ],
    },
    {
      name: 'BD Replicado',
      description: 'Primário + N réplicas de leitura. Escritas sempre vão para o primário; leituras distribuem por todas as réplicas. writeFraction modela o mix de carga. O modo de consistência afeta quais nós aceitam leituras.',
      params: [
        { name: 'replicaCount', type: 'count', def: '3', desc: 'Total de nós incluindo o primário. replicaCount=3 = 1 primário + 2 réplicas.' },
        { name: 'writeFraction', type: '0–1', def: '0.2', desc: 'Fração das operações que são escritas. 0.2 = 20% escritas, 80% leituras distribuídas nas réplicas.' },
        { name: 'consistency', type: 'enum', def: 'quorum', desc: 'eventual — leituras de qualquer réplica. quorum — confirmação por maioria. strong — sempre do primário.' },
        { name: 'replicationLagMs', type: 'ms', def: '50', desc: 'Lag médio de sincronização de réplica. Lag maior = leituras obsoletas no modo eventual.' },
      ],
    },
    {
      name: 'Dep. Externa',
      description: 'Serviço de terceiros sem downstream. latencyCv alto (padrão 1.0) modela o comportamento de tail-latency típico de APIs externas, provedores de pagamento ou serviços parceiros. Taxa de falha simula interrupções parciais.',
      params: [
        { name: 'serviceTimeMs', type: 'ms', def: '80', desc: 'Tempo médio de resposta do serviço externo.' },
        { name: 'latencyCv', type: 'ratio', def: '1.0', desc: 'Coeficiente de variação. 1.0 = cauda exponencial (alta variância). Use 0.3–0.5 para estável, 1.0–2.0 para instável.' },
        { name: 'failureRate', type: '0–1', def: '0.01', desc: 'Probabilidade de qualquer requisição falhar (timeout, 5xx). 0.01 = taxa de violação de SLA de 1%.' },
      ],
    },
    {
      name: 'Rate Limiter',
      description: 'Rate limiter com token bucket. Limita a taxa de requisições em rateLimit req/s em qualquer ponto do grafo — não só na borda. Use para proteger serviços internos de rajadas de upstream. Diferente do API Gateway (que é um ponto de entrada), o Rate Limiter é um componente de passagem que você coloca em qualquer conexão interna.',
      params: [
        { name: 'rateLimit', type: 'req/s', def: '100', desc: 'Taxa máxima sustentada. Requisições acima desse limite são descartadas ou enfileiradas dependendo de rejectBehavior.' },
        { name: 'burstCapacity', type: 'reqs', def: '200', desc: 'Tamanho do token bucket. Quando rejectBehavior=queue, o excesso é bufferizado aqui antes de ser descartado. Sem efeito no modo drop.' },
        { name: 'rejectBehavior', type: 'enum', def: 'drop', desc: 'drop — excesso falha imediatamente (baixa latência, teto rígido). queue — excesso é bufferizado até burstCapacity, depois drenado em rateLimit (adiciona latência mas suaviza rajadas).' },
      ],
    },
  ],
  metrics: {
    goldenTitle: 'Sinais Dourados',
    goldenSignals: [
      { name: 'Vazão', unit: 'req/s', color: 'text-signal-green', desc: 'Requisições bem-sucedidas por segundo fluindo de ponta a ponta. O principal sinal de saúde — se cair, algo upstream está falhando ou saturado.' },
      { name: 'Taxa de Erro', unit: '%', color: 'text-signal-red', desc: 'Fração da carga oferecida que falha. Agrega falhas intrínsecas (failureRate), estouros de fila (dropped), timeouts e rejeições do circuit breaker.' },
      { name: 'Latência P95', unit: 'ms', color: 'text-signal-amber', desc: 'Tempo de resposta ponta-a-ponta no percentil 95. 5% das requisições são mais lentas que isso. A maioria dos SLOs tem P95 ou P99 como alvo.' },
      { name: 'Saturação', unit: 'utilização', color: 'text-signal-cyan', desc: 'Utilização máxima entre todos os nós. >0.8 = zona de alerta. >1.0 = sobrecarregado (filas crescem sem limite, latência explode).' },
    ],
    perNodeTitle: 'Métricas por Nó',
    perNodeRows: [
      { name: 'arrivalRate', unit: 'req/s', desc: 'Carga oferecida chegando neste nó, incluindo tentativas repetidas de upstreams.' },
      { name: 'throughput', unit: 'req/s', desc: 'Requisições processadas com sucesso e encaminhadas ou respondidas.' },
      { name: 'utilização (ρ)', unit: '0–∞', desc: 'ρ = λ / (c × μ). Abaixo de 1 = capacidade disponível. Acima de 1 = sobrecarregado. Teoria M/M/c.' },
      { name: 'queueLength (Lq)', unit: 'reqs', desc: 'Número médio de requisições esperando na fila. Calculado pela fórmula de Erlang-C.' },
      { name: 'waitMs (Wq)', unit: 'ms', desc: 'Tempo médio que uma requisição espera antes de um servidor pegá-la.' },
      { name: 'responseTimeMs', unit: 'ms', desc: 'Tempo total médio neste nó = tempo de serviço + tempo de espera (W = S + Wq).' },
      { name: 'failedRate', unit: 'req/s', desc: 'Requisições falhando por segundo: falhas intrínsecas + sobrecarga + timeouts + breaker.' },
      { name: 'droppedRate', unit: 'req/s', desc: 'Requisições descartadas por fila cheia (estouro de capacidade limitada).' },
      { name: 'retriedRate', unit: 'req/s', desc: 'Tentativas extras geradas pela política de retry deste nó (amplifica a carga upstream).' },
      { name: 'p50 / p95 / p99', unit: 'ms', desc: 'Percentis de tempo de resposta por amostragem Monte Carlo. Refletem a latência real do caminho pelo grafo.' },
      { name: 'servers', unit: 'count', desc: 'Trabalhadores concorrentes ativos = concurrency × replicas.' },
      { name: 'cacheHits / cacheMisses', unit: 'req/s', desc: 'Específico de cache. Hits terminam no cache; misses são encaminhados downstream.' },
      { name: 'circuitState', unit: 'estado', desc: 'Estado do circuit breaker: closed (normal), open (fast-failing), halfOpen (sondando).' },
      { name: 'shardLoads', unit: 'array', desc: 'Distribuição de tráfego por shard. Não-uniforme = problema de hot-shard visível aqui.' },
    ],
    percentilesTitle: 'Percentis de Latência',
    percentilesIntro: 'Percentis descrevem a distribuição dos tempos de resposta. Se seu P95 é 200ms significa que 95% das requisições terminam em menos de 200ms — e 5% levam mais.',
    percentilesItems: [
      { label: 'P50', color: 'text-signal-green', desc: 'Mediana — metade das requisições são mais rápidas. Experiência típica do usuário em condições normais.' },
      { label: 'P95', color: 'text-signal-amber', desc: 'Cauda — a latência que 5% dos usuários experimentam. Alvo para SLOs na maioria dos sistemas em produção.' },
      { label: 'P99', color: 'text-signal-red', desc: 'Cauda extrema — 1 em 100 requisições. P99 alto geralmente indica jitter de fila, pausas de GC ou cold starts.' },
    ],
    percentilesNote: 'Um gap grande entre P99 e P50 (ex: P50=10ms, P99=800ms) é sinal clássico de jitter de fila — o sistema está próximo da saturação e rajadas ocasionais fazem requisições esperarem muito na fila.',
  },
  engine: {
    mmcTitle: 'Teoria de Filas M/M/c',
    mmcIntro: 'Cada nó é modelado como uma fila M/M/c — um modelo matemático de linha de espera com chegadas Markovianas (processo de Poisson) e tempos de serviço Markovianos (distribuição exponencial) com c servidores paralelos.',
    mmcVars: [
      { sym: 'λ (lambda)', name: 'Taxa de chegada', desc: 'Requisições/s chegando ao nó. Definida pelo fluxo upstream.' },
      { sym: 'μ (mu)', name: 'Taxa de serviço', desc: '1000 / serviceTimeMs — requisições que um servidor consegue atender por segundo.' },
      { sym: 'c', name: 'Servidores', desc: 'concurrency × replicas — total de trabalhadores paralelos.' },
      { sym: 'ρ (rho)', name: 'Utilização', desc: 'λ / (c × μ). O número chave: ρ < 1 = estável, ρ ≥ 1 = sobrecarregado.' },
    ],
    mmcErlangTitle: 'Fórmula de Erlang-C',
    mmcErlangDesc: "O motor usa a fórmula de Erlang-C para calcular a probabilidade de uma requisição ter que esperar (Pq), depois deriva o comprimento médio da fila (Lq) e o tempo de espera (Wq) pela Lei de Little: L = λ × W. Isso preenche as métricas de \"Fila\" e \"Espera\" que você vê por nó.",
    mmcInsightTitle: 'Insight chave',
    mmcInsightText: 'Com ρ = 0.5 a fila é curta. Com ρ = 0.8 cresce 4×. Com ρ = 0.95 cresce 20×. A latência é não-linear — um nó rodando a 80% de utilização tem filas muito menores do que um a 95%. É por isso que "adicionar 20% mais capacidade" pode reduzir seu P99 pela metade.',
    fluidTitle: 'Solver Fluido (Gauss-Seidel)',
    fluidP1: 'A cada tick de simulação, o motor resolve as taxas de fluxo em estado estacionário por todas as conexões. Partindo das taxas de emissão dos clientes, propaga o tráfego downstream respeitando os limites de capacidade em cada nó (terminação por cache hit, throttling de rate limit, estouro de fila, etc.).',
    fluidP2: 'A iteração de Gauss-Seidel atualiza o throughput de cada nó usando os valores mais recentes de seus vizinhos, repetindo até convergir. Ciclos no grafo (ex: loops de retry) são detectados com o algoritmo de Tarjan SCC — componentes fortemente conectados são resolvidos como uma unidade para evitar loops infinitos.',
    fluidNote: 'Por que "fluido"? O tráfego é tratado como uma taxa contínua (requisições/segundo), não pacotes discretos. Isso permite resolução de tick em nível de microssegundos sem simular requisições individuais — tornando-o rápido o suficiente para rodar em um browser a 10 ticks/segundo.',
    monteTitle: 'Rastreamento de Latência Monte Carlo',
    monteIntro: 'O solver fluido fornece métricas médias (throughput, utilização, tempo médio de resposta), mas não percentis. Para obter P50/P95/P99, o motor roda 2000 traces de requisições simuladas por tick usando um PRNG com seed.',
    monteSteps: [
      { step: '1', desc: 'Cada trace segue um caminho aleatório pelo grafo, ramificando em cada nó baseado nos pesos das conexões.' },
      { step: '2', desc: 'Em cada nó do caminho, amostra da distribuição de latência do nó (lognormal, exponencial, etc.) escalonada pela utilização real — maior utilização = cauda mais longa.' },
      { step: '3', desc: 'O trace acumula a latência total ponta-a-ponta. Após 2000 traces, ordenar os resultados dá P50/P95/P99.' },
    ],
    monteNote: 'O mesmo seed produz os mesmos traces em toda execução — tornando os resultados reproduzíveis e comparáveis entre mudanças de topologia.',
    profilesTitle: 'Perfis de Carga',
    profiles: [
      { name: 'Constante', color: 'text-signal-green', shape: '────────', desc: '1× constante. Melhor para análise de estado estacionário e benchmarking de baseline.' },
      { name: 'Rampa', color: 'text-signal-cyan', shape: '╱‾‾‾‾‾‾', desc: '0.2× → 2× linearmente em 60s, depois mantém. Revela o ponto de ruptura à medida que a carga aumenta.' },
      { name: 'Pico', color: 'text-signal-red', shape: '─╻‾╻─', desc: '1× de baseline, rajada súbita de 4× de t=20s a t=30s. Testa recuperação de tráfego flash.' },
      { name: 'Diurno', color: 'text-signal-amber', shape: '∿∿∿∿', desc: 'Senoide 0.3× a 1.7×, período de 120s. Modela padrões reais de tráfego dia/noite.' },
      { name: 'Degrau', color: 'text-tactical-text', shape: '──╻──╻──', desc: '+1× a cada 30s (1×, 2×, 3×…). Carga em escada para localizar o ponto exato de saturação.' },
    ],
    chaosTitle: 'Eventos de Caos',
    chaosEvents: [
      { type: 'Matar Nó', icon: '☠', color: 'text-signal-red', desc: 'Define a taxa de falha do nó alvo para 1.0 por durationSec segundos. Todas as requisições através daquele nó falham. Modela um pod travado, falha de disco ou OOM kill.', params: 'alvo: qualquer nó · startSec · durationSec' },
      { type: 'Injeção de Latência', icon: '⏱', color: 'text-signal-amber', desc: 'Multiplica o serviceTimeMs do nó alvo por magnitude durante durationSec segundos. Magnitude alta causa acúmulo de fila e cascatas de timeout upstream. Modela pausas de GC, contenção de lock ou chamadas externas lentas.', params: 'alvo: qualquer nó · magnitude (multiplicador) · startSec · durationSec' },
      { type: 'Partição de Rede', icon: '⚡', color: 'text-signal-cyan', desc: 'Descarta todo tráfego nas conexões do nó alvo. Simula uma divisão de rede ou regra de firewall. Tráfego que não consegue alcançar o alvo é contado como falha.', params: 'alvo: qualquer nó · startSec · durationSec' },
    ],
    edgeTitle: 'Pesos de Conexão',
    edgeIntro: 'Clique com o botão direito em qualquer conexão para definir um peso relativo de tráfego. Conexões irmãs (mesma origem) são normalizadas para percentuais automaticamente.',
    edgeExamples: ['Pesos 1, 1 → 50% / 50% (divisão igual)', 'Pesos 1, 3 → 25% / 75% (divisão ponderada)', 'Pesos 3, 1 → 75% / 25% (invertido)'],
    edgeNote: 'Use pesos de conexão para modelar: roteamento de leitura primário/réplica (ex: 80% leituras para réplica, 20% para primário), divisões A/B de tráfego ou separação explícita de leitura/escrita pelo BD Replicado.',
  },
};
