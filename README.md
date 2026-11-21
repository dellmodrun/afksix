# afksix

The published site is an English GTA VI AI agent concept frontend. `/afksix/` is the story entry; Enter opens `/afksix/blockmind/`, the project page. The project page preserves the field feed, field guide, method, sessions, memory, milestones, capabilities, decision log, compute ledger, and FAQ sections, with a project brief, documentation, and official token panel. Capabilities, evidence, ledger, and documentation have their own pages. The hero uses a static, credited GTA VI scene image. The field feed is the next section and is labeled offline until a real public run is connected.

Public GTA VI gameplay and verified telemetry are not connected. The frontend labels these areas as pending. The contract address reads an independent CA feed every two seconds, so changing the CA does not require a full GitHub Pages build.

The story entry's GitHub-style badge opens the [on-site source repository](https://dellmodrun.github.io/afksix/source/). It publishes the runnable [`afksix-core`](afksix-core/README.md): city simulation, local HTTP bridge, agent runner, optional vision provider, Windows desktop capture/input adapter, JSONL traces, replay, and tests. The simulation and bridge have been verified locally; the desktop adapter captured a real desktop frame and its input behavior passed a fake-window test. GTA VI control and a public game run remain unverified and disconnected.

## Build and check

```powershell
npm run build:pages
npm run check:pages
```

`_site/` is the GitHub Pages artifact. Pushing `main` deploys [the site](https://dellmodrun.github.io/afksix/).

The previous BlockMind snapshot is retained in `public/` as source history but is not copied into the published artifact. Desktop source folders are not changed by this build.
