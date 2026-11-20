# GitHub Pages copy

This repository copies the public BlockMind frontend snapshot and the Woodoo frontend into the independent `afksix` repository. The desktop source folders are not part of this Git history.

`npm run build:pages` places the Woodoo entry at `_site/` and BlockMind at `_site/blockmind/`, with its assets and routes prefixed by `/afksix/blockmind/`. The Woodoo Enter button opens BlockMind. `npm run check:pages` checks the entry, the four BlockMind pages, and key assets. Pushing `main` deploys the site at <https://dellmodrun.github.io/afksix/>.

The site is a static snapshot. Recorded videos, images, public API responses, and the four pages are included; live game, WebSocket, and backend changes from the original site are not reproduced by GitHub Pages.

The BlockMind home page includes a watch guide and FAQ adapted from Woodoo's visitor guide. They explain the existing live panel, life cycle and proof links without adding chat, guestbook or map features that require Woodoo's own backend.
