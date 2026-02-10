/**
 * Service Worker per PWA
 * Gestisce cache e funzionamento offline
 */

const CACHE_NAME = "gestione-tecnici-v1";
const STATIC_CACHE = "static-v1";
const DYNAMIC_CACHE = "dynamic-v1";

// Assets da cachare immediatamente
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

// Installazione Service Worker
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[SW] Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Forza attivazione immediata
  self.skipWaiting();
});

// Attivazione Service Worker
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Prendi controllo di tutte le pagine immediatamente
  return self.clients.claim();
});

// Intercetta richieste di rete
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora richieste non-GET
  if (request.method !== "GET") {
    return;
  }

  // Ignora richieste a domini esterni (eccetto API)
  if (url.origin !== self.location.origin && !url.pathname.startsWith("/api")) {
    return;
  }

  // Strategia: Network First per API, Cache First per assets
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/trpc")) {
    // Network First per API (dati sempre aggiornati)
    event.respondWith(networkFirstStrategy(request));
  } else {
    // Cache First per assets statici (performance)
    event.respondWith(cacheFirstStrategy(request));
  }
});

// Strategia Cache First
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log("[SW] Serving from cache:", request.url);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    // Cachea solo risposte valide
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error("[SW] Fetch failed:", error);
    
    // Fallback per pagine HTML
    if (request.headers.get("accept").includes("text/html")) {
      return caches.match("/");
    }
    
    throw error;
  }
}

// Strategia Network First
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cachea risposta per uso offline
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log("[SW] Network failed, trying cache:", request.url);
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Background Sync per operazioni offline
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag);
  
  if (event.tag === "sync-appointments") {
    event.waitUntil(syncAppointments());
  }
});

async function syncAppointments() {
  // TODO: Implementare sincronizzazione appuntamenti
  console.log("[SW] Syncing appointments...");
}

// Push Notifications
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received");
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Gestione Tecnici";
  const options = {
    body: data.body || "Nuovo aggiornamento disponibile",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: data.data || {},
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Click su notifica
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked");
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || "/")
  );
});
