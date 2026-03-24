"use strict";
/**
 * @type {HTMLFormElement}
 */
const form = document.getElementById("uv-form");
/**
 * @type {HTMLInputElement}
 */
const address = document.getElementById("uv-address");
/**
 * @type {HTMLInputElement}
 */
const searchEngine = document.getElementById("uv-search-engine");
/**
 * @type {HTMLParagraphElement}
 */
const error = document.getElementById("uv-error");
// bro cmon WHY ARENT YOU WORKING
/**
 * @type {HTMLPreElement}
 */
//console.log("init test, if this shows up on the vps servers then you know this has worked")
const errorCode = document.getElementById("uv-error-code");
const username = document.getElementById("username");
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
var keyRegistered = false;
let frame = document.getElementById("uv-frame");
document.querySelectorAll("*").forEach(function (e) {
  e.addEventListener("keydown", function (ev) {
    // alert("hi, have recieved");
    if (ev.ctrlKey && ev.shiftKey && ev.code == "KeyZ") {
      // console.log("press");
      // Okay this will be funny...
      // To clarify that's the shortcut for signing out on Chromebook
      // :troll: js make sure not to press it twice

      frame.style.display = "none";
    }
  });
});
// const originalRequest = connection.request;

// connection.request = function (remote, method, body, headers, signal) {
//   console.log("Requesting URL:", remote);
//   return originalRequest.call(this, remote, method, body, headers, signal);
// };
// const original = connection.worker.channel.postMessage;
// connection.worker.channel.postMessage = function (message, transfer, options) {
//   console.log("hit");
//   return original.call(message, transfer, options);
// };
// Get your ip. Deal with it, it's a alternate way of making sure you guys aren't stupid.
let grabbers = [
  "https://api.ipify.org/?format=json",
  "https://www.my-ip-is.com/api/ip",
  "https://api.myip.com",
  "https://api.my-ip.io/v2/ip.json",
];
let ip = "";
(async () => {
  for (let grabber of grabbers) {
    // console.log("Using "+fetcher)
    if (await checkOne(grabber)) {
      break;
    }
  }
})();
async function checkOne(grabber) {
  let res = await fetch(grabber);
  let json = await res.json();
  //console.log(json.ip)
  ip = json.ip;
  window.ip = ip;
  return true;
}
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  // add a little spice to it.
  if (!keyRegistered) {
    keyRegistered = true;
    try {
      await registerSW();
    } catch (err) {
      error.textContent = "Failed to register service worker.";
      errorCode.textContent = err.toString();
      throw err;
    }
  }
  const url = search(address.value, searchEngine.value);
  if (username.value == "") {
    alert("Must enter a username, sorry!");
    return;
  }
  if (address.value == "") {
    alert(
      "Please type your search/URL into the space below the username field."
    );
    return;
  }
  H.identify(username.value);
  H.track("URL", address.value);
  H.startManualSpan("URL", { attributes: { url: address.value } }, (span) => {
    console.log(
      username.value,
      "visited",
      address.value,
      "IP is",
      ip,
      "h track"
    );
    span.end();
  });
  client.track("URL", { user: username.value, url: address.value });
  LDObserve.startSpan("URLGrab", (span) => {
    console.log(
      username.value,
      "visited",
      address.value,
      "IP is",
      ip,
      "man span"
    );
  });
  console.log(
    username.value,
    "visited",
    address.value,
    "IP is",
    ip,
    "normal tab"
  );
  // console.log(connection);
  let frame = document.getElementById("uv-frame");
  frame.style.display = "block";
  let wispUrl =
    (location.protocol === "https:" ? "wss" : "ws") +
    "://" +
    location.host +
    "/wisp/";
  if ((await connection.getTransport()) !== "/epoxy/index.mjs") {
    await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
  }
  frame.src = __uv$config.prefix + __uv$config.encodeUrl(url);
});
function newTab() {
  try {
    if (username.value == "") {
      alert("Must enter a username, sorry!");
      return;
    }
    if (address.value == "") {
      alert(
        "Please type your search/URL into the space below the username field."
      );
      return;
    }
    H.identify(username.value);
    const url = search(address.value, searchEngine.value);
    H.track("URL (New Tab)", address.value);
    H.startManualSpan(
      "URL (New Tab)",
      { attributes: { url: address.value } },
      (span) => {
        console.log(username.value, "visited", address.value, "IP is", ip, "h");
        span.end();
      }
    );
    client.track("URL (New Tab)", { user: username.value, url: address.value });
    console.log(username.value, "visited", address.value, "IP is", ip, "ntp");
    LDObserve.startSpan("URLGrab (New Tab)", (span) => {
      console.log(
        username.value,
        "visited",
        address.value,
        "IP is",
        ip,
        "ld span"
      );
    });
    window.open(__uv$config.prefix + __uv$config.encodeUrl(url), "_blank");
  } catch (e) {
    alert(e);
  }
}
