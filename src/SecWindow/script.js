const { getCurrentWebviewWindow } = window.__TAURI__.webviewWindow;
const { listen } = window.__TAURI__.event;

const appWindow = getCurrentWebviewWindow();
const cue = {};
let isSwapping = false;
let triedLoading = false;

listen("preload_media", (event) => {
  console.log("isSwapping: " + isSwapping);
  if (isSwapping) {
    cue[0] = event.payload.url;
    cue[1] = event.payload.isVideo;
    return;
  }
  // else
  const { url, isVideo } = event.payload;
  const bufferSlot = document.querySelector(".media-slot:not(.active)");

  if (!bufferSlot) return;

  if (isVideo) {
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.preload = "auto";

    bufferSlot.appendChild(video);
  } else {
    const img = document.createElement("img");
    img.src = url;

    bufferSlot.appendChild(img);
  }
});

function preloadCue() {
  const bufferSlot = document.querySelector(".media-slot:not(.active)");

  if (!bufferSlot) return;
  const url = cue[0];
  console.log("Called back to " + url);
  const isVideo = cue[1];

  if (isVideo) {
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.preload = "auto";

    video.onloadeddata = () => {
      bufferSlot.innerHTML = "";
      bufferSlot.appendChild(video);
      checkAndSwap();
    };
  } else {
    const img = document.createElement("img");
    img.src = url;

    img.onload = () => {
      bufferSlot.innerHTML = "";
      bufferSlot.appendChild(img);
      checkAndSwap();
    };
  }
}

function checkAndSwap() {
  if (triedLoading) {
    triedLoading = false;

    requestAnimationFrame(() => {
      setTimeout(triggerSwap, 20);
    });
  }
}

listen("trigger_swap", () => {
  triggerSwap();
});

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
    "transitionend",
    () => {
      console.log("Finished transition!");
      oldSlot.innerHTML = "";
      isSwapping = false;
      preloadCue();
    },
    { once: true }
  );
}

window.addEventListener("DOMContentLoaded", add_eventListener);

function add_eventListener() {
  window.addEventListener("keydown", async (event) => {
    console.log(event.key);
    if (event.key == "Escape") {
      await appWindow.close();
    }
  });
}
