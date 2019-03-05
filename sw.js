importScripts("/assets/js/localforage.min.js"); // IndexedDB library

//Change value to update the cache and clear older files.
const CACHE_VERSION = "offline_cache_v1";

//All the files we want to cache
const cacheAssets = [
  "/",
  "/index.html",
  "/postData.html",
  "/assets/images/icon-512.png",
  "/assets/js/main.js",
  "/assets/js/bootstrap.min.js",
  "/assets/js/jquery-3.3.1.min.js",
  "/assets/js/localforage.min.js",
  "/assets/css/bootstrap.min.css",
];


// Call install event
self.addEventListener("install", event => {
  // Tell the browser to wait until the promise is finished
  event.waitUntil(
    caches
    .open(CACHE_VERSION)
    .then(cache => {
      console.log("ServiceWorker : Caching files");
      cache.addAll(cacheAssets);
      // cacheAssets.forEach(asset => {
      //   cache.add(asset)
      //     .catch(() => console.log("Failed to cache: ", asset));
      // });
    })
    .then(() => {
      console.log("Files cached");
      console.log("Service Worker: Installed");
    })
    .catch(error => console.log("Installation failed: ", error))
  );
});


// Call activate event
self.addEventListener("activate", event => {
  console.log("ServiceWorker: Activated");
  // Remove unwanted caches
  event.waitUntil(
    caches.keys()
    .then(cacheVersions => {
      return Promise.all(
        cacheVersions.map(cache => {
          if (cache !== CACHE_VERSION) {
            console.log("Service Worker clearing old cache: ", cache);
            return caches.delete(cache);
          }
        })
      );
    })
    .catch(error => console.log("Activation failed: ", error))
  );
});


// Fetch event
self.addEventListener("fetch", event => {
  if (event.request.method === 'GET') {
    event.respondWith(
      // Check all the caches in the browser and find
      // out whether our request is in any of them
      caches.match(event.request)
      .then(response => {
        if (response)
          console.log("response from cache", response.url);
        else
          console.log("response from fetch", event.request.clone().url);
        return response || fetch(event.request);
      })
    );
  }
});

// Sync event
self.addEventListener('sync', event => {
  console.log('Now online, sync event fired');
  // event.tag name must be the same as the one used while registering sync
  if (event.tag === "postData") {
    event.waitUntil(
      // Send our POST request to the server, now that the user is online
      localforage.length()
      .then(numberOfKey => {
        if (numberOfKey) {
          localforage.iterate((data, key, iterationNumber) => {
              console.log("Sync post:", key, data, "iteration: ", iterationNumber);
              sendPostToServer(key, data);
            })
            .then(() => notifyClient("true"))
            .catch(() => {
              notifyClient("false");
              throw error;
            })
        }
      })
    )
  }
});

function sendPostToServer(key, request) {
  fetch(request.url, {
      method: request.method,
      headers: request.header,
      body: JSON.stringify(request.payload),
    })
    .then(response => {
      console.log("Server response: ", response.status);
      if (response.status < 400) {
        localforage.removeItem(key);
      }
      return response;
    })
    .catch(error => {
      // This will be triggered if the network is still down. 
      // The request will be replayed again the next time the service worker starts up.
      console.log("POST to sever failed : ", error);
      // Since we are in a catch, it is important an error is thrown,
      // so the background sync knows to keep retrying sending to server.
      throw error;
    });
}

// Notify the client 
function notifyClient(confirmation) {
  const channel = new BroadcastChannel('sw-confirmation');
  channel.postMessage({
    confirmation: confirmation
  });
}
