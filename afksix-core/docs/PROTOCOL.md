# Local bridge protocol

Version 1 is an HTTP contract between the agent runner and a local environment adapter. The runner only accepts `http://127.0.0.1`, `http://localhost`, or `http://[::1]` bridge URLs. A real adapter must make observations and actions correspond to the same game session.

## Health

`GET /health` returns HTTP 200 and JSON:

```json
{"ok":true,"adapter":"simulation","version":1}
```

Use `adapter: "frame"` for an image-producing game adapter.

## Observation

`GET /v1/observation` returns an integer `tick`, ISO timestamp, and one of two observation kinds.

Simulation:

```json
{"kind":"simulation","tick":0,"timestamp":"2026-11-22T00:00:00.000Z","state":{"position":{"x":8,"y":5}}}
```

Frame:

```json
{"kind":"frame","tick":0,"timestamp":"2026-11-22T00:00:00.000Z","frame":{"mime":"image/jpeg","base64":"..."}}
```

The frame must be a current screenshot, not a promotional image or a saved video. The bridge may include extra state, but the vision provider uses the frame. JPEG and PNG are supported. The runner hashes the decoded frame and writes only the hash and byte count to its trace.

## Action

`POST /v1/action` body:

```json
{"expected_tick":0,"action":{"action":"up","duration_ms":200,"reason":"Follow the road"}}
```

The action is one of `up`, `down`, `left`, `right`, `brake`, `none`. Duration must be 50–500 ms. The bridge must reject an `expected_tick` that differs from its current tick (HTTP 409), apply at most one bounded action, advance exactly one tick, and acknowledge the actual outcome:

```json
{"ok":true,"tick":1,"outcome":"Moved to 8,4"}
```

If the input cannot be applied, return a non-2xx status and do not report success. A real adapter should capture the next frame after the input and report whether the intended action appeared to work. The runtime does not infer success from an HTTP 200 alone; it requires `ok: true` and the expected tick.

## Implementer notes

The bundled `examples/mock-bridge.mjs` is the contract reference and can be started with `node src/cli.mjs serve-mock`. It uses the simulated city, which allows deterministic integration tests. A target-platform bridge must handle game focus, capture permissions, input release, and a stop mechanism before it is used with a live game. It must not expose the action endpoint on a public network.
