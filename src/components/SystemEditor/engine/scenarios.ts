// Load profiles, chaos events and a library of preset topologies.

import { EdgeSpec, NodeConfig, defaultsForKind } from './types';

export type LoadProfileType = 'constant' | 'ramp' | 'spike' | 'diurnal' | 'step';

export interface LoadProfile {
  type: LoadProfileType;
  /** Multiplier applied to every client's base rate at time t (seconds). */
  multiplierAt: (t: number) => number;
  label: string;
}

export function makeLoadProfile(type: LoadProfileType): LoadProfile {
  switch (type) {
    case 'ramp':
      return {
        type,
        label: 'Ramp',
        // Linear ramp from 0.2x to 2x over 60s, then hold.
        multiplierAt: (t) => 0.2 + Math.min(1.8, (t / 60) * 1.8),
      };
    case 'spike':
      return {
        type,
        label: 'Spike',
        // Baseline 1x with a sharp 4x spike between 20s and 30s.
        multiplierAt: (t) => (t >= 20 && t <= 30 ? 4 : 1),
      };
    case 'diurnal':
      return {
        type,
        label: 'Diurnal',
        // Sine wave between 0.3x and 1.7x with a 120s period.
        multiplierAt: (t) => 1 + 0.7 * Math.sin((2 * Math.PI * t) / 120),
      };
    case 'step':
      return {
        type,
        label: 'Step',
        // Steps up every 30s: 1x, 2x, 3x, ...
        multiplierAt: (t) => 1 + Math.floor(t / 30),
      };
    case 'constant':
    default:
      return { type: 'constant', label: 'Constant', multiplierAt: () => 1 };
  }
}

export type ChaosType = 'killNode' | 'latencyInjection' | 'partition';

export interface ChaosEvent {
  id: string;
  type: ChaosType;
  targetId: string;
  startSec: number;
  durationSec: number;
  /** For latencyInjection: service-time multiplier. */
  magnitude?: number;
}

export function isChaosActive(event: ChaosEvent, t: number): boolean {
  return t >= event.startSec && t < event.startSec + event.durationSec;
}

export interface PresetNode {
  config: NodeConfig;
  position: { x: number; y: number };
}

export interface Preset {
  id: string;
  name: string;
  nodes: PresetNode[];
  edges: EdgeSpec[];
  seed: number;
}

function node(kind: Parameters<typeof defaultsForKind>[0], id: string, label: string, x: number, y: number, overrides: Partial<NodeConfig> = {}): PresetNode {
  return { config: { ...defaultsForKind(kind, id, label), ...overrides }, position: { x, y } };
}

function edge(source: string, target: string): EdgeSpec {
  return { id: `e-${source}-${target}`, source, target };
}

/** Three-tier web app: client -> LB -> servers -> database. */
function threeTier(): Preset {
  return {
    id: 'three-tier',
    name: 'Three-Tier Web App',
    seed: 1,
    nodes: [
      node('client', 'c1', 'Users', 400, 0, { baseRate: 120 }),
      node('loadBalancer', 'lb', 'Load Balancer', 400, 140),
      node('server', 's1', 'App Server 1', 200, 300, { replicas: 1 }),
      node('server', 's2', 'App Server 2', 600, 300, { replicas: 1 }),
      node('database', 'db', 'Database', 400, 460),
    ],
    edges: [edge('c1', 'lb'), edge('lb', 's1'), edge('lb', 's2'), edge('s1', 'db'), edge('s2', 'db')],
  };
}

/** Read-heavy app with a cache fronting the database. */
function readHeavyCache(): Preset {
  return {
    id: 'read-heavy-cache',
    name: 'Read-Heavy + Cache',
    seed: 2,
    nodes: [
      node('client', 'c1', 'Users', 400, 0, { baseRate: 300 }),
      node('apiGateway', 'gw', 'API Gateway', 400, 130, { rateLimit: 500 }),
      node('cache', 'cache', 'Cache', 400, 270, { hitRate: 0.85 }),
      node('server', 's1', 'App Server', 400, 410, { replicas: 2 }),
      node('database', 'db', 'Database', 400, 560),
    ],
    edges: [edge('c1', 'gw'), edge('gw', 'cache'), edge('cache', 's1'), edge('s1', 'db')],
  };
}

