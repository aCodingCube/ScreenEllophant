const { invoke } = window.__TAURI__.core;
const { convertFileSrc } = window.__TAURI__.core;
const { open } = window.__TAURI__.dialog;
const { emit } = window.__TAURI__.event;

let greetInputEl;
let greetMsgEl;

async function greet() {
  // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
  greetMsgEl.textContent = await invoke("greet", { name: greetInputEl.value });
}

async function choose_file() {
  // choose files
  const selected = await open({
    multiple: false,
    filters: [
      {
        name: "Media",
        extensions: ["png", "jpg", "jpeg", "mp4", "webm", "ogg"],
      },
    ],
  });

  if (selected) {
    const assetUrl = convertFileSrc(selected);

    const isVideo =
      selected.toLowerCase().endsWith("mp4") ||
      selected.toLowerCase().endsWith("webm");

    await emit("new_media", { url: assetUrl, isVideo: isVideo });
    console.log("Send new media: " + assetUrl);
  }
}

async function open_window() {
  await invoke("open_window");
}

window.addEventListener("DOMContentLoaded", () => {
  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");
  document.querySelector("#greet-form").addEventListener("submit", (e) => {
    e.preventDefault();
    greet();
    open_window();
  });
  document.getElementById("imgBtn").addEventListener("click", (e) => {
    choose_file();
  });
});
