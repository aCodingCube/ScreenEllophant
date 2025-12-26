const { getCurrentWebviewWindow } = window.__TAURI__.webviewWindow;
const { listen } = window.__TAURI__.event;

const appWindow = getCurrentWebviewWindow();
const cue = {};
let cueIsValid = false;
let isSwapping = false;
let triedLoading = false;

//* listen for emit-signals
//* loading and preloading

// listen for preload
listen("preload_media", (event) => {
  if (isSwapping) {
    // if currently swapping -> load to cue
    cue[0] = event.payload.url;
    cue[1] = event.payload.isVideo;
    cue[2] = event.payload.isColor;
    cueIsValid = true;
    return;
  }
  // else
  const { url, isVideo, isColor } = event.payload;
  const bufferSlot = document.querySelector(".media-slot:not(.active)");
  bufferSlot.innerHTML = "";

  if (!bufferSlot) return;

  if (isVideo) {
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.preload = "auto";

    bufferSlot.appendChild(video); // create video to display to
  } else if (isColor) {
    const div = document.createElement("div");
    div.style.backgroundColor = url;
  } else {
    const img = document.createElement("img");
    img.src = url;
    bufferSlot.appendChild(img); // create img to display to
  }
});
// listen for swap
listen("trigger_swap", () => {
  triggerSwap();
});

// logic for trigger_swap
function triggerSwap() {
  if (isSwapping) {
    triedLoading = true;
    return;
  }

  isSwapping = true;

  const oldSlot = document.querySelector(".media-slot.active");
  const newSlot = document.querySelector(".media-slot:not(.active)");

  oldSlot.classList.remove("active");
  newSlot.classList.add("active");

  const video = newSlot.querySelector("video");
  if (video) {
    video.play().catch(() => {});
  }

  oldSlot.addEventListener(
    // when transition finished -> clear html + is there new cue?
    "transitionend",
    () => {
      oldSlot.innerHTML = "";
      isSwapping = false;
      if (cueIsValid) {
        preloadCue();
      }
    },
    { once: true }
  );
}

//* cue system

// preload from cue
function preloadCue() {
  const bufferSlot = document.querySelector(".media-slot:not(.active)");

  if (!bufferSlot) return;
  // load cue into bufferSlot
  const url = cue[0];
  const isVideo = cue[1];
  const isColor = cue[2];
  cueIsValid = false;

  if (isVideo) {
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.preload = "auto";

    video.onloadeddata = () => {
      bufferSlot.innerHTML = "";
      bufferSlot.appendChild(video); // add video to bufferSlot
      checkAndSwap(); // check if instant load/trigger_swap is required
    };
  } else if (isColor) {
    const div = document.createElement("div");
    div.style.backgroundColor = url;
  } else {
    const img = document.createElement("img");
    img.src = url;

    img.onload = () => {
      bufferSlot.innerHTML = "";
      bufferSlot.appendChild(img); // add img to bufferSlot
      checkAndSwap(); // check if instant load/trigger_swap is required
    };
  }
}

// check new swap is required
function checkAndSwap() {
  if (triedLoading) {
    triedLoading = false;

    requestAnimationFrame(() => {
      setTimeout(triggerSwap, 20);
    });
  }
}

window.addEventListener("DOMContentLoaded", add_eventListener);

function add_eventListener() {
  window.addEventListener("keydown", async (event) => {
    if (event.key == "Escape") {
      await appWindow.close();
    }
  });
}
