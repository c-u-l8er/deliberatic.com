# Deliberatic — Protocol Specification v0.1-draft

## Abstract

Deliberatic is an open-source deliberation protocol for multi-agent AI systems. It provides structured argumentation, fault-tolerant consensus, and cryptographic auditability for agent decision-making. The protocol extends Dung's Abstract Argumentation Framework (1995) into a weighted bipolar system with agent authorship, integrates a two-phase consensus mechanism (Raft fast-path / PBFT conflict-path), and produces Merkle-chained evidence logs for regulatory compliance. Deliberatic is transport-agnostic but ships with native bindings for A2A (Google, Linux Foundation) and MCP (Anthropic, AAIF).

**Status**: Draft · **License**: Apache 2.0 · **Transport**: A2A v0.3+ / MCP / HTTP+JSON-RPC

---

## 1. Motivation

Multi-Agent Debate (MAD) research (Du et al. 2023, Chan et al. 2023, Wu et al. 2025) has demonstrated that LLM agents can improve decision quality through structured disagreement. However, current MAD frameworks suffer from three critical gaps:

1. **No formal argumentation semantics.** Agents exchange natural language opinions, but there is no structured way to compare, attack, or support positions. Confidence scores are opaque and unverifiable.

2. **No Byzantine fault tolerance.** If one agent in a cluster is compromised, hallucinating, or adversarial, existing frameworks have no mechanism to detect or contain the damage. Most rely on simple majority voting, which Wu et al. (2025) showed provides diminishing returns.

3. **No audit trail.** Enterprise deployments in finance, healthcare, and government require explainable, auditable decision chains. Current MAD frameworks produce conversation logs, not verifiable evidence.

Deliberatic addresses all three by combining formal argumentation theory with distributed consensus algorithms and append-only evidence chains.

---

## 2. Core Formalism

### 2.1 Deliberatic Argumentation Framework (DAF)

A Deliberatic Argumentation Framework is a tuple:

```
DAF = ⟨A, R⁻, R⁺, w, α, C, ρ⟩
```

Where:
- **A** = finite set of arguments (agent positions)
- **R⁻ ⊆ A × A** = attack relation (directed edges where a₁ attacks a₂)
- **R⁺ ⊆ A × A** = support relation (directed edges where a₁ supports a₂)
- **w: A → [0, 1]** = initial weight function (derived from evidence strength)
- **α: A → Agents** = authorship function (maps arguments to submitting agents)
- **C** = Constitution (normative constraint set, see §4)
- **ρ: Agents × Domain → ℝ⁺** = **domain-aware** reputation function (ELO-derived and calibration-adjusted, see §6). If domain is unknown, Deliberatic falls back to a global `ρ₀: Agents → ℝ⁺`.

This extends Dung's AF (1995) with bipolarity (Amgoud et al.), weights (Potyka 2019 wBAF semantics), and two novel additions: agent authorship tracking and constitutional constraints.

### 2.2 Graded Semantics

Deliberatic uses a modified version of Potyka's modular graded semantics for wBAFs. The acceptability degree of an argument a ∈ A is computed iteratively:

```
σ(a) = w(a) · ρ(α(a), dom(a)) + Σ[s ∈ Sup(a)] σ(s) · γ⁺ − Σ[t ∈ Att(a)] σ(t) · γ⁻
```

Where:
- `Sup(a)` = set of arguments supporting a
- `Att(a)` = set of arguments attacking a
- `γ⁺ ∈ (0,1)` = support propagation factor (default 0.6)
- `γ⁻ ∈ (0,1)` = attack propagation factor (default 0.8)
- `dom(a)` = domain label for argument `a` (e.g. `"hydraulics"`, `"scheduling"`). Provided by the round/task metadata or inferred from the task description.
- `ρ(α(a), dom(a))` = domain-aware reputation factor for the authoring agent, normalized to [0.5, 2.0]. If `dom(a)` is missing/unknown, use global `ρ₀(α(a))`. This term is **calibration-adjusted** (see §6.2) so consistently overconfident agents are down-weighted in the domains where they miscalibrate.

The computation converges when `max|σₙ(a) − σₙ₋₁(a)| < ε` for all a ∈ A, with ε = 0.001. Convergence is guaranteed by the contraction property when γ⁺ + γ⁻ < 1 (see Potyka 2019, Theorem 3).

### 2.3 Evidence Types

Arguments in Deliberatic are not abstract. Each argument a carries a typed evidence vector:

