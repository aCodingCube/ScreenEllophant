const { invoke } = window.__TAURI__.core;
const { exists } = window.__TAURI__.fs;
const { listen } = window.__TAURI__.event;

let error = false;

listen("load_save", () => {
  load_save();
});

import { layout } from "./ui_action_grid.js";
import {
  addGridTemplates,
  addAssetsToTemplate,
  addColorToTemplate,
  addGhostMoveTemplate,
} from "./ui_action_grid.js";

export async function auto_save() {
  let saveData = [];

  if (layout.length < 1) {
    invoke("save_empty_layout");
    return;
  }

  for (const id of layout) {
    const element = document.getElementById(id);
    const is_empty = element.empty;
    let name = "x";
    let src = "x";
    let imgSrc = "x";
    let is_color = false;

    if (!is_empty) {
      is_color = element.is_color;
      src = element.src;
      if (!is_color) {
        is_color = false;
        name = element.name;
        imgSrc = element.imgSrc;
      }
    }

    const struct = {
      url: src,
      name: name,
      img_src: imgSrc,
      is_color: is_color,
      is_empty: is_empty,
    };

    saveData.push(struct);
  }
  invoke("save_layout", { layout: saveData });
}

export async function load_save() {
  error = false;
  let result = await invoke("load_layout");

  if (result[0] == "") {
    addGridTemplates(10);
    addGhostMoveTemplate();
    return;
  }

  let len = result.length;

  addGridTemplates(len);
  addGhostMoveTemplate();

  let id = 1;

  for (const array of result) {
    let { url, name, img_src, is_color, is_empty } = array;
    if (is_empty) {
      id++;
      continue;
    }
    const element = document.getElementById("template-" + id);
    if (!element) {
      continue;
    }

    if (is_color) {
      addColorToTemplate(url, element);
    } else {
      const isValid = await isSrcValid(url);
      if (!isValid) {
        name = "Fehlende Datei!";
        error = true;
        url = "missing url";
      }
      addAssetsToTemplate(name, url, img_src, element);
    }
    id++;
  }

  if(error)
  {
    alert("Dateien wurden nicht gefunden!");
  }

}

async function isSrcValid(src) {
  let path = await invoke("get_file_src", { fileName: src });
  try {
    return await exists(path);
  } catch (err) {
    return false;
  }
}
