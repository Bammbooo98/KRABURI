// KRABURI: เก็บหน้าทางเข้าไว้ในเครื่อง + รับการแจ้งเตือนมือถือ (ข้อมูลงานทั้งหมดอยู่ที่ Google)
const CACHE = "kraburi-shell-v3";
const SHELL = ["./", "index.html", "config.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "favicon-32.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) return;            // ไม่ยุ่งกับแอพ Google
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; }).catch(() => caches.match(e.request)));
});

// ---- แจ้งเตือน: ทุกข้อความต้องแสดงเป็นการแจ้งเตือน (iPhone บังคับ) ----
self.addEventListener("push", e => {
  let j = {};
  try { j = e.data ? e.data.json() : {}; } catch (x) { try { j = { body: e.data.text() }; } catch (y) {} }
  const n = Object.assign({}, j, j.data || {}, j.notification || {});
  e.waitUntil(Promise.all([bumpBadge(), self.registration.showNotification(n.title || "H.T.M.S.KRABURI", {
    body: n.body || "มีการแจ้งเตือนใหม่",
    icon: "icon-192.png",
    badge: "favicon-32.png",
    data: { url: "./" }
  })]));
});
// ตัวเลขสีแดงบนไอคอนแอพ: เพิ่มทีละ 1 ทุกครั้งที่มีแจ้งเตือนเข้ามา (แอพจะตั้งค่าตัวเลขจริงให้ตอนเปิด)
async function bumpBadge() {
  try {
    const c = await caches.open("kraburi-badge"), r = await c.match("/__badge");
    const n = (r ? parseInt(await r.text(), 10) || 0 : 0) + 1;
    await c.put("/__badge", new Response(String(n)));
    if (self.navigator && navigator.setAppBadge) await navigator.setAppBadge(n);
  } catch (e) {}
}
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const c of list) { if ("focus" in c) return c.focus(); }
    return self.clients.openWindow("./");
  }));
});
