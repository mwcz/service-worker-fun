// Promise.race is no good to us because it rejects if
// a promise rejects before fulfilling. Let's make a proper
// race function:
const CACHE_NAME = 'v1';
const urlsToCache = [
    "/",
    "/node_modules/@patternfly/pfelement/dist/pfelement.min.css",
    "/node_modules/@patternfly/pfe-styles/dist/pfe-layouts.min.css",
    "/main.css",
    "/main.js",
    "/node_modules/@patternfly/pfe-band/dist/pfe-band.min.js",
    "/node_modules/@patternfly/pfe-card/dist/pfe-card.min.js",
    "/node_modules/@patternfly/pfelement/dist/pfelement.min.js",
    "/images/cat-1.webp",
    "/images/cat-2.webp",
    "/images/cat-3.webp",
    "/images/cat-4.webp",
    "/images/cat-5.webp",
    "/images/cat-6.webp",
    "/images/cat-7.webp",
    "/images/cat-8.webp",
    "/images/cat-9.webp",
    "/images/cat-10.webp",
    "/images/cat-11.webp",
    "/images/cat-12.webp",
];

self.addEventListener('install', function(event) {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(function(cache) {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
        })
    );
});

function promiseAny(request, promises) {
    return new Promise((resolve, reject) => {
        // make sure promises are all promises
        promises = promises.map(p => Promise.resolve(p));
        // resolve this promise as soon as one resolves
        promises.forEach(p => {
            // resolve promise _only_ if the response is defined.  cache.match
            // returns undefined responses instead of throwing.
            p.then(response => {
                console.log(`${p.type} responded for ${request.url}`);
                if (response) {
                    const clonedResponse = response.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, clonedResponse);
                        resolve(response);
                    });
                }
            });
        });
        // reject if all promises reject
        promises.reduce((a, b) => a.catch(() => b))
            .catch(() => {
                reject(Error("All failed"))
            });
    });
};

self.addEventListener('fetch', function(event) {
    console.log(`fetching ${event.request.url}`);
    const fromCache = caches.match(event.request);
    fromCache.type = "cache";
    const fromNetwork = fetch(event.request);
    fromNetwork.type = "network";

    event.respondWith(
        promiseAny(
            event.request,
            [
                fromCache,
                fromNetwork
            ]
        )
    );
});
