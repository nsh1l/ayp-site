// ponytail: scrapes Bandcamp + Apple Music + Spotify, merges by title, sorts newest first
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
  amItems[r.collectionName] = {
    url,
    releaseDate: r.releaseDate ? r.releaseDate.split("T")[0] : null,
  };
}

// ── Merge ─────────────────────────────────────────────
const stripSuffix = s => s.replace(/ - (Single|EP)$/i, "").replace(/\(feat\..*?\)/i, "").trim();
const bcNorm = s => stripSuffix(s).toLowerCase();
const amNorm = s => s.toLowerCase();

const spByTitle = {};
for (const [t, id] of Object.entries(SPOTIFY_MAP)) {
  spByTitle[t.toLowerCase()] = `https://open.spotify.com/album/${id}`;
}

async function fetchSpotifyArtwork(url) {
  if (!url) return null;
  try {
    const { thumbnail_url } = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`).then(r => r.json());
    return thumbnail_url || null;
  } catch {
    return null;
  }
}

const YT_CHANNEL = "https://music.youtube.com/channel/UCWp-2236lvtwG-FjrSi9TOQ";

// Try to scrape BC dates for BC-only items
async function fetchBcDate(url) {
  try {
    const html = await fetch(url).then(r => r.text());
    const m = html.match(/<meta itemprop="datePublished" content="([^"]+)"/);
    return m ? m[1] : null;
  } catch { return null; }
}

const releases = [];
const usedAm = new Set();

for (const bc of bcItems) {
  const n = bcNorm(bc.title);
  let amInfo = null;
  for (const [amTitle, info] of Object.entries(amItems)) {
    if (amNorm(amTitle) === n || stripSuffix(amTitle).toLowerCase() === n) {
      amInfo = info;
      usedAm.add(amTitle);
      break;
    }
  }
  const date = amInfo ? amInfo.releaseDate : await fetchBcDate(bc.url);
  releases.push({
    title: bc.title,
    date: date || null,
    image: bc.image,
    bandcamp: bc.url,
    apple_music: amInfo ? amInfo.url : null,
    spotify: spByTitle[n] || null,
    youtube_music: YT_CHANNEL,
  });
}

// Apple Music-only
for (const [amTitle, info] of Object.entries(amItems)) {
  if (usedAm.has(amTitle)) continue;
  const stripped = stripSuffix(amTitle);
  const n = stripped.toLowerCase();
  releases.push({
    title: stripped,
    date: info.releaseDate || null,
    image: await fetchSpotifyArtwork(spByTitle[n]),
    bandcamp: null,
    apple_music: info.url,
    spotify: spByTitle[n] || null,
    youtube_music: YT_CHANNEL,
  });
}

// Sort newest first (null dates → oldest)
releases.sort((a, b) => {
  if (!a.date && !b.date) return 0;
  if (!a.date) return 1;
  if (!b.date) return -1;
  return b.date.localeCompare(a.date);
});

const outPath = new URL("../src/_data/discography.json", import.meta.url);
await Bun.write(outPath, JSON.stringify({ releases }, null, 2));
console.log(`✓ ${releases.length} releases (BC=${bcItems.length}, AM=${Object.keys(amItems).length}, SP=${Object.keys(SPOTIFY_MAP).length})`);
