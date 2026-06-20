import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Users, Network, Shield, HardDrive, Server, Database as DatabaseIcon, Layers, Split, MessageSquare, Zap, TrendingUp, Globe, Gauge, type LucideIcon } from 'lucide-react';
import { GUIDE_EN, GUIDE_PT, type GuideContent } from './guideContent';

// Visual-only metadata — icons and kind hex colors, not translated
const NODE_META: { icon: LucideIcon; hex: string }[] = [
  { icon: Users,        hex: '#3b82f6' },
  { icon: Network,      hex: '#22c55e' },
  { icon: Shield,       hex: '#6366f1' },
  { icon: HardDrive,    hex: '#ec4899' },
  { icon: Server,       hex: '#a855f7' },
  { icon: TrendingUp,   hex: '#06b6d4' },
  { icon: Zap,          hex: '#ef4444' },
  { icon: MessageSquare,hex: '#f97316' },
  { icon: Split,        hex: '#14b8a6' },
  { icon: DatabaseIcon, hex: '#eab308' },
  { icon: Layers,       hex: '#f59e0b' },
  { icon: Globe,        hex: '#94a3b8' },
  { icon: Gauge,        hex: '#84cc16' },
];

// ── helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-tactical-line" />
        <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-tactical-label">{title}</span>
        <div className="h-px flex-1 bg-tactical-line" />
      </div>
      {children}
    </div>
  );
}

function ParamRow({ name, type, def, desc }: { name: string; type: string; def?: string; desc: string }) {
  return (
    <tr className="border-b border-tactical-line/50">
      <td className="py-1.5 pr-3 font-mono text-[11px] text-signal-cyan whitespace-nowrap">{name}</td>
      <td className="py-1.5 pr-3 font-mono text-[10px] text-tactical-label whitespace-nowrap">{type}</td>
      {def !== undefined && <td className="py-1.5 pr-4 font-mono text-[10px] text-tactical-dim whitespace-nowrap">{def}</td>}
      <td className="py-1.5 font-sans text-[12px] text-tactical-text leading-relaxed">{desc}</td>
    </tr>
  );
}

// ── tabs ─────────────────────────────────────────────────────────────────────

