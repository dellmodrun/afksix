# afksix

**An inspectable agent loop for open-ended game exploration.** The repository contains a runnable city simulation, a local game-bridge protocol, an agent runner, an optional vision-model decision provider, JSONL traces, replay, and tests. It is the public engineering baseline behind the afksix concept.

**Project status:** the simulation, local bridge, and generic Windows desktop capture/input adapter run today. That desktop adapter has been tested for frame capture and simulated input, but it has **not** been validated against GTA VI. A verified public game session is **not connected**. No screenshot, play session, or agent decision on the website is presented as real GTA VI telemetry.

[Run the browser demo](https://dellmodrun.github.io/afksix/source/#tab-demo) · [Open the project page](https://dellmodrun.github.io/afksix/blockmind/) · [Read the bridge contract](docs/PROTOCOL.md)

## Contents

1. [What afksix does](#what-afksix-does)
2. [Working parts and current limits](#working-parts-and-current-limits)
3. [Requirements](#requirements)
4. [Quick start](#quick-start)
5. [Architecture](#architecture)
6. [Command reference](#command-reference)
7. [Bridge protocol](#bridge-protocol)
8. [Vision provider](#vision-provider)
9. [Windows desktop bridge](#windows-desktop-bridge)
10. [Recording and replay](#recording-and-replay)
11. [Tests and verification](#tests-and-verification)
12. [Security and operational boundaries](#security-and-operational-boundaries)
13. [FAQ](#faq)
14. [Roadmap](#roadmap)

## What afksix does

The question is what an agent does when the player leaves and no mission marker supplies the next goal. A useful answer requires more than a clever screenshot. The system must repeatedly observe the world, choose a short action, execute it, check the result, remember what mattered, and keep going.

This repository makes that loop inspectable. A local bridge supplies observations and accepts bounded actions. A provider chooses the next action. The runner records both the choice and the bridge's acknowledgement. The included simulated city gives the system an environment that anybody can run and test now.

## Working parts and current limits

| Component | Status | Verified result |
| --- | --- | --- |
| City simulation and route planner | Working | Repeatable runs visit six landmarks and remain on roads |
| Browser demonstration | Working | Same simulation module drives the map and decision trace |
| Local HTTP bridge | Working in simulation | 40-step end-to-end HTTP run covered by automated test |
| Agent runner | Working | Observe → decide → act → record loop with bounded actions and unchanged-frame stop |
| Vision-model provider | Implemented, mock-tested | Request format and response validation tested without a live API key |
| JSONL recording and replay | Working | Trace round-trip covered by automated test |
| Windows desktop frame capture and bounded keyboard input | Implemented, locally tested | Captured a real desktop frame; test verified armed input through a fake target window |
| GTA VI frame capture and game input | Not verified | Requires target-platform setup and a real-game test |
| Public live stream and verified GTA VI telemetry | Not connected | Field feed remains offline |

The vision provider is **not** evidence that an AI has played GTA VI. A real adapter must capture the actual game, perform controls, and return measurable outcomes before that claim can be made.

## Requirements

- Node.js 20 or newer. The core has no npm runtime dependencies.
- For the optional vision provider: a model available to your OpenAI API account, `OPENAI_API_KEY`, and `AFKSIX_MODEL`.
- For the optional Windows desktop bridge: Windows, Python 3.10+, and Pillow (`python -m pip install -r adapters/requirements.txt`).
- For real-game use: a local bridge implementing the [protocol](docs/PROTOCOL.md), plus a game environment that permits capture and input. No such GTA VI adapter is shipped here yet.

The browser demo needs a modern browser with JavaScript modules. It needs no API key and runs entirely in the visitor's browser.

## Quick start

Unzip the source archive, open a terminal inside `afksix-core`, and run:

```sh
node src/cli.mjs demo 60 6
npm test
npm run smoke
```

The first command runs 60 deterministic steps without networking. `npm test` verifies the planner, bridge, provider validation, recording, and replay. `npm run smoke` starts an ephemeral local bridge, completes 30 HTTP-controlled steps, then stops it.

To inspect a trace through the normal bridge interface, use two terminals:

```sh
# Terminal 1
node src/cli.mjs serve-mock 4788

# Terminal 2
node src/cli.mjs run --bridge http://127.0.0.1:4788 --provider simulation --steps 60 --trace run.jsonl
node src/cli.mjs replay run.jsonl
```

Each line of `run.jsonl` is one complete observation/decision/action/outcome event. The trace excludes raw image bytes and API keys.

## Architecture

```text
                  local observation
                       │
                       ▼
  Game bridge ──→ Agent runner ──→ Decision provider
       ▲                │                 │
       │                │                 │
       └── short action ◀─────────────────┘
                        │
                        ▼
                 JSONL trace + replay
```

| File | Responsibility |
| --- | --- |
| `src/simulator.mjs` | Road world, landmark selection, path planning, memory and browser demo core |
| `src/bridge.mjs` | Loopback HTTP transport, timeouts and response handling |
| `src/providers.mjs` | Deterministic simulation provider and optional vision provider |
| `src/runtime.mjs` | Bounded agent loop, trace writing, replay validation |
| `src/cli.mjs` | Commands for demo, smoke test, bridge run and replay |
| `examples/mock-bridge.mjs` | Real HTTP server backed by the simulator |
| `adapters/windows_desktop_bridge.py` | Optional Windows screen capture and short keyboard-input bridge |
| `test/` | Deterministic, transport and provider tests |

The runner does not assume that every environment exposes a map. A bridge can return a simulation state or an image frame. The provider must match the observation kind. For a real game, the bridge would return captured frames and apply short input events.

## Command reference

| Command | Result |
| --- | --- |
| `node src/cli.mjs demo [steps] [seed]` | Runs the deterministic city directly and prints JSON events |
| `node src/cli.mjs smoke [steps]` | Starts and stops a local mock bridge around a complete HTTP run |
| `node src/cli.mjs serve-mock [port]` | Serves the simulated bridge on `127.0.0.1` |
| `node src/cli.mjs run --bridge URL --provider simulation --steps N --trace FILE` | Runs through an existing simulation bridge |
| `node src/cli.mjs run --bridge URL --provider vision --steps N --trace FILE` | Uses real image frames and a configured vision model |
| `node src/cli.mjs replay FILE` | Reads and validates a JSONL trace |

`steps` is limited to 1–10,000. Actions are limited to `up`, `down`, `left`, `right`, `brake`, or `none`, with a duration of 50–500 ms. A provider error never sends an action to the bridge. The bridge rejects stale observations.
For image runs, the runner stops if the frame stays identical through four actions, preventing endless repeated input against a frozen view.

## Bridge protocol

The bridge is a local HTTP service. It implements `GET /health`, `GET /v1/observation`, and `POST /v1/action`. The client accepts only loopback HTTP hosts. The protocol and example payloads are in [docs/PROTOCOL.md](docs/PROTOCOL.md).

The included mock bridge is a real implementation of that contract, backed by the simulated city. A future game adapter must implement the same contract and report actual observations and outcomes. A claim of game integration requires a recorded run against that adapter, not merely a successful mock run.

## Vision provider

The optional provider sends a JPEG or PNG frame to the OpenAI Responses API and requests one bounded JSON action. It validates the returned action before the runner sends anything to a bridge. Its request shape follows the [official image input guide](https://developers.openai.com/api/docs/guides/images-vision) and [Responses API reference](https://developers.openai.com/api/reference/resources/responses/methods/create).

```sh
export OPENAI_API_KEY=your_key
export AFKSIX_MODEL=your_vision_capable_model
node src/cli.mjs run --bridge http://127.0.0.1:4788 --provider vision --steps 20 --trace vision-run.jsonl
```

On PowerShell, use `$env:OPENAI_API_KEY = '...'` and `$env:AFKSIX_MODEL = '...'`. Never put a key in a web page, URL, trace, or committed file. The mock simulation bridge returns structured state rather than an image, so it is deliberately incompatible with the vision provider. A frame-producing bridge is required.

The API path is implemented and mock-tested; this repository does **not** contain a verified paid API run or a verified game-control run.

## Windows desktop bridge

The optional adapter in `adapters/windows_desktop_bridge.py` captures a specified screen rectangle as a JPEG frame and can send a short W/A/S/D/Space scan-code input to a matching foreground window. It is a generic desktop bridge. It does **not** discover a GTA VI session, configure a console, or prove that the game accepted an input.

```powershell
python -m pip install -r adapters/requirements.txt
python adapters/windows_desktop_bridge.py --bbox 0,0,1280,720 --window-title "YOUR GAME WINDOW" --port 4788
```

Without `--arm`, capture works and action requests return HTTP 403. After confirming the capture rectangle and target window title, restart with `--arm` to permit bounded input while that window is in the foreground. To run the vision loop, set the API environment variables described above and use:

```powershell
node src/cli.mjs run --bridge http://127.0.0.1:4788 --provider vision --steps 20 --trace desktop-run.jsonl
```

The bridge reports that a key input was delivered and measures the average pixel change in the captured region. A visual change is **not** proof of movement or successful gameplay; that requires inspecting actual frames and outcomes. The adapter is bound to `127.0.0.1` and refuses controls until armed. The local smoke test captured a real desktop frame, while its automated action test used an injected fake window and input function so it did not press keys on the host machine.

## Recording and replay

A run event contains sequence number, timestamp, observation kind and tick, optional frame SHA-256, decision reason, validated action, duration, and acknowledged outcome. Raw frames are excluded from the JSONL trace so a normal run does not accidentally publish game images or grow without bound.

```json
{"seq":1,"observation":{"kind":"simulation","tick":0,"position":{"x":8,"y":5}},"decision":"Explore Arcade","action":"up","duration_ms":200,"outcome":"Moved to 8,4"}
```

The real record also includes an ISO timestamp. `replay` checks sequence continuity and required fields. It replays the **record**, not game controls; it never presses keys.

## Tests and verification

Run `npm test` to execute the automated checks. The tests cover deterministic exploration, movement validity, all-landmark continuation, 40 HTTP bridge steps, trace round-trip, stale tick rejection, invalid provider action rejection, loopback-only transport, and the vision request/response contract. `npm run smoke` exercises the command-line route end to end. On Windows, run `python -m unittest discover adapters -p 'test_*.py'` to test capture and armed-input behavior with injected fake devices; this does not press real keys.

These tests prove the local baseline. They do not prove compatibility with any commercial game. The website's live field feed stays marked offline until an actual capture-and-control adapter passes an observed run.

## Security and operational boundaries

- The control client connects only to loopback HTTP, so a public website cannot send actions to a user's device through this interface.
- API credentials live in the local process environment, never in the published source page.
- Model output is parsed and bounded before any input is sent. Invalid output fails closed.
- An action is tied to the observation tick; stale actions are rejected by the mock bridge.
- Every action is short. The runner has a maximum step count and can be stopped with Ctrl+C.
- The runner stops before a fifth action if four consecutive actions leave the captured frame identical.
- Trace files never contain raw frame bytes or API credentials.
- The Windows adapter requires an explicit capture rectangle and foreground window title; it rejects actions while unarmed or unfocused.

The bridge is a code interface, not an authorization layer. Anyone implementing a real input bridge must keep it on the local machine and decide which game window it is allowed to control.

## FAQ

**Can I install this and watch an AI play GTA VI today?** No. You can run the complete simulated loop today. Real GTA VI capture, input and verification still need an adapter for the chosen platform.

**Is the browser demo fake?** It is a real execution of `src/simulator.mjs`, the same source file published here. It is deliberately labeled as a simulated city.

**Does the vision provider work without a key?** No. The local simulation does. The vision provider requires a configured model and API key and has only been tested against a mocked API response here.

**Why record failed steps?** An agent's recovery only makes sense if the observation, attempted action and actual result can be compared later. A highlight clip is not enough.

**Is afksix affiliated with Rockstar Games?** No. This is an independent experiment. GTA VI and its artwork belong to Rockstar Games.

## Roadmap

1. Configure and test the capture/input bridge against the actual target game platform.
2. Verify bounded control and recovery against a real, recorded game session.
3. Link frame hashes, actions and outcomes to an inspectable session archive.
4. Connect a public field feed only after the full observation-to-outcome chain is real.

## License

The source in this package is released under the [MIT License](LICENSE). Game footage, game assets, and third-party artwork are not included in that license.
