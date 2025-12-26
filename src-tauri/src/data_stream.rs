use serde::{Deserialize, Serialize};
use std::{
    alloc::Layout,
    fmt::format,
    fs::{self, File},
    io,
    path::{Path, PathBuf},
    sync::OnceLock,
};
use tauri::State;

pub const SAVE_FILE: &str = "saveFile.json";
pub const MEDIA_FOLDER: &str = "Media";

#[derive(Serialize, Deserialize, Debug)]
pub struct Media {
    url: String,
    name: String,
    img_src: String,
    is_color: bool,
    is_empty: bool,
}

#[derive(Serialize, Deserialize)]
struct Config {
    save_empty: bool,
}
pub struct ProjectDir {
    pub path: OnceLock<String>,
}

#[tauri::command]
pub async fn set_project_path(
    state: State<'_, ProjectDir>,
    new_path: String,
) -> Result<(), String> {
    println!("New filepath: {}", new_path);

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

pub async fn get_project_path(state: State<'_, ProjectDir>) -> Result<String, String> {
    let path = state.path.get().cloned().ok_or("Error")?;

    Ok(path)
}

#[tauri::command]
pub async fn get_media_path(state: State<'_, ProjectDir>,src_name: String) -> Result<String, String> {
    let project_dir = state.path.get().cloned().ok_or("Error")?;
    let mut path = PathBuf::from(&project_dir);
    path.push(MEDIA_FOLDER);
    path.push(src_name);

    Ok(path.to_string_lossy().into_owned())
}

#[tauri::command]
pub async fn create_new_project(
    state: State<'_, ProjectDir>,
    new_path: String,
) -> Result<(), String> {
    let mut base = PathBuf::from(&new_path);
    let mut file_path = base.clone(); // for file path

    // 1. create project and media dir
    base.push(MEDIA_FOLDER);
    fs::create_dir_all(&base).map_err(|e: std::io::Error| e.to_string())?; // create project and media dir

    // 2. create json file
    file_path.push(SAVE_FILE);
    fs::write(&file_path, "{}").map_err(|e: std::io::Error| e.to_string())?;

    Ok(())
}

// layout ist ein Array mit vielen "MediaElemen"-Elementen,
// fürs laden wird in einem Array aus "Media"-Elementen nach geschlagen
#[tauri::command]
pub async fn load_asset_names(state: State<'_, ProjectDir>) -> Result<Vec<String>, String> {
    let mut names: Vec<String> = Vec::new();

    // 1. read folder
    let project_dir = state.path.get().cloned().ok_or("Error")?;
    let mut folder_path = PathBuf::from(&project_dir);
    folder_path.push(MEDIA_FOLDER);
    println!("folder path: {}", folder_path.display());
    let entries = fs::read_dir(&folder_path).map_err(|e: std::io::Error| e.to_string())?;

    // 2. iterate over entries
    for entry in entries {
        let entry = entry.map_err(|e: std::io::Error| e.to_string())?;
        let path = entry.path();

        if path.is_file() {
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                names.push(name.to_string());
            }
        }
    }

    Ok(names)
}

#[tauri::command]
pub async fn get_file_src(state: State<'_, ProjectDir>, file_name: &str) -> Result<String, String> {
    let project_dir = state.path.get().cloned().ok_or("Error!")?;
    let mut path = PathBuf::from(&project_dir);
    path.push(MEDIA_FOLDER);
    path.push(file_name);

    let path_str = path.to_string_lossy().into_owned();

    Ok(path_str)
}

#[tauri::command]
pub async fn save_layout(state: State<'_, ProjectDir>, layout: Vec<Media>) -> Result<(), String> {
    let json_data = serde_json::to_string_pretty(&layout).map_err(|e| e.to_string())?;

    let project_dir = state.path.get().cloned().ok_or("Error!")?;
    let mut path = PathBuf::from(&project_dir);
    path.push(SAVE_FILE);

    fs::write(path, json_data).map_err(|e| e.to_string())?;

    println!("Made automatic save!");

    Ok(())
}

#[tauri::command]
pub async fn save_empty_layout(state: State<'_,ProjectDir>) -> Result<(),String>{
    let project_dir = state.path.get().cloned().ok_or("Error!")?;
    let mut path = PathBuf::from(&project_dir);
    path.push(SAVE_FILE);

    let config = Config {save_empty: true};

    let json_data = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;

    fs::write(path,json_data).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn load_layout(state: State<'_, ProjectDir>) -> Result<Vec<Media>, String> {
    let project_dir = state.path.get().cloned().ok_or("Error")?;
    let mut path = PathBuf::from(&project_dir);
    path.push(SAVE_FILE);

    let json_data = fs::read_to_string(path).map_err(|e| e.to_string())?;

    // check if json-file was save empty
    let v: serde_json::Value = serde_json::from_str(&json_data).map_err(|e| e.to_string())?;
    if v.is_object() && v.get("save_empty").is_some(){
        let obj = Media{url: "".to_string(),name: "".to_string(), img_src: "".to_string(),is_color: false, is_empty: false};
        return Ok(vec![obj]);
    }

    let layout: Vec<Media> = serde_json::from_str(&json_data).map_err(|e| e.to_string())?;

    Ok(layout)
}