/** Event-driven pipeline with a buffering queue and a circuit breaker. */
function eventDriven(): Preset {
  return {
    id: 'event-driven',
    name: 'Event-Driven + Queue',
    seed: 3,
    nodes: [
      node('client', 'c1', 'Producers', 400, 0, { baseRate: 200 }),
      node('apiGateway', 'gw', 'Ingest API', 400, 130),
      node('messageQueue', 'q', 'Message Queue', 400, 270, { maxQueue: 2000, dequeueRate: 150 }),
      node('circuitBreaker', 'cb', 'Circuit Breaker', 400, 410),
      node('server', 'w', 'Worker Pool', 400, 550, { replicas: 3, serviceTimeMs: 40 }),
      node('externalDependency', 'ext', 'Payment API', 400, 700, { failureRate: 0.05 }),
    ],
    edges: [edge('c1', 'gw'), edge('gw', 'q'), edge('q', 'cb'), edge('cb', 'w'), edge('w', 'ext')],
  };
}

/** Sharded datastore behind a router. */
function shardedStore(): Preset {
  return {
    id: 'sharded-store',
    name: 'Sharded Datastore',
    seed: 4,
    nodes: [
      node('client', 'c1', 'Users', 400, 0, { baseRate: 400 }),
      node('loadBalancer', 'lb', 'Load Balancer', 400, 130),
      node('shardRouter', 'sr', 'Shard Router', 400, 270, { shardCount: 3, skew: 0.2 }),
      node('replicatedDb', 'db1', 'Shard A (replicated)', 150, 430, { replicaCount: 3 }),
      node('replicatedDb', 'db2', 'Shard B (replicated)', 400, 430, { replicaCount: 3 }),
      node('replicatedDb', 'db3', 'Shard C (replicated)', 650, 430, { replicaCount: 3 }),
    ],
    edges: [edge('c1', 'lb'), edge('lb', 'sr'), edge('sr', 'db1'), edge('sr', 'db2'), edge('sr', 'db3')],
  };
}

/** Autoscaling microservice mesh. */
function microserviceMesh(): Preset {
  return {
    id: 'microservice-mesh',
    name: 'Microservice Mesh',
    seed: 5,
    nodes: [
      node('client', 'c1', 'Clients', 400, 0, { baseRate: 250 }),
      node('apiGateway', 'gw', 'API Gateway', 400, 120),
      node('autoScaler', 'svcA', 'Service A (auto)', 200, 270, { targetUtilization: 0.7 }),
      node('autoScaler', 'svcB', 'Service B (auto)', 600, 270, { targetUtilization: 0.7 }),
      node('cache', 'cache', 'Shared Cache', 400, 420, { hitRate: 0.7 }),
      node('replicatedDb', 'db', 'Primary DB', 400, 560, { replicaCount: 2, consistency: 'quorum' }),
    ],
    edges: [
      edge('c1', 'gw'),
      edge('gw', 'svcA'),
      edge('gw', 'svcB'),
      edge('svcA', 'cache'),
      edge('svcB', 'cache'),
      edge('cache', 'db'),
    ],
  };
}

/** URL shortener: extremely read-heavy redirect path fronted by a hot cache. */
function urlShortener(): Preset {
  return {
    id: 'url-shortener',
    name: 'URL Shortener',
    seed: 6,
    nodes: [
      node('client', 'c1', 'Users', 400, 0, { baseRate: 500 }),
      node('apiGateway', 'gw', 'API Gateway', 400, 140, { rateLimit: 1500 }),
      node('cache', 'cache', 'Redirect Cache', 400, 280, { hitRate: 0.92, ttlSeconds: 300 }),
      node('autoScaler', 'app', 'Redirect Service', 400, 420, { targetUtilization: 0.7, serviceTimeMs: 12 }),
      node('replicatedDb', 'db', 'Key-Value Store', 400, 560, { replicaCount: 3, consistency: 'eventual', writeFraction: 0.05 }),
    ],
    edges: [edge('c1', 'gw'), edge('gw', 'cache'), edge('cache', 'app'), edge('app', 'db')],
  };
}

