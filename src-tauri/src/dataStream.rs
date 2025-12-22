use std::sync::OnceLock;
use tauri::State;

pub struct Media {
    url: String,
    name: String,
    is_video: bool,
}

pub struct MediaElement {
    id: i32,
    name: String,
}

pub struct SaveFile {
    pub file_path: OnceLock<String>,
}

#[tauri::command]
pub async fn set_save_path(state: State<'_,SaveFile>, new_path: String) -> Result<(), String> {
    println!("New filepath: {}",new_path);
    match state.file_path.set(new_path) {
        Ok(_) => Ok(()),
        Err(_) => Err("Der Pfad wurde bereits gesetzt und kann nicht geändert werden.".to_string()),
    }
}

pub async fn get_save_path(state: State<'_,SaveFile>) -> Option<String> {
    state.file_path.get().cloned()
}

// layout ist ein Array mit vielen "MediaElemen"-Elementen,
// fürs laden wird in einem Array aus "Media"-Elementen nach geschlagen

#[tauri::command]
pub fn get_layout_save() 
{
    // load json layout-save file
}

#[tauri::command]
pub fn write_layout_save()
{
    // write to json layout-save file
}
