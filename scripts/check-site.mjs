const requiredPages = [
  "dist/index.html",
  "dist/artists/so1loh/index.html",
  "dist/press/index.html",
  "dist/releases/void/index.html",
  "dist/releases/void-2/index.html",
  "dist/releases/void-3/index.html",
];

for (const page of requiredPages) {
  if (!(await Bun.file(page).exists())) throw new Error(`missing page: ${page}`);
}

const index = await Bun.file("dist/index.html").text();
const requiredLinks = [
  "https://alwaysyesterdayparty.stores.jp/",
  "https://trackid.alwaysyesterday.party/",
  "/artists/so1loh/",
  "/press/",
  "/releases/void/",
  "/releases/void-2/",
  "/releases/void-3/",
];
for (const href of requiredLinks) {
  if (!index.includes(`href=\"${href}\"`)) throw new Error(`missing homepage link: ${href}`);
}

const sitemap = await Bun.file("dist/sitemap.xml").text();
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
if (!sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) throw new Error("sitemap is not XML");
if (sitemapUrls.some(url => url.endsWith("/sitemap.xml"))) throw new Error("sitemap lists itself");
for (const url of [
  "https://alwaysyesterday.party/",
  "https://alwaysyesterday.party/artists/so1loh/",
  "https://alwaysyesterday.party/press/",
  "https://alwaysyesterday.party/releases/void/",
  "https://alwaysyesterday.party/releases/void-2/",
  "https://alwaysyesterday.party/releases/void-3/",
]) {
  if (!sitemapUrls.includes(url)) throw new Error(`missing sitemap URL: ${url}`);
}

const robots = await Bun.file("dist/robots.txt").text();
if (!robots.includes("Sitemap: https://alwaysyesterday.party/sitemap.xml")) {
  throw new Error("robots.txt does not reference sitemap.xml");
}

// Verify loader video — ponytail: preload=metadata saves 800KB on repeat visits
if (!index.includes('id="loading-logo"')) throw new Error("missing loader video");
if (!index.includes('autoplay')) throw new Error("missing autoplay on loader video");
if (!index.includes('preload="metadata"')) throw new Error("expected preload=metadata on loader video");

// Regression: separate classic scripts share the same global lexical scope.
// A second top-level `const shouldShowLoader` prevents the footer script from parsing.
if ((index.match(/const shouldShowLoader/g) || []).length !== 1) {
  throw new Error("loader script redeclares shouldShowLoader");
}
if (!index.includes('window.AYP.shouldShowLoader === true')) {
  throw new Error("loader script must read the bootstrap state from window.AYP");
}

// OG meta & favicon
if (!index.includes('property="og:image"')) throw new Error("missing og:image meta");
if (!index.includes('property="og:title"')) throw new Error("missing og:title meta");
if (!index.includes('name="twitter:card"')) throw new Error("missing twitter:card meta");
if (!index.includes('rel="icon"')) throw new Error("missing favicon link");
if (!index.includes('rel="apple-touch-icon"')) throw new Error("missing Safari home screen icon link");

// Bandcamp button has text label (check in green CTA context, not just aria-label on icons)
const bcBtn = index.match(/bg-green-600[\s\S]*?<\/a>/);
if (!bcBtn || !bcBtn[0].includes('Bandcamp')) throw new Error("Bandcamp CTA button missing text label");

// Placeholder card contrast improved
if (index.includes('text-slate-400')) throw new Error("placeholder card still uses low-contrast slate-400");

const { releases } = await Bun.file("src/_data/discography.json").json();
const releasePages = releases.filter(release => release.release_page).map(release => release.release_page);
if (JSON.stringify(releasePages) !== JSON.stringify(["/releases/void-3/", "/releases/void-2/", "/releases/void/"])) {
  throw new Error(`unexpected release pages: ${JSON.stringify(releasePages)}`);
}

console.log(`✓ verified ${requiredPages.length} pages and ${releasePages.length} release detail links`);
