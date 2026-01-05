const { invoke } = window.__TAURI__.core;
const { convertFileSrc } = window.__TAURI__.core;
const { open } = window.__TAURI__.dialog;
const { emit } = window.__TAURI__.event;

import {
  addGridTemplates,
  addMoveTemplate,
  removeMoveTemplate,
  addGhostMoveTemplate,
  removeGhostMoveTemplate,
  layout,
} from "./ui_action_grid.js";

import { auto_save, load_save } from "./auto_save.js";

import { createThumbnail } from "./thumbnails.js";
import {
  selectionModeChange,
  unmarkPlayingAll,
  editDeselectAll,
  displayDeselectAll,
} from "./ui_grid_logic.js";
import { keyRightArrow, keyLeftArrow, keyEnter } from "./keyboard_logic.js";

export let editToggle = false;
let assetToggle = true;
export let transitionToggle = true;
let visibilityToggle = true;

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

function editToggleFn() {
  const element = document.getElementById("editToggle");
  if (editToggle) {
    // display-mode
    editToggle = false;
    element.style.backgroundColor = "red";

    document.getElementById("editBtns").classList.add("hidden-btn-menus");
    document.getElementById("editBtns").classList.remove("btn-menus");
    document.getElementById("displayBtns").classList.remove("hidden-btn-menus");
    document.getElementById("displayBtns").classList.add("btn-menus");
    document.getElementById("modeLable").innerText = "presentieren";

    removeMoveTemplate();
    const elements = document.querySelectorAll(".grid-box-content");
    elements.forEach((element) => {
      element.draggable = false;
    });
    const otherElements = document.querySelectorAll(".grid-box");
    otherElements.forEach((element) => {
      element.draggable = false;
    });
  } else {
    // edit-mode
    editToggle = true;
    element.style.backgroundColor = "green";

    document.getElementById("displayBtns").classList.add("hidden-btn-menus");
    document.getElementById("displayBtns").classList.remove("btn-menus");
    document.getElementById("editBtns").classList.remove("hidden-btn-menus");
    document.getElementById("editBtns").classList.add("btn-menus");
    document.getElementById("modeLable").innerText = "bearbeiten";

    const elements = document.querySelectorAll(".grid-box-content");
    elements.forEach((element) => {
      element.draggable = true;
    });
    const otherElements = document.querySelectorAll(".grid-box");
    otherElements.forEach((element) => {
      element.draggable = true;
    });
  }
  selectionModeChange();
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
    editToggleFn();
  });

  document.getElementById("colorBtn").addEventListener("click", () => {
    const input = document.getElementById("colorInput");
    addColorToGridDisplay(input.value);
  });

  document.getElementById("blackoutBtn").addEventListener("click", () => {
    unmarkPlayingAll();

    if (transitionToggle) {
      emit("black_out_fade");
      return;
    }

    emit("black_out");
  });

  document.getElementById("deleteBtn").addEventListener("click", () => {
    if (!editToggle) {
      return;
    }

    const child = document.querySelector(".editSelected");
    const id = child.parentElement.id;
    layout.splice(layout.indexOf(id), 1);
    const element = child.parentElement.parentElement.remove();
    editDeselectAll();
    addGhostMoveTemplate();
    auto_save();
  });

  document.getElementById("templateDeleteBtn").addEventListener("click", () => {
    if (!editToggle) {
      return;
    }
    const newLayout = layout.filter((id) => {
      const element = document.getElementById(id);

      if (element.empty) {
        element.parentElement.remove();
        return false;
      }
      return true;
    });

    layout.length = 0;
    layout.push(...newLayout);

    addGhostMoveTemplate();
    auto_save();
  });

  document.getElementById("renameBtn").addEventListener("click", () => {
    if (!editToggle) {
      return;
    }

    const name = prompt("Umbenennen zu:");

    const child = document.querySelector(".editSelected");
    const parentElement = child.parentElement;
    parentElement.name = name;
    const p = child.firstChild;
    p.innerText = name;
    auto_save();
  });

  document.getElementById("endBtn").addEventListener("click", async () => {
    await invoke("close_sec_window");
  });

  document
    .getElementById("visibilityToggle")
    .addEventListener("click", async (event) => {
      if (visibilityToggle) {
        visibilityToggle = false;
        event.currentTarget.style.backgroundColor = "red";
        await invoke("hide_sec_window");
      } else {
        visibilityToggle = true;
        event.currentTarget.style.backgroundColor = "green";
        await invoke("show_sec_window");
      }
    });

  document
    .getElementById("transitionToggle")
    .addEventListener("click", (event) => {
      if (transitionToggle) {
        transitionToggle = false;
        event.currentTarget.style.backgroundColor = "red";
      } else {
        transitionToggle = true;
        event.currentTarget.style.backgroundColor = "green";
      }
    });

  document.getElementById("editToggle").style.backgroundColor = "red";
  document.getElementById("transitionToggle").style.backgroundColor = "green";
  document.getElementById("visibilityToggle").style.backgroundColor = "green";
});

window.addEventListener("keydown", (event) => {
  if (event.repeat) {
    return;
  }

  switch (event.key) {
    case "ArrowRight":
      event.preventDefault();
      keyRightArrow();
      break;
    case "ArrowLeft":
      event.preventDefault();
      keyLeftArrow();
      break;
    case " ":
      event.preventDefault();
      unmarkPlayingAll();
      if (transitionToggle) {
        emit("black_out_fade");
        return;
      }
      emit("black_out");
      break;
    case "Enter":
      event.preventDefault();
      keyEnter();
      break;
    case "e":
      editToggleFn();
      break;
  }
});
