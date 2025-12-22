const { getCurrentWebviewWindow } = window.__TAURI__.webviewWindow;
const { listen } = window.__TAURI__.event;

const appWindow = getCurrentWebviewWindow();

listen("new_image", (event) => {
  const url = event.payload.url;

  const imageElement = document.getElementById("presentationImage");
  imageElement.src = url;
});

window.addEventListener("DOMContentLoaded", add_eventListener);

function add_eventListener() {
  window.addEventListener("keydown", async (event) => {
    console.log(event.key);
    if (event.key == "Escape") {
      await appWindow.close();
    }
  });
}
