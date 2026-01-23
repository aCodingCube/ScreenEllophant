use tauri::{App, Manager};
use tauri::{AppHandle, Emitter, WebviewUrl, WebviewWindowBuilder};

mod data_stream;
use crate::data_stream::create_new_project;
use crate::data_stream::get_file_src;
use crate::data_stream::get_media_path;
use crate::data_stream::load_asset_names;
use crate::data_stream::load_layout;
use crate::data_stream::save_empty_layout;
use crate::data_stream::save_layout;
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

    if let Some(monitor) = monitors.get(1) {
        window.set_fullscreen(true).unwrap();
    } else {
        window.set_fullscreen(false).unwrap();
    }

    window.set_cursor_visible(false).unwrap();
    window.set_always_on_top(true).unwrap();
}

#[tauri::command]
async fn close_start_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("starting-window") {
        window.close().unwrap();
    }
}

#[tauri::command]
async fn close_sec_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("second-window") {
        window.close().unwrap();
    }
}

#[tauri::command]
async fn hide_sec_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("second-window") {
        window.hide().unwrap();
    }
}

#[tauri::command]
async fn show_sec_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("second-window") {
        window.show().unwrap();
    }
}

#[tauri::command]
async fn open_main_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        window.show().unwrap();

        window.set_focus().unwrap();
    }
}

#[tauri::command]
async fn close_main_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        window.close().unwrap();
    }
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
            get_media_path,
            create_new_project,
            load_asset_names,
            get_file_src,
            save_layout,
            save_empty_layout,
            load_layout,
            close_sec_window,
            hide_sec_window,
            show_sec_window,
            close_main_window,
            close_start_window,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let label = window.label();
                let app = window.app_handle();

                // 1. Wenn das Start-Fenster geschlossen wird
                if label == "starting-window" {
                    // Prüfe, ob das Hauptfenster existiert UND ob es sichtbar ist
                    if let Some(main_window) = app.get_webview_window("main") {
                        let is_visible = main_window.is_visible().unwrap_or(false);

                        if !is_visible {
                            // Falls Main noch unsichtbar ist -> App beenden
                            println!("Main ist unsichtbar, beende App.");
                            app.exit(0);
                        } else {
                            // Falls Main schon offen ist -> Nur Start-Fenster zu (Standard)
                            println!("Main ist bereits offen, schließe nur Start-Fenster.");
                        }
                    } else {
                        // Falls aus irgendeinem Grund kein Main-Fenster existiert
                        app.exit(0);
                    }
                }

                // 2. Wenn das Haupt-Fenster geschlossen wird
                if label == "main" {
                    // Wenn der User das Hauptfenster schließt, soll immer alles zu gehen
                    app.exit(0);
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
