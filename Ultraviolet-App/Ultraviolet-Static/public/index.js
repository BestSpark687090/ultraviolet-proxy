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
/**
 * @type {HTMLPreElement}
 */
const errorCode = document.getElementById("uv-error-code");
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
var keyRegistered = false;
let frame = document.getElementById("uv-frame");
document.querySelectorAll("*").forEach(function (e) {
  e.addEventListener("keydown", function (ev) {
    // alert("hi, have recieved");
    debugger;
    if (ev.ctrlKey && ev.shiftKey && ev.code == "KeyZ") {
      // console.log("press");
      // Okay this will be funny...
      // To clarify that's the shortcut for signing out on Chromebook
      // :troll: js make sure not to press it twice

      frame.style.display = "none";
    }
  });
});
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
  H.startManualSpan("URL", { attributes: { url: address.value } }, (span) => {
    console.log("hi!");
    span.end();
  });

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
    const url = search(address.value, searchEngine.value);
    H.startManualSpan(
      "URL (New Tab)",
      { attributes: { url: address.value } },
      (span) => {
        console.log("hi!");
        span.end();
      }
    );
    window.open(__uv$config.prefix + __uv$config.encodeUrl(url), "_blank");
  } catch (e) {
    alert(e);
  }
}
