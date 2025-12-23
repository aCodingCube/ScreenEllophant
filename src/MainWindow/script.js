const { invoke } = window.__TAURI__.core;
const { convertFileSrc } = window.__TAURI__.core;
const { open } = window.__TAURI__.dialog;
const { emit } = window.__TAURI__.event;

async function sendMedia(path) {
  const isVideo =
    path.toLowerCase().endsWith("mp4") || path.toLowerCase().endsWith("webm");

  const assetUrl = convertFileSrc(path);
  await emit("preload_media", { url: assetUrl, isVideo: isVideo });
  console.log("preload_media: " + assetUrl);
}

async function addAssetsToGridDisplay(name) {
  const container = document.getElementById("container-left");
  const div = document.createElement("div");
  div.className = "grid-box";
  div.draggable = true;

  div.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text", name);
    e.dataTransfer.effectAllowed = "copy";
  });

  const p = document.createElement("p");
  p.innerText = name;

  div.appendChild(p);
  container.appendChild(div);
}

async function addAssetsToGridAction(name) {
  const container = document.getElementById("container-right");
  const div = document.createElement("div");
  div.className = "grid-box";

  div.addEventListener("click", (event) => {
    handleMediaClick(event, name);
  });

  const p = document.createElement("p");
  p.innerText = name;

  div.appendChild(p);
  container.appendChild(div);
}

async function load_asset_names() {
  const result = await invoke("load_asset_names");
  console.log("Load assets: {}", result);
  return result;
}

async function open_window() {
  await invoke("open_window");
}

//* Selection and Preloading

async function handleMediaClick(event, name) {
  const element = event.currentTarget;

  if (element.classList.contains("selected")) {
    deselectMedia(element);
    document.querySelectorAll('.playing').forEach(element => unmarkPlaying(element));
    markPlaying(element);

    let path = await invoke("get_file_src", { fileName: name });
    console.log("trigger_swap, name: " + name);
    await emit("trigger_swap");
  } else {
    if(element.classList.contains("playing"))
    {
      return;
    }
    document.querySelectorAll('.selected').forEach(element => deselectMedia(element));
    selectMedia(element);
    let path = await invoke("get_file_src", { fileName: name });
    await sendMedia(path);
  }
}

function selectMedia(element) {
  element.classList.add("selected");
  element.style.backgroundColor = "#34dbbfff";
}

function deselectMedia(element) {
  element.classList.remove("selected");
  element.style.backgroundColor = "#3498db";
}

function markPlaying(element) {
  element.classList.add("playing");
  element.style.backgroundColor = "#9534dbff";
}

function unmarkPlaying(element) {
  element.classList.remove("playing");
  element.style.backgroundColor = "#3498db";
}

//* Event-Listener
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("launchBtn").addEventListener("click", (e) => {
    open_window();
  });

  document.getElementById("loadBtn").addEventListener("click", async () => {
    document.getElementById("container-left").replaceChildren();
    const result = await load_asset_names();

    result.forEach((name) => {
      addAssetsToGridDisplay(name);
    });
  });

  const rightContainer = document.getElementById("container-right");

  rightContainer.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  rightContainer.addEventListener("drop", (event) => {
    event.preventDefault();
    const name = event.dataTransfer.getData("text");
    console.log("Retrieved: " + name);
    addAssetsToGridAction(name);
  });
});
