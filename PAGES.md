# GitHub Pages copy

This repository copies the public BlockMind frontend snapshot from the desktop source into the independent `afksix` repository. The source desktop folder is not part of this Git history.

`npm run build:pages` copies `public/` to `_site/` and prefixes local asset and route URLs with `/afksix/`. `npm run check:pages` checks the four captured pages and key assets. Pushing `main` deploys the site at <https://dellmodrun.github.io/afksix/>.

The site is a static snapshot. Recorded videos, images, public API responses, and the four pages are included; live game, WebSocket, and backend changes from the original site are not reproduced by GitHub Pages.
