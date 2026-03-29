# Deliberatic Documentation

> **Structured argumentation. Fault-tolerant consensus. Cryptographic auditability.**

Welcome to the documentation hub for **Deliberatic** — an open-source deliberation
protocol for multi-agent AI systems. Deliberatic provides structured argumentation,
Byzantine fault-tolerant consensus, and Merkle-chained evidence logs for agent
decision-making.

The protocol extends Dung's Abstract Argumentation Framework (1995) into a weighted
bipolar system with agent authorship, integrates a two-phase consensus mechanism
(Raft fast-path / PBFT conflict-path), and produces cryptographic evidence chains
for regulatory compliance.

---

## Why Deliberatic?

Multi-Agent Debate (MAD) research has demonstrated that LLM agents improve
decision quality through structured disagreement. But current MAD frameworks
suffer three critical gaps:

1. **No formal argumentation semantics** — agents exchange opinions with no
   structured way to compare, attack, or support positions
2. **No Byzantine fault tolerance** — a compromised agent can corrupt the
   entire cluster
3. **No audit trail** — enterprise deployments require explainable, verifiable
   decision chains

Deliberatic addresses all three.

---

## Documentation Map


```{toctree}
:maxdepth: 1
:caption: Homepages

[&] Ampersand Box <https://ampersandboxdesign.com>
Graphonomous <https://graphonomous.com>
BendScript <https://bendscript.com>
WebHost.Systems <https://webhost.systems>
Agentelic <https://agentelic.com>
AgenTroMatic <https://agentromatic.com>
Delegatic <https://delegatic.com>
Deliberatic <https://deliberatic.com>
FleetPrompt <https://fleetprompt.com>
GeoFleetic <https://geofleetic.com>
OpenSentience <https://opensentience.org>
SpecPrompt <https://specprompt.com>
TickTickClock <https://ticktickclock.com>
```

```{toctree}
:maxdepth: 1
:caption: Root Docs

[&] Protocol Docs <https://docs.ampersandboxdesign.com>
Graphonomous Docs <https://docs.graphonomous.com>
BendScript Docs <https://docs.bendscript.com>
WebHost.Systems Docs <https://docs.webhost.systems>
Agentelic Docs <https://docs.agentelic.com>
AgenTroMatic Docs <https://docs.agentromatic.com>
Delegatic Docs <https://docs.delegatic.com>
Deliberatic Docs <https://docs.deliberatic.com>
FleetPrompt Docs <https://docs.fleetprompt.com>
GeoFleetic Docs <https://docs.geofleetic.com>
OpenSentience Docs <https://docs.opensentience.org>
SpecPrompt Docs <https://docs.specprompt.com>
TickTickClock Docs <https://docs.ticktickclock.com>
```

```{toctree}
:maxdepth: 2
:caption: Deliberatic Docs

spec/README
```

---

## Core Concepts

### Deliberatic Argumentation Framework (DAF)

A formal tuple `DAF = <A, R-, R+, w, a, C, p>` combining:
- **Weighted bipolar argumentation** (attacks + supports with evidence-derived weights)
- **Agent authorship tracking** (every argument traces to its submitting agent)
- **Constitutional constraints** (hard boundaries + soft preferences)
- **Domain-aware reputation** (ELO-derived, calibration-adjusted)

### Two-Phase Adaptive Consensus

- **Fast path (Raft-derived)** — when positions have a clear winner (~50ms)
- **Conflict path (PBFT-derived)** — when positions are close, Byzantine-tolerant (~200ms)

### Constitution DSL

YAML-based normative constraints: hard boundaries (instant rejection on violation),
soft preferences (score adjustments), and amendment rules (vindicated dissents
trigger constitutional votes).

### Merkle-Chained Evidence

Every deliberation round produces an immutable evidence chain — SHA-256 hashed
positions, challenges, votes, and verdicts with a verifiable Merkle root.

---

## Transport Bindings

| Protocol | Support |
|----------|---------|
| **A2A** (Google/Linux Foundation) | Native — agents advertise `deliberation/v1` skill |
| **MCP** (Anthropic/AAIF) | MCP server with 7 tools |
| **HTTP** | JSON-RPC 2.0 + SSE for streaming |

### MCP Tools

| Tool | Description |
|------|-------------|
| `deliberatic_open_round` | Open a new deliberation round |
| `deliberatic_submit_position` | Submit a position with evidence |
| `deliberatic_challenge` | Challenge another agent's position |
| `deliberatic_resolve` | Trigger resolution and get verdict |
| `deliberatic_query_evidence` | Query evidence chains by round ID |
| `deliberatic_get_reputation` | Get agent reputation scores |
| `deliberatic_amend_constitution` | Propose constitutional amendment |

---

## Position in the [&] Ecosystem

Deliberatic is the **decision layer**:

| Layer | Product | Role |
|-------|---------|------|
| Distribution | FleetPrompt | Agent runtime, skill execution |
| Standards | SpecPrompt | Execution specs, schema validation |
| Orchestration | Delegatic | Task routing, workflow graphs |
| **Decisions** | **Deliberatic** | **Argumentation, consensus, audit** |
| Execution | AgenTroMatic | Autonomous task execution |
| Infrastructure | WebHost.Systems | Hosting, deployment |
| Spatial | GeoFleetic | Location-aware routing |
| Temporal | TickTickClock | Scheduling, deadlines |

---

## Project Links

- **Spec:** [Protocol Specification](spec/README.md)
- **[&] Protocol ecosystem:** `AmpersandBoxDesign/`

---

*[&] Ampersand Box Design — deliberatic.com*
