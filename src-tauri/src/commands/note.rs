use crate::models::{
    CreateFolderRequest, CreateNoteInFolderRequest, CreateNoteRequest, Note, NoteContent,
    SaveNoteRequest, TreeNode,
};
use crate::services::note_service;

#[tauri::command]
pub fn get_notes(category_path: String) -> Result<Vec<Note>, String> {
    note_service::get_notes(&category_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_note(request: CreateNoteRequest) -> Result<Note, String> {
    note_service::create_note(request)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_note_content(note_path: String) -> Result<NoteContent, String> {
    note_service::get_note_content(&note_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_note(request: SaveNoteRequest) -> Result<(), String> {
    note_service::save_note(request)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_note(note_path: String) -> Result<(), String> {
    note_service::delete_note(&note_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn rename_note(note_path: String, new_title: String) -> Result<TreeNode, String> {
    note_service::rename_note(&note_path, &new_title)
        .map_err(|e| e.to_string())
}

// ================== Tree Node Commands ==================

#[tauri::command]
pub fn get_tree_nodes(category_path: String) -> Result<Vec<TreeNode>, String> {
    note_service::get_tree_nodes(&category_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_folder(request: CreateFolderRequest) -> Result<TreeNode, String> {
    note_service::create_folder(request)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_folder(folder_path: String) -> Result<(), String> {
    note_service::delete_folder(&folder_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn rename_folder(folder_path: String, new_name: String) -> Result<TreeNode, String> {
    note_service::rename_folder(&folder_path, &new_name)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_note_in_folder(request: CreateNoteInFolderRequest) -> Result<TreeNode, String> {
    note_service::create_note_in_folder(request)
        .map_err(|e| e.to_string())
}