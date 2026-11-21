# afksix / exploration core

An autonomous exploration baseline you can run today. It observes a small simulated city, chooses where to go, plans a road route, moves, checks the result, and keeps a short memory. Every step produces an inspectable event. The same core powers the interactive demo on the afksix source page.

## Run it

Requires Node.js 20 or newer. No install and no API key are needed.

```sh
node src/cli.mjs demo 60 6
node --test test/*.test.mjs
```

The CLI writes one JSON event per step to stdout and a summary to stderr. Set `AFKSIX_OUTPUT=run.json` to save the full run state. The seed makes runs repeatable.

## What is implemented

- Deterministic road map and six landmarks.
- Autonomous destination selection and breadth-first route planning.
- Observe, choose, act, check and remember loop.
- Event trace with position, decision, action and outcome.
- Browser demo and Node CLI using the same `simulator.mjs` file.
- Tests for repeatability, movement validity, continued exploration and invalid input.

## Integration status

This is a working simulation core. It does **not** read GTA VI frames, send gamepad inputs, use an AI model, or stream real gameplay. A real game adapter, capture pipeline, model provider and verified live run are still required before afksix can claim autonomous play in GTA VI. The public field feed stays offline until that is true.

The core is intentionally small and auditable so each part of a later real integration can be verified against the event trace.
