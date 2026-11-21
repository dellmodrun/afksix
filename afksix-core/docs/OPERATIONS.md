# Run operations

## Local verification

1. `npm test` checks the planner, HTTP bridge, action validation and trace round-trip.
2. `npm run smoke` starts a temporary mock bridge and executes 30 real HTTP steps.
3. `node src/cli.mjs demo 60 6` produces a repeatable, network-free reference run.

## Capturing a run

Start a local bridge, then run the agent with `--trace run.jsonl`. Trace creation uses exclusive mode, so an existing run cannot be silently overwritten. Keep the bridge on loopback. Do not put an API key in command arguments, the source tree, or any log. For a frame adapter, select `--provider vision` and configure `OPENAI_API_KEY` and `AFKSIX_MODEL` in the environment.

The runner accepts a maximum of 10,000 steps. Each action lasts 50–500 ms. Stop the runner with Ctrl+C. A provider failure prevents an action from being sent. A bridge failure stops the run and leaves the completed JSONL events on disk for inspection.

## Publishing evidence

A public claim needs a timestamped session, actual game frames, the corresponding action trace, and an outcome that can be checked against those frames. The current site does not have such a session. Only publish a live badge or feed after the adapter and evidence exist. The simulated city and its traces should always stay labeled as simulation.
