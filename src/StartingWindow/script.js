const { getCurrentWebviewWindow } = window.__TAURI__.webviewWindow;
const { invoke } = window.__TAURI__.core;
const { open } = window.__TAURI__.dialog;
const { save } = window.__TAURI__.dialog;
const {emit} = window.__TAURI__.event;

const appWindow = getCurrentWebviewWindow();

async function open_main_window(params) {
  await emit("load_save");
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

window.addEventListener("contextmenu", (e) => e.preventDefault());

window.addEventListener("keydown",(event)=>{
  event.preventDefault();
  switch(event.key)
  {
    case "Escape":
      invoke("close_start_window");
      break;
  }
})