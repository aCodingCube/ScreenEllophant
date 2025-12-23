use std::{fmt::format, path::PathBuf, sync::OnceLock};
use tauri::State;

pub const SAVE_FILE: &str = "saveFile.json";

pub struct Media {
    url: String,
    name: String,
    is_video: bool,
}

pub struct MediaElement {
    id: i32,
    name: String,
}

pub struct ProjectDir {
    pub path: OnceLock<String>,
}

#[tauri::command]
pub async fn set_project_path(state: State<'_,ProjectDir>, new_path: String) -> Result<(), String> {
    println!("New filepath: {}",new_path);

    // check if it contains a save File -> valid dir!   
    let mut save_file_path = PathBuf::from(&new_path);
    save_file_path.push(SAVE_FILE);
    println!("Save file path: {}", save_file_path.display());

    if !save_file_path.is_file() {
        return Err("Ungültiger Project-Ordner".to_string());
    }

    match state.path.set(new_path) {
        Ok(_) => Ok(()),
        Err(_) => Err("Der Pfad wurde bereits gesetzt und kann nicht geändert werden.".to_string()),
    }
}

pub async fn get_project_path(state: State<'_,ProjectDir>) -> Option<String> {
    state.path.get().cloned()
}

// layout ist ein Array mit vielen "MediaElemen"-Elementen,
// fürs laden wird in einem Array aus "Media"-Elementen nach geschlagen
