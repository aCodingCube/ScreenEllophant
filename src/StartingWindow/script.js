const { getCurrentWebviewWindow } = window.__TAURI__.webviewWindow;
const { invoke } = window.__TAURI__.core;
const { open } = window.__TAURI__.dialog;

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

async function set_project_path(path) {
  try {
    let result = await invoke("set_project_path", { newPath: path });
  } catch (e) {
    alert("Fehler: " + e);
    return;
  }

  await open_main_window();
}

window.addEventListener("DOMContentLoaded", () => {
  // document.getElementById("startBtn").addEventListener("click", () => {
  //   open_main_window();
  // });
  document.getElementById("folderBtn").addEventListener("click", async () => {
    console.log("pressed folder Btn");
    const result = await chooseFolder();
    if (result) {
      await set_project_path(result);
    }
  });
});
