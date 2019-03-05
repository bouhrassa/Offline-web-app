var globalKey = 1;

function generatePostKey() {
  return "Post_" + globalKey++;
}

window.addEventListener("DOMContentLoaded", () => {
  if (navigator.serviceWorker) {
    // Service worker registration
    navigator.serviceWorker
      .register("/sw.js")
      .then(registration => {
        console.log("Service Worker registration was successful with scope: ", registration.scope);
        return navigator.serviceWorker.ready
      })
      // Sync Post event registration
      .then(registration => {
        console.log("Service Worker ready");
        let form = document.getElementById("postForm");
        if (form) {
          document.addEventListener("submit", event => {
            event.preventDefault();
            const titleField = form.querySelector("#title");
            const messageField = form.querySelector("#message");
            const payload = {
              title: titleField.value,
              message: messageField.value
            }
            savePostRequest(payload)
              .then(() => {
                titleField.value = "";
                messageField.value = "";
                return registration.sync.register("postData");
              })
              .catch("Failed to register sync");
          })
        }
      })
      .then(() => {
        navigator.serviceWorker.ready
          .then(registration => registration.sync.register("postData"));
      })
      .catch(error => console.log("Registration failed with error: ", error));
  }
});

async function savePostRequest(payload) {
  const key = generatePostKey();
  const request = {
    url: "https://jsonplaceholder.typicode.com/posts",
    payload: payload,
    method: 'POST',
    header: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
  return localforage.setItem(key, request)
    .then(value => console.log("value store:", value))
};

const channel = new BroadcastChannel('sw-confirmation');
channel.addEventListener('message', event => {
  console.log('Received message from serviceWorker');
  let confirmation = event.data.confirmation;
  if (confirmation) {
    $("#success-alert").fadeTo(3000, 500).slideUp(500, () => {
      $("#success-alert").slideUp(500);
    });
  } else {
    $("#danger-alert").fadeTo(3000, 500).slideUp(500, () => {
      $("#danger-alert").slideUp(500);
    });
  }
});
