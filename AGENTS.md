# Deliberatic — Agent Interface

Deliberatic is the open deliberation protocol for multi-agent AI decisions in the [&] Protocol ecosystem.

## MCP Tools (planned)

| Tool | Description |
|------|-------------|
| `deliberatic_open_round` | Open a new deliberation round |
| `deliberatic_submit_position` | Submit a position with typed evidence |
| `deliberatic_challenge` | Challenge another agent's position |
| `deliberatic_resolve` | Trigger resolution and get verdict |
| `deliberatic_query_evidence` | Query evidence chains by round ID |
| `deliberatic_get_reputation` | Get agent reputation scores (domain-aware) |
| `deliberatic_amend_constitution` | Propose constitutional amendment |

## A2A Integration

Agents advertise deliberation capabilities via `/.well-known/agent.json` with a `deliberation/v1` skill. Rounds are A2A tasks, positions are A2A messages, verdicts are A2A artifacts.

## Consensus Protocol

- **Fast path (~50ms)** — clear winner, Raft-style majority quorum
- **Conflict path (~200ms)** — close positions, PBFT 3f+1 Byzantine tolerance

## Status

Spec complete. Implementation pending. See `docs/spec/README.md`.
