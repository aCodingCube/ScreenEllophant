const { getCurrentWebviewWindow } = window.__TAURI__.webviewWindow;
const { invoke } = window.__TAURI__.core;
const { open } = window.__TAURI__.dialog;
const { save } = window.__TAURI__.dialog;

const appWindow = getCurrentWebviewWindow();

async function open_main_window(params) {
  await invoke("open_main_window");
  await new Promise((resolve) => setTimeout(resolve, 100));
  await appWindow.close();
}

async function chooseFolder() {
  const selected = await open({
    multiple: false,
    directory: true,
  });

  return selected;
}

async function chooseNewFolder() {
  const fullPath = await save({
    title: "Neues Projekt erstellen",
    defaultPath: "UnbenanntesProjekt",
  });

  return fullPath;
}

async function set_project_path(path) {
  try {
    let result = await invoke("set_project_path", { newPath: path });
  } catch (e) {
    alert("Fehler: " + e);
    return;
  }

  await open_main_window();
}

async function create_new_project(path) {
  await invoke("create_new_project", { newPath: path });
}

window.addEventListener("DOMContentLoaded", () => {
  // load project
  document.getElementById("folderBtn").addEventListener("click", async () => {
    console.log("pressed folder Btn");
    const result = await chooseFolder();
    if (result) {
      await set_project_path(result);
    }
  });

  // create project
  document
    .getElementById("newProjectBtn")
    .addEventListener("click", async () => {
      let path = await chooseNewFolder();
      await create_new_project(path);
      
      await invoke("open_main_window");
      await new Promise((resolve) => setTimeout(resolve, 100));
      await appWindow.close();
    });
});
