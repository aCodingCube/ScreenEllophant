const { getCurrentWebviewWindow } = window.__TAURI__.webviewWindow;
const { listen } = window.__TAURI__.event;

import { transitionToggle } from "../MainWindow/script.js";

const audioCtx = new AudioContext();
const appWindow = getCurrentWebviewWindow();
let cueIsValid = false;
let isSwapping = false;
let triedLoading = false;

const fadeDurationMS = 1000;

const audioSources = {};
const gainNodes = [audioCtx.createGain(), audioCtx.createGain()];
gainNodes[0].connect(audioCtx.destination);
gainNodes[1].connect(audioCtx.destination);
let audioSourceCounter = 0;

//* public Media state
export const cue = {
  payload: {},
};

//* listen for emit-signals
//* loading and preloading

// listen for preload
listen("preload_media", (event) => {
  // buffering state in pub state
  const snapshot = structuredClone(event.payload);
  console.log("Check snapshot: " + snapshot);
  console.log("Verfügbare Keys im Snapshot:", Object.keys(snapshot));
  cue.payload = snapshot;
  console.log("cue: " + cue.payload + " test: url-> " + cue.payload.url);

  if (isSwapping) {
    // if currently swapping -> load to cue
    cueIsValid = true;
    return;
  }

  // else
  const { url, isVideo, isColor, isLooped } = snapshot;
  const bufferSlot = document.querySelector(".media-slot:not(.active)");
  bufferSlot.innerHTML = "";

  if (!bufferSlot) return;

  if (isVideo) {
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.preload = "auto";
    video.loop = isLooped;
    video.crossOrigin = "anonymous";

    console.log(
      "video counter added! video.loop: " +
        video.loop +
        " isLooped: " +
        isLooped,
    );
    video.counter = audioSourceCounter;
    audioSourceCounter = audioSourceCounter == 0 ? 1 : 0;

    audioSources[video.counter] = audioCtx.createMediaElementSource(video);
    audioSources[video.counter].connect(gainNodes[video.counter]);

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
  const activeVideo = activeSlot.querySelector("video");
  if (activeVideo) {
    const currentTime = audioCtx.currentTime;
    gainNodes[activeVideo.counter].gain.setValueAtTime(0, currentTime);
    activeVideo.pause();
    audioSources[activeVideo.counter].disconnect();
  }
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

  const oldVideo = oldSlot.querySelector("video");
  if (oldVideo) {
    const fadeSeconds = Number((fadeDurationMS / 1000).toFixed(2));
    const currentTime = audioCtx.currentTime;
    gainNodes[oldVideo.counter].gain.setValueAtTime(1, currentTime);
    gainNodes[oldVideo.counter].gain.linearRampToValueAtTime(
      0,
      currentTime + fadeSeconds,
    );
  }

  const video = newSlot.querySelector("video");
  if (video) {
    video.play().catch(() => {});
    const currentTime = audioCtx.currentTime;
    const fadeSeconds = Number((fadeDurationMS / 1000).toFixed(2));
    gainNodes[video.counter].gain.setValueAtTime(0, currentTime);
    video.muted = false;
    gainNodes[video.counter].gain.linearRampToValueAtTime(
      1,
      currentTime + fadeSeconds,
    );
  }

  setTimeout(() => {
    if (oldVideo) {
      oldVideo.pause();
      audioSources[oldVideo.counter].disconnect();
    }
    oldSlot.innerHTML = "";
    isSwapping = false;
    if (cueIsValid) {
      preloadCue();
    }
  }, 1000);
}

function triggerSwapCut() {
  const oldSlot = document.querySelector(".media-slot.active");
  const newSlot = document.querySelector(".media-slot:not(.active)");

  newSlot.style.visibility = "visible";
  newSlot.classList.add("no-transition");
  newSlot.classList.add("active");

  const video = newSlot.querySelector("video");
  const oldVideo = oldSlot.querySelector("video");

  if (oldVideo) {
    const currentTime = audioCtx.currentTime;
    gainNodes[oldVideo.counter].gain.setValueAtTime(0, currentTime);
    oldVideo.pause();
    audioSources[oldVideo.counter].disconnect();
  }

  if (video) {
    video.play().catch(() => {});
    const currentTime = audioCtx.currentTime;
    gainNodes[video.counter].gain.setValueAtTime(1, currentTime);
    video.muted = false;
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
  const { url, isVideo, isColor, isLooped } = cue.payload;
  console.log("isLooped cue: " + isLooped);
  cueIsValid = false;

  if (isVideo) {
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";
    video.loop = isLooped;

    console.log("preload video via cue!");

    video.counter = audioSourceCounter;
    audioSourceCounter = audioSourceCounter == 0 ? 1 : 0;

    audioSources[video.counter] = audioCtx.createMediaElementSource(video);
    audioSources[video.counter].connect(gainNodes[video.counter]);

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

window.addEventListener("contextmenu", (e) => e.preventDefault());

window.addEventListener("keydown", async (event) => {
  event.preventDefault();
  switch (event.key) {
    case "Escape":
      await appWindow.close();
      break;
  }
});
