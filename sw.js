self.addEventListener('install', e => {
    e.waitUntil(
        caches.open('diary-v2').then(c =>
            c.addAll(['./index.html', './manifest.json'])
        )
    );
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(r => r || fetch(e.request))
    );
});

/* ---- Ежедневное напоминание в 22:00 ---- */
const REMINDER_HOUR = 22;

async function getLastReminded() {
    const cache = await caches.open('reminder-data');
    const res = await cache.match('last-reminded');
    return res ? await res.text() : null;
}

async function setLastReminded(val) {
    const cache = await caches.open('reminder-data');
    await cache.put('last-reminded', new Response(val));
}

async function checkAndRemind() {
    const now = new Date();
    if (now.getHours() < REMINDER_HOUR) return;

    const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    const last = await getLastReminded();
    if (last === todayKey) return;

    await self.registration.showNotification('📚 Читательский дневник', {
        body: 'Не забудь добавить, сколько прочитала сегодня!',
        icon: 'icon-192.png',
        tag: 'daily-reminder'
    });
    await setLastReminded(todayKey);
}

self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'daily-reminder') {
        event.waitUntil(checkAndRemind());
    }
});
