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

import {
  addGridTemplates,
  addMoveTemplate,
  removeMoveTemplate,
  addGhostMoveTemplate,
  removeGhostMoveTemplate,
} from "./ui_action_grid.js";

import { auto_save, load_save } from "./auto_save.js";

import { createThumbnail } from "./thumbnails.js";

export let editToggle = false;
let assetToggle = true;
export let transitionToggle = true;

// add assets to left "display" grid
async function addAssetsToGridDisplay(name) {
  const container = document.getElementById("container-left");
  const div = document.createElement("div");
  div.className = "grid-box";
  div.draggable = editToggle;

  const img = document.createElement("img");
  img.src = await createThumbnail(name);
  img.draggable = false;

  div.addEventListener("dragstart", (e) => {
    if (editToggle) {
      removeMoveTemplate();
      addMoveTemplate();
    }
    e.dataTransfer.setData("application/x-screen-monkey", name);
    e.dataTransfer.setData("application/src-screen-monkey", name);
    e.dataTransfer.setData("application/imgSrc-screen-monkey", img.src);
    e.dataTransfer.effectAllowed = "copy";
  });

  div.addEventListener("dragend", () => {
    if (editToggle) {
      removeMoveTemplate();
    }
  });

  const p = document.createElement("p");
  p.innerText = name;

  div.appendChild(p);
  div.appendChild(img);
  container.appendChild(div);
}

async function addColorToGridDisplay(color) {
  const container = document.getElementById("container-left");
  const div = document.createElement("div");
  div.className = "grid-box";
  div.draggable = editToggle;
  div.style.backgroundColor = color;

  div.addEventListener("dragstart", (e) => {
    if (editToggle) {
      removeMoveTemplate();
      addMoveTemplate();
    }
    e.dataTransfer.setData("application/color-screen-monkey", color);
    e.dataTransfer.effectAllowed = "copy";
  });

  div.addEventListener("dragend", () => {
    if (editToggle) {
      removeMoveTemplate();
    }
  });

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

  document.getElementById("templateBtn").addEventListener("click", () => {
    if (!editToggle) {
      return;
    }
    addGridTemplates(5);
    addGhostMoveTemplate();
  });

  document.getElementById("assetToggle").addEventListener("click", () => {
    if (assetToggle) {
      assetToggle = false;
      document.getElementById("box-left").style.display = "none";
    } else {
      assetToggle = true;
      document.getElementById("box-left").style.display = "block";
    }
  });

  document.getElementById("editToggle").addEventListener("click", (event) => {
    if (editToggle) {
      editToggle = false;
      event.currentTarget.style.backgroundColor = "red";
      removeMoveTemplate();
      const elements = document.querySelectorAll(".grid-box-content");
      elements.forEach((element) => {
        element.draggable = false;
      });
      elements = document.querySelectorAll(".grid-box");
      elements.forEach(element => {
        element.draggable = false;
      });
    } else {
      editToggle = true;
      event.currentTarget.style.backgroundColor = "green";
      const elements = document.querySelectorAll(".grid-box-content");
      elements.forEach((element) => {
        element.draggable = true;
      });
      elements = document.querySelectorAll(".grid-box");
      elements.forEach(element => {
        element.draggable = true;
      });
    }
  });

  document.getElementById("colorBtn").addEventListener("click", () => {
    const input = document.getElementById("colorInput");
    addColorToGridDisplay(input.value);
  });

  document.getElementById("blackoutBtn").addEventListener("click",()=>{
    emit("black_out");
  })

  document.getElementById("transitionToggle").addEventListener("click",(event)=>{
    if(transitionToggle) {
      transitionToggle = false;
      event.currentTarget.style.backgroundColor = "red";
    }
    else {
      transitionToggle = true;
      event.currentTarget.style.backgroundColor =  "green";
    }
  });


  document.getElementById("editToggle").style.backgroundColor = "red";
  document.getElementById("transitionToggle").style.backgroundColor = "green";
});
