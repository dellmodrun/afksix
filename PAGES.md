# GitHub Pages layout

- `/afksix/`: story entry with the Enter link, social links, GTA badges, and independent CA feed.
- `/afksix/blockmind/`: afksix project page with ten sections.
- `/afksix/blockmind/skills/`: capabilities.
- `/afksix/blockmind/proof/`: evidence and run archive.
- `/afksix/blockmind/ledger/`: compute ledger.

`/afksix/home/` redirects to the project page. `/afksix/story.html` redirects to the story entry. The `blockmind` path is retained so existing links continue to work; no old project branding or narrative is published there.

Run `npm run build:pages` to generate `_site/`, then `npm run check:pages` to verify routes, assets, section anchors, CA integration, and stale copy. The repository's Pages workflow deploys `_site/` from `main`.
