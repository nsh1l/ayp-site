// ponytail: fetches album list from so1loh.bandcamp.com/music at build time
// upgrade path: Bandcamp API if they ever expose one publicly
const BASE = "https://so1loh.bandcamp.com";

const res = await fetch(`${BASE}/music`);
const html = await res.text();

const releases = [];
// each item: <a href="/album/..."><div class="art"><img...><p class="title">TITLE...ARTIST...</p></a>
const itemRe = /<a href="(\/album\/[^"]+|\/track\/[^"]+)"[\s\S]*?<div class="art">[\s\S]*?<img[^>]*?>[\s\S]*?<\/div>[\s\S]*?<p class="title">\s*(.*?)<\/p>/gs;

let m;
while ((m = itemRe.exec(html)) !== null) {
  const inner = m[2];
  // skip non-So1loh releases — artist-override without "So1loh"
  if (inner.includes("artist-override") && !inner.includes("So1loh")) continue;

  const href = m[1].startsWith("http") ? m[1] : BASE + m[1];
  // prefer data-original (lazy), fall back to src
  const imgSrc = m[0].match(/data-original="([^"]+)"/) || m[0].match(/src="([^"]+)"/);
  const rawImg = imgSrc ? imgSrc[1] : null;
  const img = rawImg && !rawImg.endsWith("/img/0.gif")
    ? rawImg.replace(/_2\.(jpg|png)/, "_7.$1")
    : null;

  // title is everything before <br> (artist-override if present)
  const title = inner.split(/<br\s*\/?>/)[0]
    .replace(/&#39;/g, "'").replace(/&amp;/g, "&").trim();

  releases.push({ title, url: href, image: img });
}

const outPath = new URL("../src/_data/discography.json", import.meta.url);
await Bun.write(outPath, JSON.stringify({ releases }, null, 2));
console.log(`✓ fetched ${releases.length} releases from Bandcamp`);
