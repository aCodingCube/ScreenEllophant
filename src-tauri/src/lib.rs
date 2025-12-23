use tauri::{AppHandle, WebviewUrl, WebviewWindowBuilder};

mod data_stream;
use crate::data_stream::load_asset_names;
use crate::data_stream::create_new_project;
use crate::data_stream::set_project_path;
use crate::data_stream::ProjectDir;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
async fn open_window(app: AppHandle) {
    //* search through all monitors available */
    let monitors = app.available_monitors().unwrap();
    let target_monitor = monitors.get(1).unwrap_or(&monitors[0]);
    let monitor_pos = target_monitor.position();

    //* create second Monitor for presentation */
    let window =
        WebviewWindowBuilder::new(&app, "second-window", WebviewUrl::App("SecWindow/".into()))
            .title("presentation-screen")
            .position(monitor_pos.x as f64, monitor_pos.y as f64)
            .inner_size(600.0, 400.0) // !Nach dem Testen wieder entfernen!
            .fullscreen(false) // !Fullscreen nach dem Testen wieder aktivieren!
            .always_on_top(true)
            .decorations(false)
            .skip_taskbar(true)
            .build()
            .unwrap();

    window.set_cursor_visible(false).unwrap();
    //window.set_focus().unwrap();
    window.set_always_on_top(true).unwrap();
}

#[tauri::command]
async fn open_main_window(app: AppHandle) {
    let monitors = app.available_monitors().unwrap();
    let target_monitor = monitors.get(0).unwrap();
    let monitor_pos = target_monitor.position();

    //* create Main-Window for presentation control */
    let window = WebviewWindowBuilder::new(&app, "main", WebviewUrl::App("MainWindow/".into()))
        .title("EProjections")
        .position(monitor_pos.x as f64, monitor_pos.y as f64)
        .inner_size(600.0, 400.0) // !Nach dem Testen wieder entfernen!
        .fullscreen(false) // !Fullscreen nach dem Testen wieder aktivieren!
        .build()
        .unwrap();

    let _ = window.set_focus();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .manage(ProjectDir {
            path: std::sync::OnceLock::new(),
        })
        .invoke_handler(tauri::generate_handler![
            open_window,
            open_main_window,
            set_project_path,
            create_new_project,
            load_asset_names
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
