/**
 * Tell Bing (and other IndexNow engines: Yandex, Seznam, Naver) about
 * every URL in the live sitemap, so new pages are crawled in hours
 * instead of weeks. Run AFTER a deploy:   node scripts/indexnow.cjs
 * The key file is public/f6512b7fd24ab924ceed44995021582f.txt (served at the site root); it is
 * meant to be public. Google does not use IndexNow — for Google, request
 * indexing of key pages in Search Console.
 */
const KEY = "f6512b7fd24ab924ceed44995021582f";
const HOST = "testimoni.io";

(async () => {
  const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!urls.length) throw new Error("No URLs found in the sitemap");
  const keyCheck = await fetch(`https://${HOST}/${KEY}.txt`);
  if (!keyCheck.ok) throw new Error(`Key file not live yet (HTTP ${keyCheck.status}) — deploy first.`);
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
  });
  console.log(`Submitted ${urls.length} URLs → IndexNow responded HTTP ${res.status} (200/202 = accepted)`);
})().catch((e) => { console.error(e.message); process.exit(1); });
