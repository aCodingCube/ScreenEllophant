const { invoke } = window.__TAURI__.core;
const { convertFileSrc } = window.__TAURI__.core;

export async function createThumbnail(src_name) {
  let path = await invoke("get_media_path", {srcName: src_name});

  const isVideo =
    path.toLowerCase().endsWith("mp4") || path.toLowerCase().endsWith("webm");

  return new Promise((resolve) => {
    if (isVideo) {
      const video = document.createElement("video");
      video.src = convertFileSrc(path);
      video.crossOrigin = "anonymous";
      video.currentTime = 1; // 1s

      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = 160;
        canvas.height = 90;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
    } else {
      const img = document.createElement("img");
      img.src = convertFileSrc(path);
      img.crossOrigin = "anonymous";

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = 160;
        canvas.height = 90;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // 0 = dx; 0 = dy

        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
    }
  });
}