/** Ticket booking: spiky on-sale traffic, a waiting-room queue and payments. */
function ticketBooking(): Preset {
  return {
    id: 'ticket-booking',
    name: 'Ticket Booking Site',
    seed: 7,
    nodes: [
      node('client', 'c1', 'Fans', 400, 0, { baseRate: 600 }),
      node('loadBalancer', 'lb', 'Load Balancer', 400, 130),
      node('apiGateway', 'gw', 'API Gateway', 400, 270, { rateLimit: 400 }),
      node('messageQueue', 'q', 'Waiting Room', 400, 410, { maxQueue: 5000, dequeueRate: 200 }),
      node('server', 'app', 'Booking Service', 400, 550, { replicas: 3, serviceTimeMs: 35 }),
      node('database', 'db', 'Inventory DB', 200, 700, { writeFraction: 0.6, serviceTimeMs: 18 }),
      node('externalDependency', 'pay', 'Payment Gateway', 600, 700, { failureRate: 0.03, serviceTimeMs: 120 }),
    ],
    edges: [
      edge('c1', 'lb'),
      edge('lb', 'gw'),
      edge('gw', 'q'),
      edge('q', 'app'),
      edge('app', 'db'),
      edge('app', 'pay'),
    ],
  };
}

/** WhatsApp-style chat: persistent connections, fan-out bus and sharded store. */
function chatMessaging(): Preset {
  return {
    id: 'chat-messaging',
    name: 'Chat / Messaging (WhatsApp)',
    seed: 8,
    nodes: [
      node('client', 'c1', 'Devices', 400, 0, { baseRate: 450 }),
      node('loadBalancer', 'lb', 'Edge LB', 400, 130),
      node('autoScaler', 'gw', 'Chat Gateway', 400, 270, { targetUtilization: 0.65, serviceTimeMs: 8 }),
      node('cache', 'presence', 'Presence Cache', 130, 410, { hitRate: 0.8 }),
      node('messageQueue', 'q', 'Message Bus', 430, 410, { maxQueue: 10000, dequeueRate: 400 }),
      node('server', 'fan', 'Fan-out Workers', 430, 550, { replicas: 4, serviceTimeMs: 15 }),
      node('shardRouter', 'sr', 'Message Router', 430, 690, { shardCount: 6, skew: 0.15 }),
      node('replicatedDb', 'db', 'Message Store', 430, 830, { replicaCount: 3, consistency: 'eventual' }),
    ],
    edges: [
      edge('c1', 'lb'),
      edge('lb', 'gw'),
      edge('gw', 'presence'),
      edge('gw', 'q'),
      edge('q', 'fan'),
      edge('fan', 'sr'),
      edge('sr', 'db'),
    ],
  };
}

/** Social feed: fan-out on write plus a cache-fronted read path. */
function socialFeed(): Preset {
  return {
    id: 'social-feed',
    name: 'Social News Feed',
    seed: 9,
    nodes: [
      node('client', 'c1', 'Users', 400, 0, { baseRate: 400 }),
      node('apiGateway', 'gw', 'API Gateway', 400, 130, { rateLimit: 800 }),
      node('cache', 'feed', 'Feed Cache', 180, 290, { hitRate: 0.85 }),
      node('autoScaler', 'app', 'Feed Service', 620, 290, { targetUtilization: 0.7 }),
      node('messageQueue', 'q', 'Fan-out Queue', 620, 440, { maxQueue: 5000, dequeueRate: 250 }),
      node('server', 'w', 'Timeline Workers', 620, 590, { replicas: 3, serviceTimeMs: 25 }),
      node('replicatedDb', 'db', 'Posts DB', 400, 740, { replicaCount: 3, consistency: 'eventual' }),
    ],
    edges: [
      edge('c1', 'gw'),
      edge('gw', 'feed'),
      edge('gw', 'app'),
      edge('app', 'q'),
      edge('q', 'w'),
      edge('w', 'db'),
      edge('feed', 'db'),
    ],
  };
}

/**
 * Open Banking platform (Plaid / Belvo style).
 *
 * Two rate limiters in series illustrate the real problem:
 *   1. "Fraud Guard" caps how fast the fraud-scoring engine is called — even if
 *      the API scales horizontally you never want > 60 fraud checks/s because
 *      the engine is expensive and has an SLA cost per call.
 *   2. "Bank API Quota" enforces the contractual hard limit the bank imposes on
 *      external API calls (20 req/s). Anything above that gets dropped and must
 *      be retried later — or the account operation degrades gracefully.
 *
 * Load-balancer uses a 2:1 weight split so the cached (low-risk) path carries
 * ~200 req/s while only ~100 req/s go to fraud scoring.
 */
