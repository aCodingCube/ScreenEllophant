const { getCurrentWebviewWindow } = window.__TAURI__.webviewWindow;
const { invoke } = window.__TAURI__.core;

const appWindow = getCurrentWebviewWindow();

async function open_main_window(params) {
  await invoke("open_main_window");
  await new Promise(resolve => setTimeout(resolve, 100));
  await appWindow.close();
}

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("startBtn").addEventListener("click", () => {
    open_main_window();
  });
});
