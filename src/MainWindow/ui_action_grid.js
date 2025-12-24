import { handleMediaClick } from "./ui_grid_logic.js";
import { editToggle } from "./script.js";

let numberOfTemplates = 0;
const maxNumberOfTemplates = 200;
let layout = [];

function addAssetsToTemplate(assetName, assetSrc, element) {
  const div = document.createElement("div");
  div.className = "grid-box-content";
  div.draggable = true;

  div.addEventListener("click", (event) => {
    if (editToggle) {
      return;
    }
    handleMediaClick(event, assetName);
  });

  div.addEventListener("dragstart", (e) => {
    if (!editToggle) {
      return;
    }
    e.dataTransfer.setData("application/id-screen-monkey", element.id);
    e.dataTransfer.setData("application/x-screen-monkey", assetName);
    e.dataTransfer.setData("application/src-screen-monkey", assetSrc);
    e.dataTransfer.effectAllowed = "copy";
  });

  const p = document.createElement("p");
  p.innerText = assetName;

  div.appendChild(p);
  element.appendChild(div);
  element.empty = false;
}

export function addGridTemplates(n) {
  const container = document.getElementById("container-right");
  for (let i = 0; i < n; i++) {
    if (numberOfTemplates >= maxNumberOfTemplates) {
      alert("Max. Anzahl an Templates wurde erreicht!");
      return;
    }
    numberOfTemplates += 1;
    const element = document.createElement("div");
    element.className = "template-grid-box";
    let id = "template-" + numberOfTemplates;
    element.id = id;
    element.empty = true;
    layout.push(id);

    element.addEventListener("dragover", (event) => {
      if (!editToggle) {
        return;
      }
      if (event.currentTarget.children.length > 0) {
        return;
      }
      event.preventDefault();
    });
    element.addEventListener("drop", (event) => {
      if (!editToggle) {
        return;
      }

      event.preventDefault();
      const id = event.dataTransfer.getData("application/id-screen-monkey");
      const name = event.dataTransfer.getData("application/x-screen-monkey");
      const src = event.dataTransfer.getData("application/src-screen-monkey");
      if (!name || name.trim() === "") {
        return;
      }

      if (id) {
        document.getElementById(id).replaceChildren();
        document.getElementById(id).empty = true;
      }

      addAssetsToTemplate(name, src, event.currentTarget);
    });
    container.appendChild(element);
  }
}
