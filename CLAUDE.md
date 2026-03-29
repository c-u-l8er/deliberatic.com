# Deliberatic — Open Deliberation Protocol

Open-source deliberation protocol for multi-agent AI systems. Structured argumentation, Byzantine fault-tolerant consensus, and Merkle-chained evidence logs.

## Source-of-truth spec

- `docs/spec/README.md` — Deliberatic protocol specification

## Role in [&] Ecosystem

Deliberatic is the **decision layer** — when tasks are ambiguous or conflicted, Deliberatic opens a structured deliberation round where agents submit positions with evidence, challenge each other, and reach consensus.

## Core formalism

- Weighted bipolar argumentation framework (extends Dung 1995)
- Two-phase adaptive consensus: Raft fast-path / PBFT conflict-path
- Constitutional DSL for normative constraints
- Domain-aware reputation with calibration tracking
- Merkle-chained evidence logs for regulatory compliance

## Transport bindings

- A2A v0.3+ (native)
- MCP server (7 tools)
- JSON-RPC 2.0 + SSE

## Status

This is a spec + marketing site. No implementation code yet. Protocol is transport-agnostic.
