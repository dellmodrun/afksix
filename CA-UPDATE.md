# afksix CA updates

The entry page reads the current contract address from the independent public endpoint:

`https://afksix-ca-feed.zaunmanx.chatgpt.site/ca`

The feed is backed by a Sites Worker and D1 database (Sites project ID `appgprj_6b019a9b80c08191a5f0f543434e1c7e`). It starts at `tba`. Only a GitHub account with admin access to `dellmodrun/afksix` can update it. The public endpoint rejects unauthenticated writes.

From this repository, while signed in with `gh`, update without rebuilding GitHub Pages:

```powershell
node scripts/update-ca.mjs tba
node scripts/update-ca.mjs SOLANA_MINT_ADDRESS
```

The entry page polls once every two seconds while visible, and refreshes immediately when the tab becomes visible again. Do not edit the old `ca-live` branch; it is no longer used by the frontend.
