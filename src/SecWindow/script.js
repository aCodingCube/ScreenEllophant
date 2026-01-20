const { getCurrentWebviewWindow } = window.__TAURI__.webviewWindow;
const { listen } = window.__TAURI__.event;

import { transitionToggle } from "../MainWindow/script.js";

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

  cue[0] = event.payload.url;
  cue[1] = event.payload.isVideo;
  cue[2] = event.payload.isColor;

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
    div.style.width = "100%";
    div.style.height = "100%";

    bufferSlot.style.visibility = "hidden";
    bufferSlot.innerHTML = "";
    bufferSlot.appendChild(div);
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

listen("trigger_swap_cut", () => {
  triggerSwapCut();
});

listen("black_out", () => {
  const activeSlot = document.querySelector(".media-slot.active");
  activeSlot.innerHTML = "";

  const div = document.createElement("div");
  div.style.backgroundColor = "black";
});

listen("black_out_fade", () => {
  const bufferSlot = document.querySelector(".media-slot:not(.active)");
  const bufferCopy = bufferSlot;
  bufferSlot.innerHTML = "";
  const div = document.createElement("div");
  div.style.backgroundColor = "black";
  div.style.width = "100%";
  div.style.height = "100%";
  bufferSlot.style.visibility = "hidden";
  bufferSlot.appendChild(div);

  cueIsValid = true;

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

  newSlot.style.visibility = "visible";
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

function triggerSwapCut() {
  const oldSlot = document.querySelector(".media-slot.active");
  const newSlot = document.querySelector(".media-slot:not(.active)");

  newSlot.style.visibility = "visible";
  newSlot.classList.add("no-transition");
  newSlot.classList.add("active");

  const video = newSlot.querySelector("video");

  if (video) {
    video.play().catch(() => {});
  }

  oldSlot.classList.remove("active");
  oldSlot.innerHTML = "";

  setTimeout(() => {
    newSlot.classList.remove("no-transition");
  }, 50);

  if (cueIsValid) {
    preloadCue();
  }
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
    div.style.width = "100%";
    div.style.height = "100%";
    bufferSlot.style.visibility = "hidden";
    bufferSlot.innerHTML = "";
    bufferSlot.appendChild(div);
    checkAndSwap();
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

    if (transitionToggle) {
      requestAnimationFrame(() => {
        setTimeout(triggerSwap, 20);
      });
      return;
    }

    requestAnimationFrame(() => {
      setTimeout(triggerSwapCut, 20);
    });
    return;
  }
}

window.addEventListener("DOMContentLoaded", add_eventListener);

window.addEventListener("contextmenu", (e) => e.preventDefault());

function add_eventListener() {
  window.addEventListener("keydown", async (event) => {
    event.preventDefault();
    if (event.key == "Escape") {
      await appWindow.close();
    }
  });
}
