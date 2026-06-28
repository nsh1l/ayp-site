// ponytail: scrapes Bandcamp + Apple Music API, merges by title
const BC_BASE = "https://so1loh.bandcamp.com";
const AM_ID = 1585251019;

// ── Bandcamp ──────────────────────────────────────────
const bcHtml = await fetch(`${BC_BASE}/music`).then(r => r.text());
const bcItems = [];
const itemRe = /<a href="(\/album\/[^"]+|\/track\/[^"]+)"[\s\S]*?<div class="art">[\s\S]*?<img[^>]*?>[\s\S]*?<\/div>[\s\S]*?<p class="title">\s*(.*?)<\/p>/gs;
let m;
while ((m = itemRe.exec(bcHtml)) !== null) {
  const inner = m[2];
  if (inner.includes("artist-override") && !inner.includes("So1loh")) continue;
  const href = m[1].startsWith("http") ? m[1] : BC_BASE + m[1];
  const imgSrc = m[0].match(/data-original="([^"]+)"/) || m[0].match(/src="([^"]+)"/);
  const rawImg = imgSrc ? imgSrc[1] : null;
  const img = rawImg && !rawImg.endsWith("/img/0.gif")
    ? rawImg.replace(/_2\.(jpg|png)/, "_7.$1") : null;
  const title = inner.split(/<br\s*\/?>/)[0]
    .replace(/&#39;/g, "'").replace(/&amp;/g, "&").trim();
  bcItems.push({ title, url: href, image: img });
}

// ── Apple Music (iTunes API) ───────────────────────────
const amData = await fetch(
  `https://itunes.apple.com/lookup?id=${AM_ID}&entity=album&limit=50`
).then(r => r.json());
const amItems = {};
for (const r of amData.results) {
  if (r.wrapperType !== "collection") continue;
  const url = r.collectionViewUrl.replace("?uo=4", "").replace("/us/", "/jp/");
  amItems[r.collectionName] = url;
}

// ── Merge by title similarity ─────────────────────────
// strip suffixes like " - Single", " - EP", "(feat. ...)"
const stripSuffix = s => s.replace(/ - (Single|EP)$/i, "").replace(/\(feat\..*?\)/i, "").trim();
const bcNorm = s => stripSuffix(s).toLowerCase();
const amNorm = s => s.toLowerCase();

const releases = [];
const usedAm = new Set();

for (const bc of bcItems) {
  const n = bcNorm(bc.title);
  let amUrl = null;
  for (const [amTitle, url] of Object.entries(amItems)) {
    const an = amNorm(amTitle);
    if (an === n || stripSuffix(amTitle).toLowerCase() === n) {
      amUrl = url;
      usedAm.add(amTitle);
      break;
    }
  }
  releases.push({
    title: bc.title,
    image: bc.image,
    bandcamp: bc.url,
    apple_music: amUrl,
  });
}

// Apple Music-only (no Bandcamp match)
for (const [amTitle, url] of Object.entries(amItems)) {
  if (usedAm.has(amTitle)) continue;
  releases.push({
    title: stripSuffix(amTitle),
    image: null,
    bandcamp: null,
    apple_music: url,
  });
}

const outPath = new URL("../src/_data/discography.json", import.meta.url);
await Bun.write(outPath, JSON.stringify({ releases }, null, 2));
console.log(`✓ ${releases.length} releases (${bcItems.length} BC, ${Object.keys(amItems).length} AM)`);
