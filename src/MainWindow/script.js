const { invoke } = window.__TAURI__.core;
const { convertFileSrc } = window.__TAURI__.core;
const { open } = window.__TAURI__.dialog;
const { emit } = window.__TAURI__.event;

async function choose_file() {
  // choose files
  const selected = await open({
    multiple: false,
    filters: [
      {
        name: "Media",
        extensions: ["png", "jpg", "jpeg", "mp4", "webm", "ogg"],
      },
    ],
  });

  if (selected) {
    const assetUrl = convertFileSrc(selected);

    const isVideo =
      selected.toLowerCase().endsWith("mp4") ||
      selected.toLowerCase().endsWith("webm");

    await emit("new_media", { url: assetUrl, isVideo: isVideo });
    console.log("Send new media: " + assetUrl);
  }
}

async function sendMedia(path) {
  const isVideo =
    path.toLowerCase().endsWith("mp4") || path.toLowerCase().endsWith("webm");

  const assetUrl = convertFileSrc(path);
  await emit("new_media", { url: assetUrl, isVideo: isVideo });
  console.log("Send new media: " + assetUrl);
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

  div.addEventListener("dblclick", async () => {
    let path = await invoke("get_file_src", { fileName: name });
    console.log("sendMedia(" + path + ")");
    await sendMedia(path);
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

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("launchBtn").addEventListener("click", (e) => {
    open_window();
  });

  document.getElementById("imgBtn").addEventListener("click", (e) => {
    choose_file();
  });

  document.getElementById("loadBtn").addEventListener("click", async () => {
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