function NodesTab({ c }: { c: GuideContent }) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {c.nodes.map((nd, i) => {
        const { icon: Icon, hex } = NODE_META[i] ?? { icon: Server, hex: '#64748b' };
        const open = active === nd.name;
        return (
          <div key={nd.name} className="bg-tactical-raised border border-tactical-border rounded-lg overflow-hidden">
            <button
              onClick={() => setActive(open ? null : nd.name)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-tactical-line/30 transition-colors"
            >
              <div className="w-7 h-7 rounded flex items-center justify-center bg-tactical-surface border shrink-0" style={{ borderColor: hex + '4d' }}>
                <Icon className="w-3.5 h-3.5" style={{ color: hex }} />
              </div>
              <span className="font-mono text-[13px] text-tactical-text font-medium">{nd.name}</span>
              <span className="font-sans text-[11px] text-tactical-dim flex-1 truncate hidden sm:block">{nd.description.slice(0, 90)}…</span>
              <span className={`font-mono text-[11px] text-tactical-label transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {open && (
              <div className="border-t border-tactical-border px-4 py-4">
                <p className="font-sans text-[13px] text-tactical-text leading-relaxed mb-4">{nd.description}</p>
                <div className="label-mono mb-2">{c.tableHeaders.param}</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-tactical-border">
                        <th className="pb-1.5 pr-3 font-mono text-[10px] text-tactical-label uppercase tracking-wider">{c.tableHeaders.param}</th>
                        <th className="pb-1.5 pr-3 font-mono text-[10px] text-tactical-label uppercase tracking-wider">{c.tableHeaders.unit}</th>
                        <th className="pb-1.5 pr-4 font-mono text-[10px] text-tactical-label uppercase tracking-wider">{c.tableHeaders.default}</th>
                        <th className="pb-1.5 font-mono text-[10px] text-tactical-label uppercase tracking-wider">{c.tableHeaders.description}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nd.params.map((p) => (
                        <ParamRow key={p.name} name={p.name} type={p.type} def={p.def} desc={p.desc} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MetricsTab({ c }: { c: GuideContent }) {
  const m = c.metrics;
  return (
    <div>
      <Section title={m.goldenTitle}>
        <div className="grid gap-3 sm:grid-cols-2">
          {m.goldenSignals.map((sig) => (
            <div key={sig.name} className="bg-tactical-raised border border-tactical-border rounded-lg p-4">
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className={`font-mono text-[13px] font-bold ${sig.color}`}>{sig.name}</span>
                <span className="font-mono text-[10px] text-tactical-label">{sig.unit}</span>
              </div>
              <p className="font-sans text-[12px] text-tactical-dim leading-relaxed">{sig.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title={m.perNodeTitle}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-tactical-border">
                <th className="pb-2 pr-4 font-mono text-[10px] text-tactical-label uppercase tracking-wider">{c.tableHeaders.param}</th>
                <th className="pb-2 pr-4 font-mono text-[10px] text-tactical-label uppercase tracking-wider">{c.tableHeaders.unit}</th>
                <th className="pb-2 font-mono text-[10px] text-tactical-label uppercase tracking-wider">{c.tableHeaders.description}</th>
              </tr>
            </thead>
            <tbody>
              {m.perNodeRows.map((r) => (
                <tr key={r.name} className="border-b border-tactical-line/50">
                  <td className="py-1.5 pr-4 font-mono text-[11px] text-signal-cyan whitespace-nowrap">{r.name}</td>
                  <td className="py-1.5 pr-4 font-mono text-[10px] text-tactical-label whitespace-nowrap">{r.unit}</td>
                  <td className="py-1.5 font-sans text-[12px] text-tactical-text leading-relaxed">{r.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title={m.percentilesTitle}>
        <div className="bg-tactical-raised border border-tactical-border rounded-lg p-4 space-y-3">
          <p className="font-sans text-[13px] text-tactical-text leading-relaxed">{m.percentilesIntro}</p>
          <div className="font-mono text-[11px] text-tactical-dim space-y-1">
            {m.percentilesItems.map((item) => (
              <div key={item.label}>
                <span className={`${item.color} mr-2`}>{item.label}</span>
                {item.desc}
              </div>
            ))}
          </div>
          <p className="font-sans text-[12px] text-tactical-dim leading-relaxed">{m.percentilesNote}</p>
        </div>
      </Section>
    </div>
  );
}

function EngineTab({ c }: { c: GuideContent }) {
  const e = c.engine;
  return (
    <div>
      <Section title={e.mmcTitle}>
        <div className="bg-tactical-raised border border-tactical-border rounded-lg p-4 space-y-3">
          <p className="font-sans text-[13px] text-tactical-text leading-relaxed">{e.mmcIntro}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {e.mmcVars.map((item) => (
              <div key={item.sym} className="bg-tactical-surface border border-tactical-border rounded p-3">
                <div className="font-mono text-[12px] text-signal-cyan mb-0.5">{item.sym}</div>
                <div className="font-mono text-[11px] text-tactical-text mb-1">{item.name}</div>
                <div className="font-sans text-[11px] text-tactical-dim">{item.desc}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-tactical-border pt-3">
            <div className="label-mono mb-2">{e.mmcErlangTitle}</div>
            <p className="font-sans text-[12px] text-tactical-dim leading-relaxed">{e.mmcErlangDesc}</p>
          </div>
          <div className="bg-tactical-bg border border-tactical-border rounded p-3">
            <div className="font-mono text-[11px] text-tactical-label mb-1">{e.mmcInsightTitle}</div>
            <p className="font-sans text-[12px] text-tactical-text">{e.mmcInsightText}</p>
          </div>
        </div>
      </Section>

      <Section title={e.fluidTitle}>
        <div className="bg-tactical-raised border border-tactical-border rounded-lg p-4 space-y-3">
          <p className="font-sans text-[13px] text-tactical-text leading-relaxed">{e.fluidP1}</p>
          <p className="font-sans text-[12px] text-tactical-dim leading-relaxed">{e.fluidP2}</p>
          <div className="font-mono text-[11px] text-tactical-label">{e.fluidNote}</div>
        </div>
      </Section>

      <Section title={e.monteTitle}>
        <div className="bg-tactical-raised border border-tactical-border rounded-lg p-4 space-y-3">
          <p className="font-sans text-[13px] text-tactical-text leading-relaxed">{e.monteIntro}</p>
          <div className="space-y-2">
            {e.monteSteps.map((s) => (
              <div key={s.step} className="flex gap-3">
                <span className="font-mono text-[11px] text-signal-cyan shrink-0 mt-0.5">{s.step}.</span>
                <p className="font-sans text-[12px] text-tactical-dim leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="font-mono text-[11px] text-tactical-label">{e.monteNote}</div>
        </div>
      </Section>

      <Section title={e.profilesTitle}>
        <div className="grid sm:grid-cols-2 gap-3">
          {e.profiles.map((p) => (
            <div key={p.name} className="bg-tactical-raised border border-tactical-border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-mono text-[12px] font-bold ${p.color}`}>{p.name}</span>
                <span className="font-mono text-[11px] text-tactical-label ml-auto">{p.shape}</span>
              </div>
              <p className="font-sans text-[11px] text-tactical-dim leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title={e.chaosTitle}>
        <div className="space-y-3">
          {e.chaosEvents.map((ev) => (
            <div key={ev.type} className="bg-tactical-raised border border-tactical-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[16px]">{ev.icon}</span>
                <span className={`font-mono text-[13px] font-bold ${ev.color}`}>{ev.type}</span>
              </div>
              <p className="font-sans text-[12px] text-tactical-text leading-relaxed mb-2">{ev.desc}</p>
              <div className="font-mono text-[10px] text-tactical-label">{ev.params}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title={e.edgeTitle}>
        <div className="bg-tactical-raised border border-tactical-border rounded-lg p-4 space-y-3">
          <p className="font-sans text-[13px] text-tactical-text leading-relaxed">{e.edgeIntro}</p>
          <div className="font-mono text-[11px] text-tactical-dim space-y-1">
            {e.edgeExamples.map((ex) => (
              <div key={ex}>{ex}</div>
            ))}
          </div>
          <div className="font-sans text-[12px] text-tactical-dim leading-relaxed">{e.edgeNote}</div>
        </div>
      </Section>
    </div>
  );
}

// ── main component ───────────────────────────────────────────────────────────

export default function ReferenceGuide({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState('nodes');
  const { i18n } = useTranslation();
  const c: GuideContent = i18n.language === 'pt' ? GUIDE_PT : GUIDE_EN;

  const TABS = [
    { id: 'nodes',   label: c.tabs.nodes },
    { id: 'metrics', label: c.tabs.metrics },
    { id: 'engine',  label: c.tabs.engine },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-tactical-bg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-0 h-11 border-b border-tactical-line shrink-0 px-4 md:px-6">
        <div className="flex items-center gap-2.5 pr-4 mr-4 border-r border-tactical-line">
          <svg width="22" height="14" viewBox="0 0 22 14" fill="none" className="shrink-0 text-signal-green">
            <path d="M0 7 L4 7 L5 2 L7 12 L9 7 L13 7 L14 4 L15 10 L16 7 L22 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-tactical-text uppercase select-none">Reference Guide</span>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 h-full">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`h-full px-4 font-mono text-[11px] tracking-[0.1em] uppercase border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-signal-green text-signal-green'
                  : 'border-transparent text-tactical-label hover:text-tactical-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-tactical-label hover:text-tactical-text transition-colors px-2 py-1 rounded border border-transparent hover:border-tactical-border"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {c.back}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
          {tab === 'nodes'   && <NodesTab   c={c} />}
          {tab === 'metrics' && <MetricsTab c={c} />}
          {tab === 'engine'  && <EngineTab  c={c} />}
        </div>
      </div>
    </div>
  );
}
