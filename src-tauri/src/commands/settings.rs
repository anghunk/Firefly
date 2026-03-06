use crate::models::FullConfig;
use crate::services::config_service;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
pub fn get_app_config() -> Result<FullConfig, String> {
    config_service::get_full_config()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_app_config(config: FullConfig) -> Result<(), String> {
    config_service::save_full_config(&config)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_default_notes_dir() -> String {
    config_service::get_default_notes_dir()
}

#[tauri::command]
pub fn select_notes_directory(app: AppHandle) -> Result<Option<String>, String> {
    let result = app.dialog()
        .file()
        .blocking_pick_folder();

    match result {
        Some(path) => {
            let path_str = path.to_string();
            // Initialize workspace when selecting a directory
            config_service::set_notes_directory(&path_str)
                .map_err(|e| e.to_string())?;
            Ok(Some(path_str))
        }
        None => Ok(None),
    }
}

#[tauri::command]
pub fn set_notes_directory(notes_dir: String) -> Result<(), String> {
    config_service::set_notes_directory(&notes_dir)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn is_valid_workspace(dir: String) -> bool {
    config_service::is_valid_workspace(&dir)
}