const { invoke } = window.__TAURI__.core;
const { convertFileSrc } = window.__TAURI__.core;
const { open } = window.__TAURI__.dialog;
const { emit }= window.__TAURI__.event;

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
    filters: [{name: "Images", extensions: ["png", "jpg", "jpeg"] }],
  });

  if (selected) {
    const imgUrl = convertFileSrc(selected);

    await emit("new_image", { url: imgUrl });
    console.log("Send new image: " + imgUrl);
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
