# AYP site

Eleventy site published from `master` to Cloudflare Pages (`dist/`).

```bash
bun install --frozen-lockfile
bun run build
```

The build uses the committed `src/_data/discography.json` and `assets/` snapshot; it does **not** fetch Bandcamp, Apple Music, Spotify, or CDN files. `bun run build` also runs `bun run check`, which rejects external image/script URLs and missing or invalid bundled media. This keeps Pages builds reproducible when upstream metadata or CDNs change.

To refresh the discography deliberately, run `bun run fetch`, review the diff for missing/changed releases, and bundle any new cover under `assets/artwork/` before committing its local `image` path. Do not use `fetch` in the Pages build command: it overwrites the committed snapshot and may drop releases on upstream failure.

Local preview: `bun run serve`.
