// Cost model. Instead of a flat per-node price, cost is driven by the simulated
// workload: provisioned compute (servers/replicas) plus usage-based charges
// (requests through gateways/queues, calls to external dependencies).
//
// When a node has an explicit `instanceType`, cost = catalog price × replicas.
// Otherwise it falls back to the service-time-derived heuristic.

import { NodeRuntime } from './fluidSolver';
import { NodeKind } from './types';

export type CloudProvider = 'aws' | 'gcp';

export type InstanceCategory = 'compute' | 'database' | 'cache';

export interface InstanceSpec {
  id: string;
  pricePerHour: number;
  vcpu: number;
  memoryGb: number;
  /** Relative CPU/IO performance vs baseline (t3.medium / n2-standard-2 = 1.0). Scales mu in the solver. */
  cpuFactor: number;
}

export const INSTANCE_CATALOG: Record<InstanceCategory, Record<CloudProvider, InstanceSpec[]>> = {
  compute: {
    aws: [
      { id: 't3.micro',    pricePerHour: 0.0104, vcpu: 2,  memoryGb: 1,  cpuFactor: 0.4  },
      { id: 't3.medium',   pricePerHour: 0.0416, vcpu: 2,  memoryGb: 4,  cpuFactor: 1.0  },
      { id: 'c5.large',    pricePerHour: 0.085,  vcpu: 2,  memoryGb: 4,  cpuFactor: 1.4  },
      { id: 'c5.xlarge',   pricePerHour: 0.170,  vcpu: 4,  memoryGb: 8,  cpuFactor: 2.8  },
      { id: 'c5.2xlarge',  pricePerHour: 0.340,  vcpu: 8,  memoryGb: 16, cpuFactor: 5.5  },
      { id: 'm5.4xlarge',  pricePerHour: 0.768,  vcpu: 16, memoryGb: 64, cpuFactor: 12.0 },
    ],
    gcp: [
      { id: 'e2-micro',        pricePerHour: 0.0084, vcpu: 2,  memoryGb: 1,  cpuFactor: 0.3  },
      { id: 'n2-standard-2',   pricePerHour: 0.0971, vcpu: 2,  memoryGb: 8,  cpuFactor: 1.0  },
      { id: 'n2-standard-4',   pricePerHour: 0.1942, vcpu: 4,  memoryGb: 16, cpuFactor: 2.5  },
      { id: 'c2-standard-4',   pricePerHour: 0.2088, vcpu: 4,  memoryGb: 16, cpuFactor: 3.5  },
      { id: 'n2-standard-8',   pricePerHour: 0.3884, vcpu: 8,  memoryGb: 32, cpuFactor: 5.0  },
      { id: 'n2-standard-16',  pricePerHour: 0.7768, vcpu: 16, memoryGb: 64, cpuFactor: 10.0 },
    ],
  },
  database: {
    aws: [
      { id: 'db.t3.micro',   pricePerHour: 0.017,  vcpu: 2, memoryGb: 1,  cpuFactor: 0.4 },
      { id: 'db.t3.medium',  pricePerHour: 0.068,  vcpu: 2, memoryGb: 4,  cpuFactor: 1.0 },
      { id: 'db.m5.large',   pricePerHour: 0.192,  vcpu: 2, memoryGb: 8,  cpuFactor: 1.5 },
      { id: 'db.m5.xlarge',  pricePerHour: 0.384,  vcpu: 4, memoryGb: 16, cpuFactor: 3.0 },
      { id: 'db.r5.large',   pricePerHour: 0.240,  vcpu: 2, memoryGb: 16, cpuFactor: 1.6 },
      { id: 'db.r5.xlarge',  pricePerHour: 0.480,  vcpu: 4, memoryGb: 32, cpuFactor: 3.2 },
    ],
    gcp: [
      { id: 'db-n1-standard-1', pricePerHour: 0.0648, vcpu: 1, memoryGb: 3.75, cpuFactor: 0.5 },
      { id: 'db-n1-standard-2', pricePerHour: 0.1297, vcpu: 2, memoryGb: 7.5,  cpuFactor: 1.0 },
      { id: 'db-n1-standard-4', pricePerHour: 0.2594, vcpu: 4, memoryGb: 15,   cpuFactor: 2.0 },
      { id: 'db-n1-highmem-4',  pricePerHour: 0.3588, vcpu: 4, memoryGb: 26,   cpuFactor: 2.5 },
      { id: 'db-n1-standard-8', pricePerHour: 0.5187, vcpu: 8, memoryGb: 30,   cpuFactor: 4.0 },
    ],
  },
  cache: {
    aws: [
      { id: 'cache.t3.micro',    pricePerHour: 0.017,  vcpu: 2, memoryGb: 0.5, cpuFactor: 0.3 },
      { id: 'cache.r6g.large',   pricePerHour: 0.166,  vcpu: 2, memoryGb: 13,  cpuFactor: 1.0 },
      { id: 'cache.r6g.xlarge',  pricePerHour: 0.332,  vcpu: 4, memoryGb: 26,  cpuFactor: 2.0 },
      { id: 'cache.r6g.2xlarge', pricePerHour: 0.664,  vcpu: 8, memoryGb: 52,  cpuFactor: 4.0 },
    ],
    // GCP Memorystore for Redis — Basic tier, us-central1 ($0.016/GB/hr).
    // vCPU is not exposed by Memorystore; values here approximate concurrent-connection capacity.
    gcp: [
      { id: 'redis-basic-1gb',  pricePerHour: 0.016, vcpu: 1, memoryGb: 1,  cpuFactor: 0.3 },
      { id: 'redis-basic-13gb', pricePerHour: 0.208, vcpu: 4, memoryGb: 13, cpuFactor: 1.0 },
      { id: 'redis-basic-26gb', pricePerHour: 0.416, vcpu: 6, memoryGb: 26, cpuFactor: 2.0 },
      { id: 'redis-basic-52gb', pricePerHour: 0.832, vcpu: 8, memoryGb: 52, cpuFactor: 4.0 },
    ],
  },
};

