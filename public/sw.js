/* VoiceStroke Service Worker — PWA 离线支持
 *
 * 缓存策略：
 *  - App shell（首页/清单/图标）：install 时预缓存
 *  - hanzi-writer 字数据（cdn.jsdelivr.net）：stale-while-revalidate（离线关键）
 *  - 同源 hash 命名静态资源：缓存优先（不可变）
 *  - 导航请求：网络优先，离线回退 app shell
 *  - Google Fonts：stale-while-revalidate
 *
 * SCOPE 从 registration.scope 动态推导，兼容子目录部署（base=/voicestroke/）。
 */
const SCOPE = self.registration.scope; // 例如 "/voicestroke/"
const BASE = SCOPE.endsWith("/") ? SCOPE.slice(0, -1) : SCOPE;

const VERSION = "voicestroke-v1"; // bump 以强制刷新缓存
const ASSET_CACHE = "assets-v1";
const HANZI_CACHE = "hanzi-data-v1";

const APP_SHELL = [
  SCOPE,
  `${BASE}/index.html`,
  `${BASE}/manifest.webmanifest`,
  `${BASE}/icons/icon-192.png`,
  `${BASE}/icons/icon-512.png`,
  `${BASE}/icons/icon-maskable-512.png`,
  `${BASE}/icons/apple-touch-icon.png`,
];

const HANZI_RE = /^https:\/\/cdn\.jsdelivr\.net\/npm\/hanzi-writer-data@[^/]+\//;
const FONT_HOST_RE = /^fonts\.(googleapis|gstatic)\.com$/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => ![VERSION, ASSET_CACHE, HANZI_CACHE].includes(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // 1) hanzi-writer 字数据：stale-while-revalidate，离线命中缓存
  if (url.hostname === "cdn.jsdelivr.net" && HANZI_RE.test(req.url)) {
    event.respondWith(
      caches.open(HANZI_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // 2) 同源资源
  if (
    url.origin === self.location.origin &&
    (url.pathname === BASE || url.pathname.startsWith(`${BASE}/`))
  ) {
    // 导航请求：网络优先，离线回退 app shell
    if (req.mode === "navigate") {
      event.respondWith(
        fetch(req)
          .then((res) => {
            // 顺便用最新 index.html 覆盖壳缓存
            caches
              .open(ASSET_CACHE)
              .then((c) => c.put(`${BASE}/index.html`, res.clone()));
            return res;
          })
          .catch(() =>
            caches
              .match(`${BASE}/index.html`)
              .then((h) => h || caches.match(SCOPE))
          )
      );
      return;
    }

    // hash 命名静态资源不可变：缓存优先
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  // 3) Google Fonts：stale-while-revalidate
  if (FONT_HOST_RE.test(url.hostname)) {
    event.respondWith(
      caches.match(req).then((hit) => {
        const refresh = fetch(req).then((res) => {
          if (res.ok)
            caches.open(ASSET_CACHE).then((c) => c.put(req, res.clone()));
          return res;
        });
        return hit || refresh;
      })
    );
  }
});