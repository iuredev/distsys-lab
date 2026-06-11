---
name: System Design Lab
description: Visual distributed systems simulator for deep technical learning
colors:
  bg-void: "#0a0a0b"
  surface-instrument: "#101012"
  surface-raised: "#16161a"
  border-hairline: "#26262b"
  line-divider: "#2f2f36"
  ink-muted: "#8a909c"
  ink-dim: "#aab0bb"
  ink-primary: "#e5e7eb"
  signal-healthy: "#34d399"
  signal-warning: "#d9a441"
  signal-error: "#e5645f"
  signal-info: "#56b6c8"
  canvas-light: "#f8fafc"
typography:
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.08em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  body-bold:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  metric:
    fontFamily: "JetBrains Mono, Menlo, monospace"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.4
  metric-large:
    fontFamily: "JetBrains Mono, Menlo, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.3
rounded:
  none: "0px"
  sm: "2px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  panel:
    backgroundColor: "{colors.surface-instrument}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.xl}"
    padding: "16px"
  button-primary:
    backgroundColor: "transparent"
    textColor: "{colors.signal-healthy}"
    rounded: "{rounded.md}"
    padding: "6px 14px"
  button-primary-hover:
    backgroundColor: "rgba(52,211,153,0.1)"
    textColor: "{colors.signal-healthy}"
    rounded: "{rounded.md}"
    padding: "6px 14px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dim}"
    rounded: "{rounded.md}"
    padding: "6px 14px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "6px 14px"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.signal-error}"
    rounded: "{rounded.md}"
    padding: "6px 14px"
  label-mono:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    padding: "0"
---

# Design System: System Design Lab

## 1. Overview

**Creative North Star: "The Oscilloscope"**

This is a measurement instrument, not an application. The interface exists to make simulation data legible — no more, no less. Every design element either carries data or carries navigation to data; anything that does neither has been removed. The density is high not because density is a value, but because the engineer using this tool is reading live-updating numbers under cognitive load. Wasted space is wasted attention.

The palette is near-black-on-black with four semantic signal colors. Those signal colors (green, amber, red, cyan) are the UI's entire expressive vocabulary. They are not decorative — they mean things. Green means healthy throughput. Amber means elevated threshold. Red means error or saturation. Cyan means informational metric. Misusing them decoratively would corrupt the display the same way relabeling a voltage scale corrupts a scope.

