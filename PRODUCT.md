# Product

## Register

product

## Users

Solo engineer (owner) using this as a personal distributed systems learning lab. Context: alongside an IDE and terminal, in a focused study session. Not a team tool, not a classroom product. One user who understands what M/M/c queueing and P95 latency mean and wants to build intuition by experimenting — not by reading docs.

## Product Purpose

A visual distributed systems simulator for deep personal study. The user architects a system on a canvas (nodes + edges), configures latency, concurrency, and failure parameters per component, runs a tick-based simulation, and reads live metrics: throughput, error rate, queue backlog, P50/P95/P99 latency, utilization, cache hit/miss. The goal is to build genuine understanding of system behavior — bottlenecks, cascading failures, queueing effects — that no diagram or lecture can give.

Success = the user finishes a session with one concrete insight they didn't have before.

## Brand Personality

Precise · Serious · Expert. A professional instrument — no decoration, no gamification. Results speak. Feels like a high-quality CLI tool or oscilloscope UI that an engineer would take seriously.

## Anti-references

- **Corporate productivity tools** (Teams, Jira, Confluence, Notion): gray/blue/white enterprise aesthetic, rounded-everything, friendly iconography, "accessible to everyone" softness. This tool is for one expert engineer, not a team of mixed skills.
- **Game / cyberpunk HUD**: neon glow, animated scanlines as texture, aggressive chromatic effects, RGB anything. The dark theme must read as "instrument" not "gaming rig." Signal colors are semantic (errors, saturation, throughput) — not decoration.

## Design Principles

1. **The simulation is the UI.** Every design decision should make simulation output more legible. Decoration that doesn't carry data is a distraction.
2. **Signal colors are semantic.** Green = healthy throughput. Amber = warning / elevated. Red = error / saturated. Cyan = informational metrics. Never use these colors decoratively — the user reads them as data.
3. **Density earns trust.** This is not a simplified tool. Show real numbers, real labels, real precision. Dumbing down the display would undermine the learning purpose.
4. **Dark by default, terminal-native.** This tool lives next to a terminal and an IDE. Light mode is not the primary experience. The dark palette should feel like an instrument panel, not a gaming aesthetic.
5. **No fluff, no onboarding theater.** The user knows what they're doing. Skip hand-holding UI chrome. Every pixel should serve the simulation workflow.

## Accessibility & Inclusion

WCAG AA target for the primary dark-mode surface. High contrast on data labels and metric values is non-negotiable — the user is reading live-updating numbers; any legibility failure breaks the learning loop. No specific accommodations required beyond standard keyboard navigation and reduced-motion support (already partially in place via `@media (prefers-reduced-motion)`).
