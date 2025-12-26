const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;

listen("load_save", () => {
  load_save();
});

import { layout } from "./ui_action_grid.js";
import {
  addGridTemplates,
  addAssetsToTemplate,
  addGhostMoveTemplate,
} from "./ui_action_grid.js";

export function auto_save() {
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

    if (!is_empty) {
      name = element.name;
      src = element.src;
      imgSrc = element.imgSrc;
    }

    const struct = {
      url: src,
      name: name,
      img_src: imgSrc,
      is_color: false,
      is_empty: is_empty,
    };

    saveData.push(struct);
  }
  invoke("save_layout", { layout: saveData });
}

export async function load_save() {
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

  result.forEach((array) => {
    const { url, name, img_src, is_color, is_empty } = array;
    if (is_empty) {
      id++;
      return;
    }
    const element = document.getElementById("template-" + id);
    if (!element) {
      return;
    }
    addAssetsToTemplate(name, url, img_src, element);
    id++;
  });
}
