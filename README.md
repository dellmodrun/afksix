# afksix

The published site is an English GTA VI AI agent concept frontend. `/afksix/` is the story entry; Enter opens `/afksix/blockmind/`, the project page. The project page preserves the field feed, field guide, method, sessions, memory, milestones, capabilities, decision log, compute ledger, and FAQ sections, with a project brief, documentation, and official token panel. Capabilities, evidence, ledger, and documentation have their own pages. The hero uses a static, credited GTA VI scene image. The field feed is the next section and is labeled offline until a real public run is connected.

Public GTA VI gameplay and verified telemetry are not connected. The frontend labels these areas as pending. The contract address reads an independent CA feed every two seconds, so changing the CA does not require a full GitHub Pages build.

The story entry's GitHub-style badge opens the [on-site source repository](https://dellmodrun.github.io/afksix/source/). It publishes the runnable [`afksix-core`](afksix-core/README.md) with a browser simulation, CLI and tests. The core is a deterministic autonomous exploration baseline in a simulated city; GTA VI capture, input and model integration are not connected.

## Build and check

```powershell
npm run build:pages
npm run check:pages
```

`_site/` is the GitHub Pages artifact. Pushing `main` deploys [the site](https://dellmodrun.github.io/afksix/).

The previous BlockMind snapshot is retained in `public/` as source history but is not copied into the published artifact. Desktop source folders are not changed by this build.
