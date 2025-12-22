const { getCurrentWebviewWindow } = window.__TAURI__.webviewWindow;
const { listen } = window.__TAURI__.event;

const appWindow = getCurrentWebviewWindow();

listen("new_media", (event) => {
  const { url, isVideo } = event.payload;

  const imageElement = document.getElementById("presentationImage");
  const videoElement = document.getElementById("presentationVideo");

  if (isVideo) {
    console.log("Displaying video!");
    imageElement.style.display = "none";
    videoElement.style.display = "block";
    videoElement.src = url;
    videoElement.play();
  } else {
    console.log("Displaying image!");
    videoElement.style.display = "none";
    videoElement.pause();
    imageElement.style.display = "block";
    imageElement.src = url;
  }
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
