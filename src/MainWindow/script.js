const { invoke } = window.__TAURI__.core;
const { convertFileSrc } = window.__TAURI__.core;
const { open } = window.__TAURI__.dialog;
const { emit } = window.__TAURI__.event;

import {
  sendMedia,
  selectMedia,
  deselectMedia,
  markPlaying,
  unmarkPlaying,
  handleMediaClick,
} from "./ui_grid_logic.js";

// add assets to left "display" grid
async function addAssetsToGridDisplay(name) {
  const container = document.getElementById("container-left");
  const div = document.createElement("div");
  div.className = "grid-box";
  div.draggable = true;

  div.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("application/x-screen-monkey", name);
    e.dataTransfer.effectAllowed = "copy";
  });

  const p = document.createElement("p");
  p.innerText = name;

  div.appendChild(p);
  container.appendChild(div);
}

// add assets to right "action" grid
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

//* Event-Listener
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("launchBtn").addEventListener("click", async (e) => {
    await invoke("open_window");
  });

  // load assets
  document.getElementById("loadBtn").addEventListener("click", async () => {
    document.getElementById("container-left").replaceChildren();
    const result = await invoke("load_asset_names");

    result.forEach((name) => {
      addAssetsToGridDisplay(name);
    });
  });

  // drops
  const rightContainer = document.getElementById("container-right");

  rightContainer.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  rightContainer.addEventListener("drop", (event) => {
    event.preventDefault();
    const name = event.dataTransfer.getData("application/x-screen-monkey");
    if (!name || name.trim() === "") {
      return;
    }
    addAssetsToGridAction(name);
  });
});