```typescript
interface Evidence {
  type: "performance" | "resource" | "schema" | "latency" | "historical" | "external";
  value: number;           // normalized to [0, 1]
  confidence: number;      // confidence interval width
  sample_size?: number;    // n for statistical evidence
  source?: string;         // provenance URI
  timestamp: ISO8601;
}
```

The weight function `w(a)` is computed from the evidence vector using a configurable aggregation (default: weighted geometric mean with confidence discounting):

```
w(a) = Π[eᵢ ∈ evidence(a)] eᵢ.value^(1/n) · (1 − eᵢ.confidence/2)
```

---

## 3. Consensus Protocol

### 3.1 Two-Phase Adaptive Consensus

Deliberatic uses a two-phase consensus protocol that adapts to the level of disagreement:

**Phase 1: Fast Path (Raft-derived)**
When the graded semantics produce a clear winner (σ(best) − σ(second) > τ, default τ = 0.15), the round uses a Raft-like fast path:
- The highest-acceptability position becomes the proposed verdict
- Agents confirm or reject via AppendEntries-style RPCs
- Majority quorum (⌊n/2⌋ + 1) commits the verdict
- Latency: ~50ms for typical clusters

**Phase 2: Conflict Path (PBFT-derived)**
When positions are close (σ(best) − σ(second) ≤ τ), the protocol escalates to a PBFT-inspired conflict path:
- All surviving positions enter a three-phase commit: Pre-Prepare → Prepare → Commit
- Requires 3f + 1 agents for f Byzantine faults
- Agents can submit additional evidence during the Prepare phase
- Graded semantics are recomputed after new evidence
- Latency: ~200ms, but produces stronger verdicts

### 3.2 Quorum Rules

```yaml
quorum:
  minimum: 3                    # minimum agents to open a round
  fast_path: "majority"         # ⌊n/2⌋ + 1
  conflict_path: "supermajority" # 3f + 1
  timeout: "30s"                # deadline for all phases
  escalation_threshold: 0.15    # τ: gap below which triggers conflict path
```

### 3.3 Leader Election

Deliberatic does not have a permanent leader. Each round elects a temporary **Moderator** — the agent with the highest reputation score who did NOT submit a position in the current round. The Moderator:
- Validates position schemas
- Triggers graded semantics computation
- Decides fast-path vs. conflict-path
- Publishes the final verdict and evidence chain

If no neutral agent is available, the protocol falls back to rotating moderation based on agent ID hash.

---

## 4. Constitution DSL

### 4.1 Normative Constraints

Every agent cluster operates under a Constitution — a YAML document that defines hard boundaries, soft preferences, and amendment rules.

```yaml
# constitution.deliberatic.yaml
name: "Production Cluster Alpha"
version: 2
authors: ["admin@company.com"]
ratified: "2026-01-15T00:00:00Z"

hard_boundaries:
  # Violations → instant position rejection
  - id: "hb-01"
    rule: "token_budget <= task.allocated_tokens"
    description: "Never exceed allocated token budget"
  - id: "hb-02"
    rule: "pii_access == false || consent.explicit == true"
    description: "No PII access without explicit consent"
  - id: "hb-03"
    rule: "irreversible_action == false || quorum >= supermajority"
    description: "Irreversible actions require supermajority"
  - id: "hb-04"
    rule: "human_impact == true → human_review == true"
    description: "Human-affecting decisions require human review"

soft_preferences:
  # Adjust acceptability scores by ±delta
  - id: "sp-01"
    rule: "minimize(resource_cost)"
    delta: 0.08
    condition: "task.stakes < 'medium'"
  - id: "sp-02"
    rule: "maximize(accuracy)"
    delta: 0.15
    condition: "task.stakes >= 'high'"
  - id: "sp-03"
    rule: "prefer(specialist_agent)"
    delta: 0.05
    condition: "specialist.domain == task.domain"

amendment:
  trigger: "vindicated_dissents >= 3"
  process: "supermajority_vote"
  cooldown: "7d"
```

### 4.2 Constitutional Interpreter

The Constitution Interpreter runs as a pre-commit validator:

