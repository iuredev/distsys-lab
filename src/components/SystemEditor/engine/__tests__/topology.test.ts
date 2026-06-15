import { describe, it, expect } from 'vitest';
import { buildTopology, validateTopology } from '../topology';
import { defaultsForKind, EdgeSpec, NodeConfig } from '../types';

function node(kind: Parameters<typeof defaultsForKind>[0], id: string): NodeConfig {
  return defaultsForKind(kind, id, id);
}

function edge(id: string, source: string, target: string): EdgeSpec {
  return { id, source, target };
}

describe('buildTopology', () => {
  it('builds adjacency lists', () => {
    const nodes = [node('client', 'c'), node('server', 's')];
    const edges = [edge('e1', 'c', 's')];
    const topo = buildTopology(nodes, edges);
    expect(topo.outgoing.get('c')).toHaveLength(1);
    expect(topo.incoming.get('s')).toHaveLength(1);
    expect(topo.outgoing.get('s')).toHaveLength(0);
    expect(topo.incoming.get('c')).toHaveLength(0);
  });

  it('ignores edges whose source or target is not in node list', () => {
    const nodes = [node('server', 'a')];
    const edges = [edge('e1', 'a', 'missing'), edge('e2', 'also-missing', 'a')];
    const topo = buildTopology(nodes, edges);
    expect(topo.outgoing.get('a')).toHaveLength(0);
    expect(topo.incoming.get('a')).toHaveLength(0);
  });

  it('identifies sources and sinks', () => {
    const nodes = [node('client', 'c'), node('server', 's'), node('database', 'db')];
    const edges = [edge('e1', 'c', 's'), edge('e2', 's', 'db')];
    const topo = buildTopology(nodes, edges);
    expect(topo.sources).toContain('c');
    expect(topo.sinks).toContain('db');
    expect(topo.sources).not.toContain('s');
    expect(topo.sinks).not.toContain('s');
  });

  it('detects a two-node cycle as a cyclic SCC', () => {
    const nodes = [node('server', 'a'), node('server', 'b')];
    const edges = [edge('e1', 'a', 'b'), edge('e2', 'b', 'a')];
    const topo = buildTopology(nodes, edges);
    expect(topo.cyclicSccs.size).toBeGreaterThan(0);
  });

  it('detects a self-loop as a cyclic SCC', () => {
    const nodes = [node('server', 'a')];
    const edges = [edge('e1', 'a', 'a')];
    const topo = buildTopology(nodes, edges);
    expect(topo.cyclicSccs.size).toBe(1);
  });

  it('acyclic chain produces no cyclic SCCs', () => {
    const nodes = [node('client', 'c'), node('server', 's'), node('database', 'db')];
    const edges = [edge('e1', 'c', 's'), edge('e2', 's', 'db')];
    const topo = buildTopology(nodes, edges);
    expect(topo.cyclicSccs.size).toBe(0);
  });

  it('sccOf maps each node to a valid SCC index', () => {
    const nodes = [node('client', 'c'), node('server', 's')];
    const topo = buildTopology(nodes, []);
    nodes.forEach((n) => {
      const idx = topo.sccOf.get(n.id)!;
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(topo.sccs.length);
    });
  });
});

describe('validateTopology', () => {
  it('warns NO_CLIENT when no client node exists', () => {
    const nodes = [node('server', 's')];
    const topo = buildTopology(nodes, []);
    const warnings = validateTopology(nodes, [], topo);
    expect(warnings).toContain('NO_CLIENT');
  });

  it('does not warn NO_CLIENT when a client exists', () => {
    const nodes = [node('client', 'c')];
    const topo = buildTopology(nodes, []);
    const warnings = validateTopology(nodes, [], topo);
    expect(warnings).not.toContain('NO_CLIENT');
  });

  it('warns DISCONNECTED for non-client nodes with no edges', () => {
    const nodes = [node('client', 'c'), node('server', 's')];
    const topo = buildTopology(nodes, []);
    const warnings = validateTopology(nodes, [], topo);
    expect(warnings.some((w) => w.startsWith('DISCONNECTED'))).toBe(true);
  });

  it('no DISCONNECTED warning for connected nodes', () => {
    const nodes = [node('client', 'c'), node('server', 's')];
    const edges = [edge('e1', 'c', 's')];
    const topo = buildTopology(nodes, edges);
    const warnings = validateTopology(nodes, edges, topo);
    expect(warnings.some((w) => w.startsWith('DISCONNECTED'))).toBe(false);
  });
});