function openBankingRateLimiting(): Preset {
  return {
    id: 'open-banking-rate-limiting',
    name: 'Open Banking (Rate Limiting)',
    seed: 11,
    nodes: [
      node('client',              'c1',       'Mobile Apps',      400,  0,   { baseRate: 300 }),
      node('apiGateway',          'gw',       'API Gateway',      400,  130, { rateLimit: 600 }),
      node('loadBalancer',        'lb',       'Load Balancer',    400,  265),
      // ── fast path: serve balance from cache ──────────────────────────────
      node('cache',               'bal_cache','Balance Cache',    160,  410, { hitRate: 0.90, ttlSeconds: 30, serviceTimeMs: 2 }),
      node('database',            'accounts', 'Accounts DB',      160,  560, { serviceTimeMs: 12, concurrency: 20 }),
      // ── slow path: fraud check → bank API ────────────────────────────────
      node('rateLimiter',         'rl_fraud', 'Fraud Guard',      640,  410, { rateLimit: 60,  rejectBehavior: 'drop' }),
      node('autoScaler',          'fraud',    'Fraud Engine',     640,  560, { targetUtilization: 0.7, serviceTimeMs: 80, concurrency: 8 }),
      node('rateLimiter',         'rl_bank',  'Bank API Quota',   640,  710, { rateLimit: 20,  rejectBehavior: 'drop' }),
      node('externalDependency',  'bank_api', 'Bank Core API',    640,  860, { serviceTimeMs: 200, failureRate: 0.02, latencyCv: 1.2 }),
    ],
    edges: [
      edge('c1', 'gw'),
      edge('gw', 'lb'),
      // 2:1 weight → ~200 req/s to cache path, ~100 req/s to fraud path
      { id: 'e-lb-cache',  source: 'lb',    target: 'bal_cache', weight: 2 },
      { id: 'e-lb-fraud',  source: 'lb',    target: 'rl_fraud',  weight: 1 },
      edge('bal_cache', 'accounts'),
      edge('rl_fraud',  'fraud'),
      edge('fraud',     'rl_bank'),
      edge('rl_bank',   'bank_api'),
    ],
  };
}

/** Video streaming: CDN edge cache, metadata service and object storage. */
function videoStreaming(): Preset {
  return {
    id: 'video-streaming',
    name: 'Video Streaming',
    seed: 10,
    nodes: [
      node('client', 'c1', 'Viewers', 400, 0, { baseRate: 700 }),
      node('cache', 'cdn', 'CDN Edge', 400, 130, { hitRate: 0.95, ttlSeconds: 600 }),
      node('apiGateway', 'gw', 'API Gateway', 400, 280, { rateLimit: 1200 }),
      node('autoScaler', 'app', 'Streaming Service', 400, 420, { targetUtilization: 0.7 }),
      node('replicatedDb', 'meta', 'Metadata DB', 200, 570, { replicaCount: 3, consistency: 'eventual' }),
      node('externalDependency', 'store', 'Object Storage', 600, 570, { serviceTimeMs: 60, failureRate: 0.005 }),
    ],
    edges: [
      edge('c1', 'cdn'),
      edge('cdn', 'gw'),
      edge('gw', 'app'),
      edge('app', 'meta'),
      edge('app', 'store'),
    ],
  };
}

/**
 * Product page BFF (scatter-gather).
 *
 * A Backend-for-Frontend aggregates three downstream microservices in parallel
 * so the client receives a single composed response. The fanOut node waits for
 * ALL three (scatterK = 3 = wait-all), so end-to-end latency is dominated by
 * the slowest leg (InventoryService at ~50 ms). Try reducing scatterK to 2 in
 * the inspector — latency drops because the slowest reply is no longer required.
 *
 * Key lesson: scatter-gather tail latency = max of N legs, not the mean.
 * Every slow downstream inflates p99 for the whole response.
 */
