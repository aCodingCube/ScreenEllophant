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

export function selectMedia(element) {
  element.classList.add("selected");
}

export function deselectMedia(element) {
  element.classList.remove("selected");
}

export function markPlaying(element) {
  element.classList.add("playing");
}

export function unmarkPlaying(element) {
  element.classList.remove("playing");
}

export async function handleMediaClick(event, name) {
  const element = event.currentTarget;

  if (element.classList.contains("selected")) {
    deselectMedia(element);
    document
      .querySelectorAll(".playing")
      .forEach((element) => unmarkPlaying(element));
    markPlaying(element);
    await emit("trigger_swap");
  } else {
    if (element.classList.contains("playing")) {
      return;
    }
    document
      .querySelectorAll(".selected")
      .forEach((element) => deselectMedia(element));
    selectMedia(element);
    let path = await invoke("get_file_src", { fileName: name });
    await sendMedia(path, false);
  }
}

export async function handleColorClick(event, color) {
  const element = event.currentTarget;

  if (element.classList.contains("selected")) {
    deselectMedia(element);
    document
      .querySelectorAll(".playing")
      .forEach((element) => unmarkPlaying(element));
    markPlaying(element);
    await emit("trigger_swap");
  } else {
    if (element.classList.contains("playing")) {
      return;
    }
    document
      .querySelectorAll(".selected")
      .forEach((element) => deselectMedia(element));
    selectMedia(element);
    await sendMedia(color, true);
  }
}
