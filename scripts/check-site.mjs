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
  "/artists/so1loh/",
  "/press/",
  "/releases/void/",
  "/releases/void-2/",
  "/releases/void-3/",
];
for (const href of requiredLinks) {
  if (!index.includes(`href=\"${href}\"`)) throw new Error(`missing homepage link: ${href}`);
}

const { releases } = await Bun.file("src/_data/discography.json").json();
const releasePages = releases.filter(release => release.release_page).map(release => release.release_page);
if (JSON.stringify(releasePages) !== JSON.stringify(["/releases/void-3/", "/releases/void-2/", "/releases/void/"])) {
  throw new Error(`unexpected release pages: ${JSON.stringify(releasePages)}`);
}

console.log(`✓ verified ${requiredPages.length} pages and ${releasePages.length} release detail links`);
