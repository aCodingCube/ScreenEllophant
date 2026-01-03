import { transitionToggle, editToggle } from "./script.js";

const { invoke } = window.__TAURI__.core;
const { convertFileSrc } = window.__TAURI__.core;
const { open } = window.__TAURI__.dialog;
const { emit } = window.__TAURI__.event;

export async function sendMedia(path, is_color) {
  if (is_color) {
    await emit("preload_media", {
      url: path, // color
      isVideo: false,
      isColor: true,
    });
    return;
  }

  const isVideo =
    path.toLowerCase().endsWith("mp4") || path.toLowerCase().endsWith("webm");

  const assetUrl = convertFileSrc(path);
  await emit("preload_media", {
    url: assetUrl,
    isVideo: isVideo,
    isColor: false,
  });
}

function isEditSelected(element) {
  if (element.classList.contains("editSelected")) {
    return true;
  }

  return false;
}

function isDisplaySelected(element) {
  if (element.classList.contains("displaySelected")) {
    return true;
  }

  return false;
}

function isPlaying(element) {
  if (element.classList.contains("playing")) {
    return true;
  }
  return false;
}

export function editDeselectAll() {
  const elements = document.querySelectorAll(".editSelected");
  elements.forEach((element) => {
    element.classList.remove("editSelected");
  });
}

function editSelect(element) {
  element.classList.add("editSelected");
}

function editDeselect(element) {
  element.classList.remove("editSelected");
}

export function displayDeselectAll(element) {
  const elements = document.querySelectorAll(".displaySelected");
  elements.forEach((element) => {
    element.classList.remove("displaySelected");
  });
}

export function displaySelect(element) {
  element.classList.add("displaySelected");
}

function displayDeselect(element) {
  element.classList.remove("displaySelected");
}

export function unmarkPlayingAll() {
  const elements = document.querySelectorAll(".playing");
  elements.forEach((element) => {
    element.classList.remove("playing");
  });
}

export function markPlaying(element) {
  element.classList.add("playing");
}

function unmarkPlaying(element) {
  element.classList.remove("playing");
}

export async function handleMediaClick(event, name) {
  const element = event.currentTarget;

  if (editToggle) {
    if (isEditSelected(element)) {
      return;
    }
    editDeselectAll();
    editSelect(element);
    return;
  }

  if (!editToggle) {
    if (!isDisplaySelected(element)) {
      displayDeselectAll();
      displaySelect(element);
      // preload media
      let path = await invoke("get_file_src", { fileName: name });
      sendMedia(path, false);
      return;
    }

    if (isDisplaySelected(element) && !isPlaying(element)) {
      displayDeselect(element);
      unmarkPlayingAll();
      markPlaying(element);
      // trigger element playing
      if (transitionToggle) {
        emit("trigger_swap");
        return;
      } else {
        emit("trigger_swap_cut");
        return;
      }
    }
    return;
  }
}

export function handleColorClick(event, color) {
  const element = event.currentTarget;

  if (editToggle) {
    if (isEditSelected(element)) {
      return;
    }
    editDeselectAll();
    editSelect(element);
    return;
  }

  if (!editToggle) {
    if (!isDisplaySelected(element)) {
      displayDeselectAll();
      displaySelect(element);
      // preload media
      sendMedia(color, true);
      return;
    }

    if (isDisplaySelected(element) && !isPlaying(element)) {
      displayDeselect(element);
      unmarkPlayingAll();
      markPlaying(element);
      // trigger element playing
      if (transitionToggle) {
        emit("trigger_swap");
        return;
      } else {
        emit("trigger_swap_cut");
        return;
      }
    }
    return;
  }
}

export function selectionModeChange() {
  if (editToggle) {
    const selected = document.querySelectorAll(".displaySelected");
    selected.forEach((element) => {
      element.classList.add("displaySelected-hidden");
      element.classList.remove("displaySelected");
    });
    const playing = document.querySelectorAll(".playing");
    playing.forEach((element) => {
      element.classList.add("playing-hidden");
      element.classList.remove("playing");
    });
    return;
  }

  if (!editToggle) {
    editDeselectAll();
    const selected = document.querySelectorAll(".displaySelected-hidden");
    selected.forEach((element) => {
      element.classList.add("displaySelected");
      element.classList.remove("displaySelected-hidden");
    });
    const playing = document.querySelectorAll(".playing-hidden");
    playing.forEach((element) => {
      element.classList.add("playing");
      element.classList.remove("playing-hidden");
    });
  }
}

// for keyboard use

export async function displaySelectMedia(element) {
  if (editToggle) {
    return;
  }

  if (isDisplaySelected(element)) {
    return;
  }

  displayDeselectAll();
  displaySelect(element.firstChild);
  // preload media
  if (element.is_color) {
    sendMedia(element.src, true);
    return;
  }

  let path = await invoke("get_file_src", { fileName: element.src });
  sendMedia(path, false);
}

export function playingElement(element) {
  if (editToggle) {
    return;
  }

  if (!isDisplaySelected(element) || isPlaying(element)) {
    return;
  }

  editDeselect(element);
  unmarkPlayingAll();
  markPlaying(element);

  // trigger element playing
  if (transitionToggle) {
    emit("trigger_swap");
    return;
  } else {
    emit("trigger_swap_cut");
    return;
  }
}
