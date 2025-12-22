const { getCurrentWebviewWindow } = window.__TAURI__.webviewWindow;
const { invoke } = window.__TAURI__.core;
const { open } = window.__TAURI__.dialog;

const appWindow = getCurrentWebviewWindow();
let saveFilePath;

async function open_main_window(params) {
  await invoke("open_main_window");
  await new Promise((resolve) => setTimeout(resolve, 100));
  await appWindow.close();
}

async function chooseFile() {
  const selected = await open({
    multiple: false,
    filters: [
      {
        name: "JSON-Datei",
        extensions: ["json"],
      },
    ],
  });

  return selected;
}

async function set_save_path(filePath) {
  await invoke("set_save_path", { newPath: filePath });
}

window.addEventListener("DOMContentLoaded", () => {
  // document.getElementById("startBtn").addEventListener("click", () => {
  //   open_main_window();
  // });
  document.getElementById("fileBtn").addEventListener("click", async () => {
    console.log("pressed file Btn");
    const result = await chooseFile();
    if(result)
    {
      await set_save_path(result);
      await open_main_window();
    }
  });
});
