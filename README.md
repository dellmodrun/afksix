# afksix

The published site is an English GTA VI AI agent concept frontend. `/afksix/` is the story entry; Enter opens `/afksix/blockmind/`, the project page. The project page preserves the field feed, field guide, method, sessions, memory, milestones, capabilities, decision log, compute ledger, and FAQ sections, with a project brief, documentation, and official token panel. Capabilities, evidence, ledger, and documentation have their own pages. The hero loops a short, self-hosted GTA VI player gameplay clip without an external video player, clearly separated from afksix run footage.

Public GTA VI gameplay and verified telemetry are not connected. The frontend labels these areas as pending. The contract address reads an independent CA feed every two seconds, so changing the CA does not require a full GitHub Pages build.

## Build and check

```powershell
npm run build:pages
npm run check:pages
```

`_site/` is the GitHub Pages artifact. Pushing `main` deploys [the site](https://dellmodrun.github.io/afksix/).

The previous BlockMind snapshot is retained in `public/` as source history but is not copied into the published artifact. Desktop source folders are not changed by this build.
