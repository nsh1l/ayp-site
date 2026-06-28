// ponytail: scrapes Bandcamp + Apple Music + Spotify (+ YouTube Music search), merges
const BC_BASE = "https://so1loh.bandcamp.com";
const AM_ID = 1585251019;

// ── Spotify URL map (title → album ID) ─────────────────
const SPOTIFY_MAP = {
  "5 Hours 10 minutes": "0EQyLCYNzsb2HYRR4YjNyY",
  "void 2":             "0WqlAQowMkyX23dBCvaSWY",
  "void":               "6y0399JO3WVy2XBVRu4VGP",
  "212":                "2OHIOJBEYnKUa04u4AQG40",
  "帰省 2":             "4SOal58BL7dWeLNXk1mXhP",
  "帰省":               "2vTFz6pEkGoTbaRisVZCgy",
  "Beats510":           "1HkKDEsjOJ85gyYyjW5SxX",
  "Internet Tape: 2":   "0fZmgN6xTst2Q0NXAfAOdM",
  "21":                 "2uP8G4yaGojlt5PCLGDFtr",
  "Natto":              "09Q3HopXwECB8ueySca3nN",
  "September 14":       "6tUuUqE3vGFZXf6Nh4tZwP",
};

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

// ── Merge ─────────────────────────────────────────────
const stripSuffix = s => s.replace(/ - (Single|EP)$/i, "").replace(/\(feat\..*?\)/i, "").trim();
const bcNorm = s => stripSuffix(s).toLowerCase();
const amNorm = s => s.toLowerCase();

const spByTitle = {};
for (const [t, id] of Object.entries(SPOTIFY_MAP)) {
  spByTitle[t.toLowerCase()] = `https://open.spotify.com/album/${id}`;
}

// YouTube Music channel (auto-generated, has all releases)
const YT_CHANNEL = "https://music.youtube.com/channel/UCWp-2236lvtwG-FjrSi9TOQ";

const releases = [];
const usedAm = new Set();

for (const bc of bcItems) {
  const n = bcNorm(bc.title);
  let amUrl = null;
  for (const [amTitle, url] of Object.entries(amItems)) {
    if (amNorm(amTitle) === n || stripSuffix(amTitle).toLowerCase() === n) {
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
    spotify: spByTitle[n] || null,
    youtube_music: YT_CHANNEL,
  });
}

// Apple Music-only
for (const [amTitle, url] of Object.entries(amItems)) {
  if (usedAm.has(amTitle)) continue;
  const stripped = stripSuffix(amTitle);
  const n = stripped.toLowerCase();
  releases.push({
    title: stripped,
    image: null,
    bandcamp: null,
    apple_music: url,
    spotify: spByTitle[n] || null,
    youtube_music: YT_CHANNEL,
  });
}

// Sort by title for consistent order
releases.sort((a, b) => a.title.localeCompare(b.title, 'ja'));

const outPath = new URL("../src/_data/discography.json", import.meta.url);
await Bun.write(outPath, JSON.stringify({ releases }, null, 2));
console.log(`✓ ${releases.length} releases (BC=${bcItems.length}, AM=${Object.keys(amItems).length}, SP=${Object.keys(SPOTIFY_MAP).length})`);
