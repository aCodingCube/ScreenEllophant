const { invoke } = window.__TAURI__.core;
const { convertFileSrc } = window.__TAURI__.core;
const { open } = window.__TAURI__.dialog;
const { emit } = window.__TAURI__.event;

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

async function addAssetsToGrid(name)
{
  const container = document.getElementById("container");
  const div = document.createElement("div");
  div.className = "grid-box";

  const p = document.createElement("p");
  p.innerText = name;

  div.appendChild(p);
  container.appendChild(div);
}

async function load_asset_names() {
  const result = await invoke("load_asset_names");
  console.log("Load assets: {}",result);
  return result;
}

async function open_window() {
  await invoke("open_window");
}

window.addEventListener("DOMContentLoaded", () => {
  
  document.getElementById("launchBtn").addEventListener("click",(e) =>{
    open_window();
  });

  document.getElementById("imgBtn").addEventListener("click", (e) => {
    choose_file();
  });

  document.getElementById("loadBtn").addEventListener("click",async()=>{
    const result = await load_asset_names();

    result.forEach(name => {
      addAssetsToGrid(name);
    });
  });
});