/** Flat id → cpuFactor lookup used by the solver (IDs are unique across providers). */
export const INSTANCE_CPU_FACTOR: Record<string, number> = Object.values(INSTANCE_CATALOG)
  .flatMap((byProvider) => Object.values(byProvider).flat())
  .reduce<Record<string, number>>((acc, s) => { acc[s.id] = s.cpuFactor; return acc; }, {});

export function instanceCategory(kind: NodeKind): InstanceCategory | null {
  if (kind === 'server' || kind === 'autoScaler' || kind === 'fanOut') return 'compute';
  if (kind === 'database' || kind === 'replicatedDb') return 'database';
  if (kind === 'cache') return 'cache';
  return null;
}

export function lookupInstance(kind: NodeKind, instanceType: string, provider: CloudProvider): InstanceSpec | undefined {
  const cat = instanceCategory(kind);
  if (!cat) return undefined;
  return INSTANCE_CATALOG[cat][provider].find((s) => s.id === instanceType);
}

interface Rates {
  /** USD/server-hour for compute-style nodes (fallback when no instanceType). */
  serverHour: number;
  /** USD/replica-hour for database-style nodes (fallback when no instanceType). */
  dbReplicaHour: number;
  /** USD/million requests for API Gateway. */
  apiGatewayPerMillion: number;
  /** USD/million messages for message queues. */
  messageQueuePerMillion: number;
  /** USD/million requests for CDN edge hits+misses. */
  cdnPerMillion: number;
  /** USD/million calls to external dependencies (proxy for egress cost). */
  externalPerMillion: number;
}

const RATES: Record<CloudProvider, Rates> = {
  aws: {
    serverHour: 0.0416,            // t3.medium baseline
    dbReplicaHour: 0.136,
    apiGatewayPerMillion: 1.00,    // HTTP API ($1.00/M); REST API is $3.50/M
    messageQueuePerMillion: 0.40,  // SQS standard queue
    cdnPerMillion: 1.00,           // CloudFront HTTP requests
    externalPerMillion: 5.0,
  },
  gcp: {
    serverHour: 0.0971,            // n2-standard-2 baseline (fixed: was 0.0395)
    dbReplicaHour: 0.128,
    apiGatewayPerMillion: 3.00,    // Cloud Endpoints ($3.00/M)
    messageQueuePerMillion: 0.04,  // Pub/Sub (~$0.04/GB; ~1 KB/msg → $0.04/M msgs)
    cdnPerMillion: 0.75,           // Cloud CDN ($0.0075/10K = $0.75/M)
    externalPerMillion: 4.5,
  },
};

const COMPUTE_KINDS: NodeKind[] = [
  'server',
  'autoScaler',
  'loadBalancer',
  'cache',
  'circuitBreaker',
  'shardRouter',
  'fanOut',
];

/**
 * Reference service time (ms) that maps to a "1x" priced instance. Provisioning
 * a faster server (lower service time) needs beefier/more expensive compute, so
 * cost scales with how much faster than this baseline the node runs.
 */
const SERVICE_TIME_BASELINE_MS = 20;

/**
 * Compute price premium driven by per-request service time. A node that serves
 * requests faster than the baseline is treated as a more powerful (pricier)
 * instance; a slower one is cheaper. Clamped so the curve stays sane at the
 * extremes (e.g. 1ms caches don't cost 20x, 500ms externals don't go to zero).
 */
export function serviceTimePremium(serviceTimeMs: number): number {
  if (!serviceTimeMs || serviceTimeMs <= 0) return 4; // "instant" => max-tier compute
  const ratio = SERVICE_TIME_BASELINE_MS / serviceTimeMs;
  return Math.min(4, Math.max(0.4, ratio));
}