1. **Hard boundary check**: Every position is validated against hard boundaries. Violations result in immediate rejection with a structured error.
2. **Soft preference adjustment**: Surviving positions have their acceptability scores adjusted by the sum of applicable soft preference deltas.
3. **Amendment detection**: When a dissent is vindicated (the dissenter's prediction was correct), the vindication counter increments. At threshold, a constitutional amendment vote is triggered.

---

## 5. Evidence Chains

### 5.1 Merkle-Chained Audit Log

Every deliberation round produces an immutable evidence chain:

```
EvidenceChain = [
  Hash(RoundMetadata),
  Hash(Position₁), Hash(Position₂), ...,
  Hash(Challenge₁), Hash(Challenge₂), ...,
  Hash(ConstitutionalCheck),
  Hash(GradedSemantics),
  Hash(ConsensusVote),
  Hash(Verdict),
  Hash(DissentRecords)
]

MerkleRoot = Hash(EvidenceChain)
```

Each element is a SHA-256 hash of the structured data. The Merkle root is published as the verdict's `evidence_chain` field.

### 5.2 Verification

Any party with access to the evidence chain can:
1. Verify integrity (recompute Merkle root)
2. Trace the reasoning path (which positions led to which verdict)
3. Audit constitutional compliance (which checks passed/failed)
4. Identify dissenting agents (and whether their dissents were later vindicated)

Export formats: JSON, CSV, PDF (compliance report), OTEL spans (distributed tracing).

---

## 6. Reputation & Calibration System (Domain-Aware)

Deliberatic’s weighting must reflect not just “who is strong overall” but “who is strong **in this domain**” and “who is **well-calibrated** vs. systematically over/underconfident.”

### 6.1 Domain-Aware Dissent-Weighted ELO

Deliberatic maintains **two coupled reputations**:
- Global: `ρ₀(agent)` (coarse prior when domain is unknown)
- Domain: `ρ(agent, domain)` for each domain label used in rounds

Per-domain ELO update:

```
ρ_new(agent, d) = ρ_old(agent, d) + K_d · (S − E_d)
```

Where:
- `d` = domain label for the round (string)
- `K_d` = per-domain adjustment factor (default 32, decays with experience *in that domain*)
- `S` = actual outcome (1.0 for winning position, 0.5 for supporting winner, 0.0 for rejected)
- `E_d` = expected outcome computed from domain ELOs: `1 / (1 + 10^((ρ_old(opponent, d) − ρ_old(agent, d)) / 400))`

Global ELO update mirrors the existing rule, but uses smaller steps (e.g. `K₀ = 8`) so global reputation evolves slowly and primarily serves as a fallback prior.

**Vindicated dissent bonus (domain-scoped):** when a dissent is later confirmed correct for the same domain `d`, apply the bonus within that domain:

```
ρ_new(dissenter, d) = ρ_old(dissenter, d) + 1.5 · K_d · (1.0 − E_d)
```

This preserves the anti-groupthink incentive while keeping expertise attribution domain-accurate.

### 6.2 Calibration Tracking (Self-Modeling Signals)

In addition to ELO, Deliberatic tracks **domain-specific calibration** for each agent, updated when outcomes become known (immediate tool outcomes, later offline evaluation, or explicit human adjudication).

Calibration record (conceptual shape):

- `domain_calibration`: `%{domain_string => %{accuracy: float, brier: float, ece: float, n: non_neg_integer, updated_at: ISO8601}}`
  - `accuracy` = fraction of correct predictions/positions in that domain
  - `brier` = Brier score on probabilistic claims (lower is better)
  - `ece` = expected calibration error (lower is better)
  - `n` = sample count supporting the metrics
- `overconfidence_index`: float
  - Positive when the agent frequently asserts high confidence and is wrong (aggregate + domain-weighted)
- `underconfidence_index`: float
  - Positive when the agent frequently defers / assigns low confidence but is correct (aggregate + domain-weighted)

**How calibration affects weighting:** the reputation term used in §2.2 is calibration-adjusted per domain:

- `ρ(α(a), dom(a))` is derived from ELO in that domain, **discounted** when calibration is poor and **bounded** to the same [0.5, 2.0] normalization range.

(Exact discount function is configurable; default is monotone decreasing in `ece` and `overconfidence_index`.)

### 6.3 Bounds & Normalization

ELO values remain bounded per agent per domain:

- `ρ(agent, d) ∈ [800, 2400]`
- New agents start at 1200 in global and in any unseen domain (or can be initialized from global).

Normalization into the semantics layer stays consistent with the original spec:

- Map ELO to a multiplicative factor in `[0.5, 2.0]` (monotone in ELO), then apply calibration discount, and clamp back to `[0.5, 2.0]`.

This ensures:
- domain experts are weighted appropriately for domain-relevant rounds,
- consistently miscalibrated agents do not dominate purely by rhetorical confidence,
- new domains start safe via the global prior and limited influence until evidence accumulates.

---

## 7. Transport Bindings

### 7.1 A2A (Agent-to-Agent Protocol)

Deliberatic maps natively onto A2A v0.3:

| Deliberatic Concept | A2A Primitive | Details |
|---------------------|---------------|---------|
| Agent capabilities | Agent Card | Skill: `deliberation/v1` in card |
| Open round | `tasks/send` | Task with `deliberation_round` type |
| Submit position | `message/send` | Message with structured Position parts |
| Challenge | `message/send` | Message with Challenge parts + attack target |
| Verdict | Artifact | Final verdict as structured Artifact |
| Evidence chain | Artifact attachment | Merkle root + full chain as JSON |

Discovery: Agents advertise deliberation capabilities via `/.well-known/agent.json` with a `deliberation/v1` skill.

### 7.2 MCP (Model Context Protocol)

Deliberatic also ships as an MCP server, exposing tools:

| Tool | Description |
|------|-------------|
| `deliberatic_open_round` | Open a new deliberation round |
| `deliberatic_submit_position` | Submit a position with evidence |
| `deliberatic_challenge` | Challenge another agent's position |
| `deliberatic_resolve` | Trigger resolution and get verdict |
| `deliberatic_query_evidence` | Query evidence chains by round ID |
| `deliberatic_get_reputation` | Get agent reputation scores |
| `deliberatic_amend_constitution` | Propose constitutional amendment |

### 7.3 Raw HTTP

For non-A2A/MCP environments: JSON-RPC 2.0 over HTTPS with SSE for streaming updates.

---

## 8. Position in the [&] Ecosystem

Deliberatic is the **decision layer** in the Ampersand Box Design agent infrastructure stack:

| Layer | Domain | Protocol Role |
|-------|--------|---------------|
| Compute | fleetprompt.com | Agent runtime, skill execution |
| Contracts | specprompt.com | Execution specs, schema validation |
| Orchestration | delegatic.com | Task routing, workflow graphs |
| **Decisions** | **deliberatic.com** | **Argumentation, consensus, audit** |
| Execution | agentromatic.com | Autonomous task execution |
| Infrastructure | webhost.systems | Hosting, deployment |
| Spatial | geofleetic.com | Location-aware routing |
| Temporal | ticktickclock.com | Scheduling, deadlines |

### Integration Flow

```
Task arrives → delegatic.com routes it
  → If ambiguous/conflicted: deliberatic.com opens round
    → Agents submit positions via A2A
    → Graded semantics compute acceptability
    → Constitution validates
    → Consensus commits verdict
  → Verdict → agentromatic.com executes
  → Evidence chain → append-only log
```

---

## 9. References

1. Dung, P.M. (1995). "On the Acceptability of Arguments and its Fundamental Role in Nonmonotonic Reasoning, Logic Programming and n-Person Games." *Artificial Intelligence*, 77(2), 321–358.
2. Potyka, N. (2019). "Extending Modular Semantics for Bipolar Weighted Argumentation." *AAMAS '19*.
3. Amgoud, L. & Cayrol, C. (1998). "On the Acceptability of Arguments in Preference-based Argumentation Framework." *UAI*.
4. Castro, M. & Liskov, B. (1999). "Practical Byzantine Fault Tolerance." *OSDI*.
5. Ongaro, D. & Ousterhout, J. (2014). "In Search of an Understandable Consensus Algorithm." *USENIX ATC*.
6. Du, Y. et al. (2023). "Improving Factuality and Reasoning in Language Models through Multiagent Debate."
7. Wu, T. et al. (2025). "Can LLM Agents Really Debate?" *arXiv:2511.07784*.
8. A2A Protocol v0.3 (2025). Linux Foundation. https://a2a-protocol.org
9. MCP Specification (2025). Agentic AI Foundation. https://modelcontextprotocol.io
10. Zhu, J. et al. (2025). "Secure Consensus Control on Multi-Agent Systems Based on Improved PBFT and Raft." *IEEE/CAA J. Autom. Sinica*.
11. Abdelnabi, S. et al. (2024). "Cooperation, Competition, and Maliciousness: LLM-Stakeholders Interactive Negotiation." *NeurIPS*.
