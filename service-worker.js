self.addEventListener('install', event => {
  console.log('Service Worker installed');
});

self.addEventListener('fetch', event => {
  // Προαιρετικό: μπορείς να κάνεις cache αρχεία εδώ
});