function computeCostPerHour(
  kind: NodeKind,
  servers: number,
  serviceTimeMs: number,
  replicaCountForDb: number | undefined,
  rates: Rates,
): number {
  const premium = serviceTimePremium(serviceTimeMs);
  if (COMPUTE_KINDS.includes(kind)) {
    return Math.max(0, servers) * rates.serverHour * premium;
  }
  if (kind === 'database' || kind === 'replicatedDb') {
    const replicas = kind === 'replicatedDb' ? replicaCountForDb ?? 1 : 1;
    return Math.max(1, replicas) * rates.dbReplicaHour * premium;
  }
  return 0;
}

export function estimateNodeCostPerHour(rt: NodeRuntime, provider: CloudProvider = 'aws'): number {
  const rates = RATES[provider];
  const kind = rt.cfg.kind;

  // Explicit instance type → catalog price × instance count (ignores threads).
  if (rt.cfg.instanceType) {
    const spec = lookupInstance(kind, rt.cfg.instanceType, provider);
    if (spec) {
      const cat = instanceCategory(kind);
      const count = cat === 'database'
        ? (kind === 'replicatedDb' ? Math.max(1, rt.cfg.replicaCount ?? 1) : 1)
        : Math.max(1, rt.replicas); // rt.replicas reflects autoscaler override; cfg.replicas is the static config
      return spec.pricePerHour * count;
    }
  }

  if (COMPUTE_KINDS.includes(kind) || kind === 'database' || kind === 'replicatedDb') {
    return computeCostPerHour(kind, rt.servers, rt.cfg.serviceTimeMs, rt.cfg.replicaCount, rates);
  }

  const reqPerHour = rt.arrival * 3600;
  if (kind === 'apiGateway')   return (reqPerHour / 1_000_000) * rates.apiGatewayPerMillion;
  if (kind === 'messageQueue') return (reqPerHour / 1_000_000) * rates.messageQueuePerMillion;
  if (kind === 'cdn')          return (reqPerHour / 1_000_000) * rates.cdnPerMillion;
  if (kind === 'externalDependency') return (reqPerHour / 1_000_000) * rates.externalPerMillion;

  return 0;
}

export function providerLabel(provider: CloudProvider): string {
  return provider === 'aws' ? 'AWS' : 'Google Cloud';
}

export function estimateCostFromMetrics(
  kind: NodeKind,
  servers: number,
  arrivalPerSec: number,
  replicaCount: number | undefined,
  provider: CloudProvider,
  serviceTimeMs = SERVICE_TIME_BASELINE_MS,
  instanceType?: string,
  replicas?: number,
): number {
  // Explicit instance type → catalog price × instance count.
  if (instanceType) {
    const spec = lookupInstance(kind, instanceType, provider);
    if (spec) {
      const cat = instanceCategory(kind);
      const count = cat === 'database'
        ? (kind === 'replicatedDb' ? Math.max(1, replicaCount ?? 1) : 1)
        : Math.max(1, replicas ?? 1);
      return spec.pricePerHour * count;
    }
  }

  const rates = RATES[provider];
  if (COMPUTE_KINDS.includes(kind) || kind === 'database' || kind === 'replicatedDb') {
    return computeCostPerHour(kind, servers, serviceTimeMs, replicaCount, rates);
  }

  const reqPerHour = arrivalPerSec * 3600;
  if (kind === 'apiGateway')   return (reqPerHour / 1_000_000) * rates.apiGatewayPerMillion;
  if (kind === 'messageQueue') return (reqPerHour / 1_000_000) * rates.messageQueuePerMillion;
  if (kind === 'cdn')          return (reqPerHour / 1_000_000) * rates.cdnPerMillion;
  if (kind === 'externalDependency') return (reqPerHour / 1_000_000) * rates.externalPerMillion;

  return 0;
}

/** Marketing name of the cloud product a node maps to, per provider. */
export function productName(kind: NodeKind, provider: CloudProvider): string {
  const aws = provider === 'aws';
  switch (kind) {
    case 'server':             return aws ? 'EC2' : 'Compute Engine';
    case 'autoScaler':         return aws ? 'EC2 Auto Scaling' : 'Managed Instance Group';
    case 'loadBalancer':       return aws ? 'Elastic Load Balancing' : 'Cloud Load Balancing';
    case 'cache':              return aws ? 'ElastiCache' : 'Memorystore';
    case 'circuitBreaker':     return aws ? 'App Mesh' : 'Traffic Director';
    case 'shardRouter':        return aws ? 'EC2 (sharding)' : 'Compute Engine (sharding)';
    case 'database':           return aws ? 'RDS' : 'Cloud SQL';
    case 'replicatedDb':       return aws ? 'RDS Multi-AZ' : 'Cloud SQL HA';
    case 'apiGateway':         return aws ? 'API Gateway' : 'Cloud Endpoints';
    case 'cdn':                return aws ? 'CloudFront' : 'Cloud CDN';
    case 'messageQueue':       return aws ? 'SQS' : 'Pub/Sub';
    case 'externalDependency': return aws ? 'Third-party API' : 'Third-party API';
    case 'fanOut': return aws ? 'EC2 (aggregator)' : 'Compute Engine (aggregator)';
    default:                   return aws ? 'AWS' : 'GCP';
  }
}
