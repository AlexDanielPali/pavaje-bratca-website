/**
 * Service Worker pentru Pavaje Bratca Website
 * 
 * Acest service worker oferă:
 * - Caching static pentru resurse principale
 * - Strategii de caching pentru diferite tipuri de resurse
 * - Experiență offline de bază
 * - Preîncărcare pentru pagini importante
 */

const CACHE_NAME = 'pavaje-bratca-v1';

// Resurse care vor fi puse în cache la instalare
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/servicii.html',
  '/galerie.html',
  '/despre-noi.html',
  '/contact.html',
  '/src/css/main.css',
  '/src/js/main.js',
  '/src/assets/images/logo.png',
  '/offline.html' // Pagină pentru când utilizatorul este offline
];

// Resurse care vor fi puse în cache la prima cerere
const DYNAMIC_CACHE_URLS = [
  '/src/css/components/'
];

// Instalare Service Worker
self.addEventListener('install', event => {
  // Skip waiting forțează activarea imediată
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
  );
});

// Activare Service Worker
self.addEventListener('activate', event => {
  // Preia controlul imediat
  event.waitUntil(self.clients.claim());
  
  // Curăță cache-uri vechi
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log(`Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
      );
    })
  );
});

// Interceptează cereri de rețea
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Ignoră requesturile pentru analytics sau beacon
  if (event.request.method !== 'GET' || 
      event.request.url.includes('analytics') || 
      event.request.url.includes('beacon')) {
    return;
  }
  
  // Strategii de caching în funcție de tip de resursă
  if (isAssetRequest(event.request)) {
    // Cache first pentru resurse statice (CSS, JS, imagini)
    event.respondWith(cacheFirstStrategy(event.request));
  } else if (isAPIRequest(event.request)) {
    // Network first pentru API-uri
    event.respondWith(networkFirstStrategy(event.request));
  } else {
    // Stale while revalidate pentru pagini HTML
    event.respondWith(staleWhileRevalidateStrategy(event.request));
  }
});

/**
 * Strategie cache-first: încearcă cache-ul întâi, apoi rețeaua
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Pune în cache dacă este un răspuns valid
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Returnează o pagină offline sau o imagine placeholder dacă e cazul
    if (request.destination === 'image') {
      return caches.match('/src/assets/images/placeholder.jpg');
    }
    
    return caches.match('/offline.html');
  }
}

/**
 * Strategie network-first: încearcă rețeaua întâi, apoi cache-ul
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Pune în cache răspunsul pentru viitor
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || caches.match('/offline.html');
  }
}

/**
 * Strategie stale-while-revalidate: returnează din cache în timp ce actualizează în fundal
 */
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  // Creează o promisiune pentru actualizarea cache-ului
  const updateCachePromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      const cache = caches.open(CACHE_NAME);
      return cache.then(cache => {
        return cache.put(request, networkResponse.clone()).then(() => {
          return networkResponse;
        });
      });
    }
    return networkResponse;
  }).catch(error => {
    console.error('Failed to fetch:', error);
  });
  
  // Returnează din cache dacă există, altfel așteaptă răspunsul din rețea
  return cachedResponse || updateCachePromise;
}

/**
 * Verifică dacă request-ul este pentru o resursă statică
 */
function isAssetRequest(request) {
  return (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    /\.(css|js|woff2|jpg|png|svg|webp)$/.test(new URL(request.url).pathname)
  );
}

/**
 * Verifică dacă request-ul este către un API
 */
function isAPIRequest(request) {
  return (
    new URL(request.url).pathname.includes('/api/') ||
    request.url.includes('jsonplaceholder') ||
    request.headers.get('Accept')?.includes('application/json')
  );
}
