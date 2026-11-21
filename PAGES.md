# GitHub Pages layout

- `/`: story entry with the Enter link, social links, GTA badges, and independent CA feed.
- `/blockmind/`: afksix project page with the field feed, method, sessions, and other sections.
- `/blockmind/skills/`: capabilities.
- `/blockmind/proof/`: evidence and run archive.
- `/blockmind/ledger/`: compute ledger.
- `/blockmind/docs/`: project documentation and official token guidance.

`/home/` redirects to the project page. `/story.html` redirects to the story entry. The `blockmind` path is retained so existing links continue to work; no old project branding or narrative is published there.

Run `npm run build:pages` to generate `_site/`, then `npm run check:pages` to verify routes, assets, section anchors, CA integration, and stale copy. The repository's Pages workflow deploys `_site/` from `main`.
