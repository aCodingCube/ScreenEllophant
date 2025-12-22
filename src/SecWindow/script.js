// listener for ESC key
const { getCurrentWebviewWindow } = window.__TAURI__.webviewWindow;

const appWindow = getCurrentWebviewWindow();

window.addEventListener("DOMContentLoaded",add_eventListener);

function add_eventListener()
{
    window.addEventListener("keydown",async(event) => {
        console.log(event.key);
        if(event.key == "Escape")
        {
            await appWindow.close();
        }
    })
}