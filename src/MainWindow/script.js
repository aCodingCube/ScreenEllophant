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
    //toggle -> off
    // display-mode
    editToggle = false;
    element.classList.remove("is-active");

    document.getElementById("editBtns").classList.add("hidden-btn-menus");
    document.getElementById("editBtns").classList.remove("btn-menus");
    document.getElementById("displayBtns").classList.remove("hidden-btn-menus");
    document.getElementById("displayBtns").classList.add("btn-menus");
    document.getElementById("modeLable").innerText = "PRÄSENTIEREN";

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
    //toggle -> on
    // edit-mode
    editToggle = true;
    element.classList.add("is-active");

    document.getElementById("displayBtns").classList.add("hidden-btn-menus");
    document.getElementById("displayBtns").classList.remove("btn-menus");
    document.getElementById("editBtns").classList.remove("hidden-btn-menus");
    document.getElementById("editBtns").classList.add("btn-menus");
    document.getElementById("modeLable").innerText = "BEARBEITEN";

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

function transitionToggleFn() {
  if (editToggle) {
    return;
  }
  const button = document.getElementById("transitionToggle");
  const text = document.getElementById("transitionLable");
  if (transitionToggle) {
    // toggle -> off
    transitionToggle = false;
    button.classList.add("is-active");
    text.innerText = "CUT";
  } else {
    // toggle -> on
    transitionToggle = true;
    button.classList.remove("is-active");
    text.innerText = "FADE";
  }
}

function assetToggleFn() {
  if (assetToggle) {
    //toggle -> open
    assetToggle = false;
    document.getElementById("box-left").style.display = "none";
    document.getElementById("assetIconOpen").style.display = "none";
    document.getElementById("assetIconClose").style.display = "inline-flex";
    document.getElementById("assetToggle").classList.add("is-active");
  } else {
    //toggle -> close
    assetToggle = true;
    document.getElementById("box-left").style.display = "block";
    document.getElementById("assetIconClose").style.display = "none";
    document.getElementById("assetIconOpen").style.display = "inline-flex";
    document.getElementById("assetToggle").classList.remove("is-active");
  }
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
    assetToggleFn();
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

    if(document.querySelectorAll(".editSelected")[0] == undefined)
    {
      return;
    }

    const name = prompt("Umbenennen zu:");

    if (name == "" || name == undefined) {
      return;
    }

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
        //toggle -> off
        visibilityToggle = false;
        event.currentTarget.classList.add("is-active");
        await invoke("hide_sec_window");
      } else {
        //toggle -> on
        visibilityToggle = true;
        event.currentTarget.classList.remove("is-active");
        await invoke("show_sec_window");
      }
    });

  document.getElementById("transitionToggle").addEventListener("click", () => {
    transitionToggleFn();
  });

  document.getElementById("closeBtn").addEventListener("click", async () => {
    await invoke("close_main_window");
  });
});

window.addEventListener("contextmenu", (e) => e.preventDefault());

window.addEventListener("keydown", (event) => {
  // event.preventDefault(); //! Später wieder aktivieren!
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
    case "t":
      transitionToggleFn();
      break;
    case "f":
      assetToggleFn();
      break;
  }
});
