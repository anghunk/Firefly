use crate::models::{Category, CategoryOrderConfig, CreateCategoryRequest, RenameCategoryRequest};
use crate::services::category_service;

#[tauri::command]
pub fn get_categories(notes_dir: String) -> Result<Vec<Category>, String> {
    category_service::get_categories(&notes_dir)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_category(notes_dir: String, request: CreateCategoryRequest) -> Result<Category, String> {
    category_service::create_category(&notes_dir, request)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn rename_category(request: RenameCategoryRequest) -> Result<Category, String> {
    // Get notes_dir from the category path's parent
    let category_path = std::path::Path::new(&request.id);
    let notes_dir = category_path
        .parent()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();

    let old_id = request.id.clone();
    let result = category_service::rename_category(&notes_dir, request)
        .map_err(|e| e.to_string())?;

    // Update category ID in order config
    let new_id = result.id.clone();
    category_service::update_category_id_in_order(&notes_dir, &old_id, &new_id)
        .map_err(|e| e.to_string())?;

    Ok(result)
}

#[tauri::command]
pub fn delete_category(category_path: String) -> Result<(), String> {
    // Get notes_dir from the category path's parent
    let path = std::path::Path::new(&category_path);
    let notes_dir = path
        .parent()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();

    category_service::delete_category(&category_path)
        .map_err(|e| e.to_string())?;

    // Remove from order config
    category_service::remove_category_from_order(&notes_dir, &category_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_category_order(notes_dir: String) -> Result<CategoryOrderConfig, String> {
    category_service::get_category_order_config(&notes_dir)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_category_order(notes_dir: String, order: CategoryOrderConfig) -> Result<(), String> {
    category_service::save_category_order_config(&notes_dir, &order)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn reorder_categories(notes_dir: String, from_id: String, to_id: String) -> Result<(), String> {
    category_service::reorder_categories(&notes_dir, &from_id, &to_id)
        .map_err(|e| e.to_string())
}