function bffScatterGather(): Preset {
  return {
    id: 'bff-scatter-gather',
    name: 'BFF / Scatter-Gather',
    seed: 13,
    nodes: [
      node('client',     'c1',   'Mobile Clients',    400,   0,   { baseRate: 100 }),
      node('apiGateway', 'gw',   'API Gateway',       400,   130, { rateLimit: 300 }),
      node('server',     'bff',  'BFF Server',        400,   270, { replicas: 2, serviceTimeMs: 5, concurrency: 32 }),
      node('fanOut',     'fan',  'Scatter-Gather',    400,   420, { serviceTimeMs: 2, concurrency: 64 }),
      // ── leg 1: user profile ───────────────────────────────────────────────
      node('server',   'usvc',   'User Service',      130,   570, { replicas: 1, serviceTimeMs: 20, concurrency: 16 }),
      node('database', 'udb',    'User DB',           130,   720, { serviceTimeMs: 8 }),
      // ── leg 2: product catalog ────────────────────────────────────────────
      node('server',   'psvc',   'Product Service',   400,   570, { replicas: 1, serviceTimeMs: 30, concurrency: 16 }),
      node('database', 'pdb',    'Product DB',        400,   720, { serviceTimeMs: 12 }),
      // ── leg 3: real-time inventory ────────────────────────────────────────
      node('server',   'isvc',   'Inventory Service', 670,   570, { replicas: 1, serviceTimeMs: 50, concurrency: 16 }),
      node('database', 'idb',    'Inventory DB',      670,   720, { serviceTimeMs: 15, writeFraction: 0.3 }),
    ],
    edges: [
      edge('c1',   'gw'),
      edge('gw',   'bff'),
      edge('bff',  'fan'),
      edge('fan',  'usvc'),
      edge('fan',  'psvc'),
      edge('fan',  'isvc'),
      edge('usvc', 'udb'),
      edge('psvc', 'pdb'),
      edge('isvc', 'idb'),
    ],
  };
}

/**
 * E-commerce with Primary / Read-Replica split.
 *
 * Classic master/slave pattern: all writes go to the primary (strong
 * consistency, 3 replicas), all reads go through a cache and then to the
 * read-replica set (eventual consistency, 5 replicas).
 *
 * The weighted split on the app server edges (1:4) models a typical e-commerce
 * read/write ratio (~20% writes, ~80% reads). Try cranking up the load profile
 * to "Step" and watch the primary saturate first — the bottleneck lesson.
 */
function primaryReadReplica(): Preset {
  return {
    id: 'primary-read-replica',
    name: 'Primary / Read-Replica DB',
    seed: 12,
    nodes: [
      node('client',        'c1',       'Users',           400,   0,   { baseRate: 600 }),
      node('apiGateway',    'gw',       'API Gateway',     400,   130, { rateLimit: 900 }),
      node('autoScaler',    'app',      'App Service',     400,   280, {
        targetUtilization: 0.7,
        serviceTimeMs: 20,
        concurrency: 8,
        scaleUpCooldownSec: 30,
        scaleDownCooldownSec: 60,
      }),
      // ── write path (primary) ─────────────────────────────────────────────
      node('replicatedDb',  'primary',  'Primary DB',      140,   460, {
        replicaCount: 3,
        consistency: 'strong',
        writeFraction: 0.85,
        replicationLagMs: 10,
        serviceTimeMs: 18,
        concurrency: 12,
      }),
      // ── read path (cache + replicas) ─────────────────────────────────────
      node('cache',         'rcache',   'Read Cache',      660,   370, {
        hitRate: 0.72,
        ttlSeconds: 30,
        serviceTimeMs: 2,
        concurrency: 32,
      }),
      node('replicatedDb',  'replicas', 'Read Replicas',   660,   510, {
        replicaCount: 5,
        consistency: 'eventual',
        writeFraction: 0.05,
        replicationLagMs: 15,
        serviceTimeMs: 12,
        concurrency: 20,
      }),
    ],
    edges: [
      edge('c1',  'gw'),
      edge('gw',  'app'),
      // 1:4 weight → ~20% writes to primary, ~80% reads to cache
      { id: 'e-app-primary',  source: 'app', target: 'primary',  weight: 1 },
      { id: 'e-app-rcache',   source: 'app', target: 'rcache',   weight: 4 },
      edge('rcache', 'replicas'),
    ],
  };
}

export const PRESETS: Preset[] = [
  threeTier(),
  readHeavyCache(),
  eventDriven(),
  shardedStore(),
  microserviceMesh(),
  urlShortener(),
  ticketBooking(),
  chatMessaging(),
  socialFeed(),
  videoStreaming(),
  openBankingRateLimiting(),
  primaryReadReplica(),
  bffScatterGather(),
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