This design explicitly rejects two failure modes: the corporate productivity tool (gray/blue enterprise softness — Teams, Jira, Confluence) and the gaming HUD (neon glow, animated scanlines, RGB-for-RGB's-sake). The dark mode must read as "instrument" not "gaming rig." The first tells the user this is a serious professional-grade tool. The second would undermine the simulation data by wrapping it in aesthetic noise.

**Key Characteristics:**
- High-density information display — panels pack multiple metrics per component
- Semantic color only — all four signal colors carry specific, consistent meanings
- Monospaced values — all live numbers render in JetBrains Mono for alignment
- Tonal depth without shadows — surface stack navigates depth through darkness steps alone
- Dark-by-default — light mode is not the primary experience
- Border-defined panels — `.tactical-panel` uses a 1px hairline `#26262b` border, not shadows

## 2. Colors: The Instrument Palette

A depth stack of near-blacks anchored at absolute zero, with four semantic signal colors carrying all expressive meaning.

### Neutral (Surface Stack)

- **Absolute Black** (`#0a0a0b`): App body background. The deepest surface. Nothing sits below this.
- **Instrument Panel** (`#101012`): All panel and card surfaces (`.tactical-panel`). The primary reading surface for simulation data.
- **Lifted Carbon** (`#16161a`): Hover states, elevated cells, raised UI elements. The third tonal step.
- **Graphite Hairline** (`#26262b`): All borders. Every panel edge, separator, and hairline divider. The only structural color in the surface stack.
- **Deep Slate Divider** (`#2f2f36`): Internal dividers, progress bar tracks, utilization bar backgrounds.
- **Slate Whisper** (`#8a909c`): Muted labels, `.label-mono` eyebrows, help text, inactive annotations. Must not be used for primary readable content.
- **Pale Slate** (`#aab0bb`): Secondary text, ghost button labels, inactive states. Readable but subordinate.
- **Signal White** (`#e5e7eb`): Primary text. All metric values, node labels, active content. High contrast against the surface stack.

### Primary Signal Colors

The four signal colors are the entire expressive vocabulary of this system. They must be used consistently and semantically — never decoratively.

- **Throughput Green** (`#34d399`): Healthy throughput, success states, online indicators, primary action buttons (the `Run` button uses a green border + text), circuit breaker closed state.
- **Warning Gold** (`#d9a441`): Elevated load, warning threshold exceeded, in-progress states, circuit breaker half-open, queue filling.
- **Error Crimson** (`#e5645f`): Errors, failures, saturated nodes (utilization ≥ 100%), circuit breaker open, dropped requests. Also used for destructive actions (Delete).
- **Telemetry Cyan** (`#56b6c8`): Informational metrics — p95/p99 latency, cost values, selection highlights, info-level annotations. Cold, precise, factual.

### Named Rules

**The Semantic Signal Rule.** The four signal colors (green, amber, red, cyan) are never used decoratively. Green does not mean "nice-looking accent." Cyan does not mean "tech vibes." Each has one meaning; every instance must match that meaning. An amber decorative element that appears near a warning state poisons the signal.

**The One-Canvas Rule.** The canvas background is not `bg-void`. The ReactFlow canvas uses a grid dot pattern at `rgba(255,255,255,0.025)` on `bg-void` to suggest space without eating contrast. Never apply a panel surface color to the canvas.

## 3. Typography

**UI Font:** Inter (with system-ui, sans-serif fallback)
**Value / Metric Font:** JetBrains Mono (with Menlo, Monaco, Consolas, monospace fallback)

**Character:** Inter carries all UI chrome — labels, buttons, panel headers. JetBrains Mono carries all live data — every number, rate, latency value, throughput count. The split is semantic: when you see mono, you're reading a measurement. When you see sans, you're reading a label or instruction.

### Hierarchy

- **Section Label** (Inter 500, 11px, uppercase, 0.08em tracking): The `.label-mono` component — used for panel section headers, eyebrow labels above metric groups (e.g. "BOTTLENECKS", "GOLDEN SIGNALS"). Never used as a heading for body content; only as a category marker.
- **Node Header** (Inter 700, 13px, -0.01em tracking): Node card titles, inspector panel heading. Bold, tight, white. The only large-weight text in the system.
- **Body** (Inter 400, 13px, 1.5 line-height): General UI text, descriptions, hint text. Ink-dim or ink-primary depending on hierarchy.
- **Metric Value** (JetBrains Mono 500, 11px): All live simulation numbers — arrival rate, throughput, utilization, queue length, latency percentiles. Renders in tabular numerals; values update every tick.
- **Metric Value Large** (JetBrains Mono 500, 13px): Dashboard aggregate metrics (total throughput, success rate, P95 in the golden signals panel).

### Named Rules

**The Mono-Means-Measurement Rule.** JetBrains Mono is used exclusively for live data values. Never use mono for labels, button text, or static UI copy. When a number updates live, it is always in mono. This distinction lets the engineer's eye instantly separate what they can act on (labels) from what they are reading (measurements).

**The No-Display-Heading Rule.** This is a tool, not a landing page. There are no hero headings, no large display type, no font sizes above 14px. The largest text on screen is a node header at 13px bold. Hierarchy is expressed through spacing, tonal contrast, and uppercase tracking — not through font size escalation.

## 4. Elevation

This system uses **tonal layering only**. No drop shadows exist in the dark-mode surface. Depth is expressed entirely through the four-step darkness scale: `bg-void (#0a0a0b)` → `surface-instrument (#101012)` → `surface-raised (#16161a)` → nothing lighter. Each step reads as elevated because it is lighter, not because it casts a shadow.

Hairline borders (`#26262b`, 1px) define the edges of panels. They are structural, not decorative — they tell the eye where one surface ends and another begins. Removing them would collapse the panel stack into an indistinguishable dark mass.

The only exception: a very faint `card-shadow` (`box-shadow: 0 1px 2px rgba(15,23,42,0.04), 0 2px 8px rgba(15,23,42,0.06)`) exists for the light mode surface, where tonal layering alone is insufficient. This shadow is suppressed entirely in dark mode.

### Named Rules

**The Shadow-Free Dark Rule.** In dark mode, no `box-shadow` is permitted on any panel, card, or overlay. Depth is tonal. If a surface feels flat, the answer is a darker `background-color` behind it, not a shadow on top of it.

**The Hairline Is Structural Rule.** The `#26262b` border is not a style choice — it is the line that separates one reading surface from another. Removing it merges the surfaces. Increasing it to 2px or applying a signal color to it decorates instead of defines.

## 5. Components

### Buttons

Sharp instrument controls. No pill shapes, no softness. Border-defined with semantic color assignment.

- **Shape:** Gently curved (6px radius). Crisp but not hard-edged.
- **Primary (Run / key action):** Transparent background, 1px signal-green (`#34d399`) border, signal-green text. On hover: `rgba(52,211,153,0.1)` background fill. Active: `rgba(52,211,153,0.2)` + `scale(0.98)` for tactile feedback.
- **Ghost (secondary actions — Export, Import, Step, Reset):** Transparent background, 1px `#26262b` border (same as hairline), ink-dim (`#aab0bb`) text. On hover: surface-raised background, ink-primary text, border shifts to `#8a909c`.
- **Destructive (Delete):** Transparent background, 1px signal-error border, signal-error text. On hover: `rgba(229,100,95,0.1)` fill.
- **Icon-only buttons (Undo, Redo, Layout):** 32×32px, ghost style, no border. Hover: surface-raised fill.
- **All buttons:** `font-size: 13px`, `font-weight: 500`, Inter, `padding: 6px 14px`, `transition: 0.15s`. No gradient fills, no shadows, no glassmorphism.

### SimNode Cards

The primary visual unit of the editor. Compact, data-dense, kind-colored.

- **Shape:** Square corners (`border-radius: 0`). Instrument-grade austerity — no rounding on the canvas nodes.
- **Border:** 2px solid, color defined by node kind (purple for server, green for load balancer, yellow for database, red for circuit breaker, etc.). Border color is the only visual differentiator between kinds.
- **Background:** `surface-instrument (#101012)`.
- **Header:** Node label in Inter 700 13px white + kind icon (14px Lucide). Replica badge (JetBrains Mono 10px, signal-cyan) when replicas > 1.
- **Metrics block:** Mono 11px metric rows: label in `ink-muted`, value in semantic signal color.
- **Utilization bar:** 6px tall, full-width, `bg: #2f2f36`. Fill color: green (<80%), amber (80–100%), red (≥100%). Transitions `0.3s ease-out`.
- **Stacked replica cards:** When replicas > 1, offset ghost cards render behind (4px × N translate), 60% opacity, same border color. Visual depth from stack, not shadows.
- **Selection ring:** `ring-2 ring-signal-cyan` when selected.

### Tactical Panel

The primary container for all inspector, dashboard, and sidebar content.

- **Class:** `.tactical-panel`
- **Appearance:** `bg-white dark:bg-surface-instrument`, `border border-slate-200 dark:border-hairline`, `border-radius: 12px`.
- **No internal shadow.** The hairline border is the entire boundary signal.
- **Section headers inside panels:** `.label-mono` (11px, uppercase, ink-muted). Provides category without consuming vertical space.

### Inspector Fields (Number Inputs)

Range sliders and numeric inputs for configuring node parameters.

- **Range sliders:** `accent-color: #0ea5e9` (brand-500, sky blue). Browser-native track/thumb, no custom styling.
- **Number display:** Read-only JetBrains Mono value shown alongside slider. Updates live as slider moves.
- **Section groupings:** Separated by `.label-mono` headers ("Reliability", "Latency shape").
- **Hint icons:** Small `<Info>` icon (Lucide, 12px) at 60% opacity. On click, inline tooltip expands within the panel. No hover-only reveals.

### Metric Row

The atomic unit of data display. Used inside SimNode cards and the dashboard.

- **Layout:** `flex justify-between` with `gap: 8px`.
- **Label:** JetBrains Mono 11px, `ink-muted (#8a909c)`. Always left.
- **Value:** JetBrains Mono 11px medium, semantic signal color. Always right.
- **Color assignment:** `throughput` → green, `arrival rate` → yellow-300, `p95` → cyan, `failures` → red, `retries` → amber.

### Progress / Utilization Bar

Horizontal bar encoding real-time node utilization. Full-width, flat, no border-radius.

- **Track:** 6px height, `#2f2f36`.
- **Fill:** Transitions in color based on value — green at <80%, amber at 80–100%, red at ≥100%.
- **Class:** `.seg-bar` — `background-color: currentColor` driven by the containing element's `color`.

### Dashboard Charts (Recharts)

Time-series line charts for throughput, latency, and success rate.

- **Background:** `surface-instrument` with faint `CartesianGrid` in `#26262b`.
- **Lines:** signal-healthy for throughput, signal-info for latency, signal-healthy for success rate.
- **Axis text:** JetBrains Mono 10px, ink-muted.
- **Tooltip:** Tactical panel surface, 1px hairline border, mono values.

## 6. Do's and Don'ts

### Do:

- **Do** use the four signal colors semantically. Green = healthy, Amber = warning, Red = error, Cyan = info. Every instance.
- **Do** render all live simulation values in JetBrains Mono. Rate values, latency percentiles, counts — always mono.
- **Do** use `.tactical-panel` (hairline border + surface-instrument background + 12px radius) as the single panel primitive. Don't invent new panel styles.
- **Do** keep the canvas background at `bg-void (#0a0a0b)` with a faint dot/grid overlay. Never apply a panel surface color to the canvas.
- **Do** use `scale(0.98)` on button `:active` for tactile snap response — the only acceptable layout-adjacent state transition.
- **Do** suppress all shadows in dark mode. Tonal layering only.
- **Do** treat `ink-muted (#8a909c)` as the floor for any text that must be readable. Below this, text is annotation only.
- **Do** use square corners (`border-radius: 0`) on SimNode cards. They are instruments on a canvas, not cards in a grid.

### Don't:

- **Don't** use signal colors decoratively. No cyan accent because it looks cool. No amber gradient as a section highlight. The moment a signal color appears without its semantic meaning, the engineer misreads a decoration as data.
- **Don't** add scanlines, glow effects, or animated `::after` noise as atmosphere. The existing `.scanline` utility exists for legacy compatibility — don't use it on new surfaces. This is an oscilloscope, not a gaming HUD. (PRODUCT.md anti-reference: "Game / cyberpunk HUD.")
- **Don't** use shadows in dark mode on any panel or card. This is the Flat Dark Rule. If adding a shadow, you're building the wrong product.
- **Don't** build corporate-productivity-tool softness: no rounded-pill buttons, no friendly icon illustration, no `#e2e8f0` light gray panels, no blue-link navigation, no "enterprise blue" accent. (PRODUCT.md anti-reference: "Corporate productivity tools — Teams, Jira, Confluence.")
- **Don't** introduce a warm-tinted near-white (`canvas.paper: #f8fafc`) into the primary dark experience. That surface exists for a potential light mode only.
- **Don't** use `border-left` as a colored accent stripe on any panel or card. Structural borders are hairline `#26262b`. Semantic color belongs on the content, not the container edge.
- **Don't** use gradient text (`background-clip: text`). Metric values are solid signal color. Gradient text corrupts the semantic signal.
- **Don't** add `overflow: hidden` to a container that holds absolutely-positioned children (dropdowns, tooltips). Use the popover API or `position: fixed` to escape stacking contexts.
- **Don't** use `ink-muted (#8a909c)` as body text. It fails 4.5:1 contrast against `surface-instrument`. Reserve it for uppercase-tracked section labels (`.label-mono`) and annotation text where the reader is not expected to scan continuously.
