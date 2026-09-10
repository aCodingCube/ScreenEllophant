const { invoke } = window.__TAURI__.core;
const { convertFileSrc } = window.__TAURI__.core;
const { open } = window.__TAURI__.dialog;
const { emit } = window.__TAURI__.event;

import { cue } from "../SecWindow/script.js";

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
  sendMedia,
  updateLoopBtn,
  pubIsLooped,
} from "./ui_grid_logic.js";
import { keyRightArrow, keyLeftArrow, keyEnter } from "./keyboard_logic.js";

import { blackoutCMD, updateIsLooped } from "./transitionInterface.js";

// global variables
export let editToggle = false;
let assetToggle = true;
export let transitionToggle = true;
let visibilityToggle = true;
export let pubLoopToggle = false;

// add assets to left "display" grid
async function addAssetsToGridDisplay(name) {
  const container = document.getElementById("container-left");
  const div = document.createElement("div");
  div.className = "grid-box";
  div.draggable = editToggle;

  const img = document.createElement("img");
  img.src = await createThumbnail(name);
  img.draggable = false;

  img.isVideo =
    name.toLowerCase().endsWith("mp4") ||
    name.toLowerCase().endsWith("webm") ||
    name.toLowerCase().endsWith("wav") ||
    name.toLowerCase().endsWith("mov");

  div.addEventListener("dragstart", (e) => {
    if (editToggle) {
      removeMoveTemplate();
      addMoveTemplate();
    }
    e.dataTransfer.setData("application/x-screen-monkey", name);
    e.dataTransfer.setData("application/src-screen-monkey", name);
    e.dataTransfer.setData("application/isVideo-screen-monkey", img.isVideo);
    e.dataTransfer.setData("application/isLooped-screen-monkey", false);
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

function isLoopedToggleFn(event) {
  const element = document.querySelectorAll(".displaySelected")[0];
  const parent = element.parentElement;

  const btn = event.currentTarget;
  parent.isLooped = !parent.isLooped;

  // cue.payload.isLooped = parent.isLooped; //* Update cue in ../SecWindow/script.js !
  updateIsLooped(parent.src, parent.isLooped);
  console.log("updated loop cue!");

  if (parent.isLooped) {
    btn.classList.add("is-active");
    pubLoopToggle = true;

    auto_save();
    return;
  }

  btn.classList.remove("is-active");
  pubLoopToggle = false;
  auto_save();
}

//* Event-Listener
window.addEventListener("DOMContentLoaded", () => {
  //#region main-btns
  // close main window
  document.getElementById("closeBtn").addEventListener("click", async () => {
    await invoke("close_main_window");
  });

  // toggle assets
  document.getElementById("assetToggle").addEventListener("click", () => {
    assetToggleFn();
  });

  // toggle edit/presentation
  document.getElementById("editToggle").addEventListener("click", (event) => {
    editToggleFn();
  });
  //#endregion

  //#region presentation btns
  // open presentation window
  document.getElementById("launchBtn").addEventListener("click", async (e) => {
    await invoke("open_window");
  });

  // close presentation window
  document.getElementById("endBtn").addEventListener("click", async () => {
    await invoke("close_sec_window");
  });

  // hide/show presentation window
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

  // blackout
  document.getElementById("blackoutBtn").addEventListener("click", () => {
    unmarkPlayingAll();

    if (transitionToggle) {
      blackoutCMD(true);
      return;
    }

    blackoutCMD(false);
  });

  // transition
  document.getElementById("transitionToggle").addEventListener("click", () => {
    transitionToggleFn();
  });
  //#endregion

  //#region edit btns
  // delete grid
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

  // remove empty grids
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

  // rename
  document.getElementById("renameBtn").addEventListener("click", () => {
    if (!editToggle) {
      return;
    }

    if (document.querySelectorAll(".editSelected")[0] == undefined) {
      return;
    }

    if (document.querySelector(".editSelected").parentElement.is_color) {
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

  // create more templates
  document.getElementById("templateBtn").addEventListener("click", () => {
    if (!editToggle) {
      return;
    }
    addGridTemplates(5);
    addGhostMoveTemplate();
  });
  //#endregion

  //#region utility btns
  // loop video
  document.getElementById("loopBtn").addEventListener("click", (event) => {
    isLoopedToggleFn(event);
  });

  //Todo transition fader!
  //#endregion

  //#region asset btns
  // open project folder
  document
    .getElementById("projectFolderBtn")
    .addEventListener("click", async () => {
      await invoke("open_project_folder");
    });

  // load assets
  document.getElementById("loadBtn").addEventListener("click", async () => {
    document.getElementById("container-left").replaceChildren();
    const result = await invoke("load_asset_names");

    result.forEach((name) => {
      addAssetsToGridDisplay(name);
    });
  });

  // add color
  document.getElementById("colorBtn").addEventListener("click", () => {
    const input = document.getElementById("colorInput");
    addColorToGridDisplay(input.value);
  });
  //#endregion
});

window.addEventListener("contextmenu", (e) => e.preventDefault());

window.addEventListener("keydown", async (event) => {
  event.preventDefault();
  if (event.repeat) {
    return;
  }

  switch (event.key) {
    // move selection right
    case "ArrowRight":
      event.preventDefault();
      keyRightArrow();
      updateLoopBtn();
      break;
    // move selection left
    case "ArrowLeft":
      event.preventDefault();
      keyLeftArrow();
      updateLoopBtn();
      break;
    // blackout [space]
    case " ":
      event.preventDefault();
      unmarkPlayingAll();
      if (transitionToggle) {
        blackoutCMD(true);
        return;
      }
      blackoutCMD(false);
      const elements = document.querySelectorAll(".displaySelected"); // is_color
      const element = elements[0];
      const parent = element.parentElement;
      if (parent.is_color) {
        sendMedia(parent.src, true);
      } else {
        let path = await invoke("get_file_src", { fileName: parent.name });
        sendMedia(path, false);
      }
      break;
    // display media
    case "Enter":
      event.preventDefault();
      keyEnter();
      break;
    // toggle edit-/presentation-mode
    case "e":
      editToggleFn();
      break;
    // toggle transitions
    case "t":
      transitionToggleFn();
      break;
    // toggle asset-view
    case "f":
      assetToggleFn();
      break;
    // (re-)load assets
    case "r":
      document.getElementById("container-left").replaceChildren();
      const result = await invoke("load_asset_names");

      result.forEach((name) => {
        addAssetsToGridDisplay(name);
      });
      break;
    // delete selected item
    case "Delete":
      if (!editToggle) {
        return;
      }

      const child = document.querySelector(".editSelected");
      const id = child.parentElement.id;
      layout.splice(layout.indexOf(id), 1);
      child.parentElement.parentElement.remove();
      editDeselectAll();
      addGhostMoveTemplate();
      auto_save();
      break;

    // add templates
    case "+":
      if (!editToggle) {
        return;
      }

      addGridTemplates(5);
      addGhostMoveTemplate();
      break;

    // toggle visibility
    case "h":
      if (visibilityToggle) {
        //toggle -> off
        visibilityToggle = false;
        const btn = document.getElementById("visibilityToggle");
        btn.classList.add("is-active");
        await invoke("hide_sec_window");
      } else {
        //toggle -> on
        visibilityToggle = true;
        const btn = document.getElementById("visibilityToggle");
        btn.classList.remove("is-active");
        await invoke("show_sec_window");
      }
      break;

    // open directory
    case "d":
      await invoke("open_project_folder");
      break;

    // clear workingspace
    case "l":
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
      break;
  }
});
