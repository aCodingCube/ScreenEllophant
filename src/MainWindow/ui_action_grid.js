import { handleMediaClick } from "./ui_grid_logic.js";
import { editToggle } from "./script.js";
import { auto_save } from "./auto_save.js";

let numberOfTemplates = 0;
const maxNumberOfTemplates = 200;
export let layout = []; // id starts with 1->...

export function addAssetsToTemplate(assetName, assetSrc, imgSrc, element) {
  const div = document.createElement("div");
  div.className = "grid-box-content";
  div.draggable = true;

  const img = document.createElement("img");
  img.src = imgSrc;

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
    e.dataTransfer.setData("application/imgSrc-screen-monkey", imgSrc);
    e.dataTransfer.effectAllowed = "copy";
    setTimeout(() => {
      removeMoveTemplate();
      addMoveTemplate();
    }, 10);
  });

  div.addEventListener("dragend", () => {
    removeMoveTemplate();
  });

  const p = document.createElement("p");
  p.innerText = assetName;

  div.appendChild(p);
  div.appendChild(img);
  element.appendChild(div);
  element.empty = false;
  element.name = assetName;
  element.src = assetSrc;
}

export function addGridTemplates(n) {
  const container = document.getElementById("container-right");
  for (let i = 0; i < n; i++) {
    if (numberOfTemplates >= maxNumberOfTemplates) {
      alert("Max. Anzahl an Templates wurde erreicht!");
      return;
    }
    numberOfTemplates += 1;
    const parent = document.createElement("div");
    parent.className = "grid-box-parent";

    const element = document.createElement("div");
    element.className = "template-grid-box";

    let id = "template-" + numberOfTemplates;
    element.id = id;
    parent.id = "parent-" + id;

    element.empty = true;
    layout.push(id);

    element.addEventListener("dragstart", () => {
      removeMoveTemplate();
      addMoveTemplate();
    });

    element.addEventListener("dragend", () => {
      removeMoveTemplate();
    });

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
      const imgSrc = event.dataTransfer.getData(
        "application/imgSrc-screen-monkey"
      );

      element.name = name;
      element.src = src;

      if (!name || name.trim() === "") {
        return;
      }

      if (id) {
        // document.getElementById(id).replaceChildren();
        // document.getElementById(id).empty = true;

        // remove whole tile
        let index = layout.indexOf(id);
        layout.splice(index, 1);
        document.getElementById("parent-" + id).remove();
      }

      addAssetsToTemplate(name, src, imgSrc, event.currentTarget);
      auto_save();
    });
    parent.appendChild(element);
    container.appendChild(parent);
  }
}

function addGridTemplateBefore(m_parent) {
  const container = document.getElementById("container-right");
  const parent = document.createElement("div");
  parent.className = "grid-box-parent";
  // max number of templates ignorieren!
  numberOfTemplates += 1;
  const element = document.createElement("div");
  element.className = "template-grid-box";

  let id = "template-" + numberOfTemplates;
  element.id = id;
  parent.id = "parent-" + id;

  element.empty = false;

  // add id before other id!
  let str = m_parent.id;
  let otherId = str.replace("parent-", "");
  let index = layout.indexOf(otherId);
  layout.splice(index, 0, id);

  // standart Verhalten für drag and drop!

  element.addEventListener("dragstart", () => {
    removeMoveTemplate();
    addMoveTemplate();
  });

  element.addEventListener("dragend", () => {
    removeMoveTemplate();
  });

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
    const imgSrc = event.dataTransfer.getData(
      "application/imgSrc-screen-monkey"
    );

    element.name = name;
    element.src = src;

    if (!name || name.trim() === "") {
      return;
    }

    if (id) {
      document.getElementById(id).replaceChildren();
      document.getElementById(id).empty = true;
    }

    addAssetsToTemplate(name, src, imgSrc, event.currentTarget);
    auto_save();
  });
  parent.appendChild(element);
  container.insertBefore(parent, m_parent);
  return id;
}

export function addMoveTemplate() {
  for (const id of layout) {
    const parent = document.getElementById("parent-" + id);
    const element = document.getElementById(id);
    const moveTemplate = document.createElement("div");
    moveTemplate.className = "move-template";
    moveTemplate.innerText = "+";
    moveTemplate.id = "moveTemplate-" + id;

    moveTemplate.addEventListener("dragover", (event) => {
      event.preventDefault();
      //Todo Highlight für moveTemplate?
    });

    moveTemplate.addEventListener("drop", (event) => {
      event.preventDefault();

      const targetId = event.dataTransfer.getData(
        "application/id-screen-monkey"
      );

      const targetName = event.dataTransfer.getData(
        "application/x-screen-monkey"
      );
      const targetSrc = event.dataTransfer.getData(
        "application/src-screen-monkey"
      );
      const imgSrc = event.dataTransfer.getData(
        "application/imgSrc-screen-monkey"
      );

      const newId = addGridTemplateBefore(parent);
      const newTemplate = document.getElementById(newId);

      if (targetId) {
        document.getElementById(targetId).remove();
        const index = layout.indexOf(targetId); // remove element from id list
        layout.splice(index, 1);
      }

      addAssetsToTemplate(targetName, targetSrc, imgSrc, newTemplate);

      if (editToggle && targetId) {
        document.getElementById("parent-" + targetId).remove();
      }
      auto_save();
    });
    parent.insertBefore(moveTemplate, element);
  }
  removeGhostMoveTemplate();
}

export function removeMoveTemplate() {
  const templates = document.querySelectorAll(".move-template");
  templates.forEach((element) => element.remove());
  addGhostMoveTemplate();
}

export function addGhostMoveTemplate() {
  removeGhostMoveTemplate();
  for (const id of layout) {
    const parent = document.getElementById("parent-" + id);
    const element = document.getElementById(id);
    const ghost = document.createElement("div");
    ghost.className = "ghost-move-template";

    parent.insertBefore(ghost, element);
  }
}

export function removeGhostMoveTemplate() {
  const ghosts = document.querySelectorAll(".ghost-move-template");
  ghosts.forEach((element) => element.remove());
}
