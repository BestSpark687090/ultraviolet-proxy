"use strict";

const form = document.getElementById("uv-form");
const address = document.getElementById("uv-address");
const searchEngine = document.getElementById("uv-search-engine");
const error = document.getElementById("uv-error");
const errorCode = document.getElementById("uv-error-code");
const username = document.getElementById("username");
const frame = document.getElementById("uv-frame");

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
let keyRegistered = false;

// Start fetching IP early so it's ready by the time user submits
const ipPromise = getIP();

async function getIP() {
  const grabbers = [
    "https://api.ipify.org/?format=json",
    "https://www.my-ip-is.com/api/ip",
    "https://api.myip.com",
    "https://api.my-ip.io/v2/ip.json",
  ];
  for (const grabber of grabbers) {
    try {
      const res = await fetch(grabber);
      const json = await res.json();
      if (json.ip) return json.ip;
    } catch {}
  }
  return "";
}

// Single keydown listener on document instead of every element
document.addEventListener("keydown", (ev) => {
  if (ev.ctrlKey && ev.shiftKey && ev.code === "KeyZ") {
    frame.style.display = "none";
  }
});

async function handleNav(isNewTab = false) {
  if (!username.value) return alert("Must enter a username, sorry!");
  if (!address.value) return alert("Please type your search/URL into the space below the username field.");

  const url = search(address.value, searchEngine.value);
  const ip = await ipPromise;
  const label = isNewTab ? "URL (New Tab)" : "URL";

  fetch("/reportURL", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: username.value, url: address.value, newTab: isNewTab }),
  });

  H.identify(username.value);
  H.track(label, address.value);
  H.startManualSpan(label, { attributes: { url: address.value } }, (span) => {
    console.log(username.value, "visited", address.value, "IP is", ip);
    span.end();
  });
  client.track(label, { user: username.value, url: address.value });
  LDObserve.startSpan(`${label}Grab`, (span) => {
    console.log(username.value, "visited", address.value, "IP is", ip);
  });
  console.log(username.value, "visited", address.value, "IP is", ip);

  if (isNewTab) {
    window.open(__uv$config.prefix + __uv$config.encodeUrl(url), "_blank");
  } else {
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
    frame.style.display = "block";
    const wispUrl = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/wisp/`;
    if ((await connection.getTransport()) !== "/epoxy/index.mjs") {
      await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
    }
    frame.src = __uv$config.prefix + __uv$config.encodeUrl(url);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await handleNav(false);
});

function newTab() {
  try {
    handleNav(true);
  } catch (e) {
    alert(e);
  }
}
