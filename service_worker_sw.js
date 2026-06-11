// Nama cache untuk aplikasi ZeroWaste Bites
const CACHE_NAME = 'zerowaste-bites-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/apk_logo-192.png',
  '/apk_logo-512.png'
];

// Tahap Install: Melakukan caching pada aset-aset penting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('ZeroWaste Bites: Membuka cache dan menyimpan aset utama');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Tahap Aktivasi: Membersihkan cache lama jika ada pembaruan
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('ZeroWaste Bites: Menghapus cache usang:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Tahap Fetch: Mengambil data dari cache jika offline, jika online ambil dari network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // Fallback jika tidak ada internet dan aset tidak ada di cache
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});