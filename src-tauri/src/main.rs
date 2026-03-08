// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod models;
mod services;

use commands::{category, note, settings};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            // Category commands
            category::get_categories,
            category::create_category,
            category::rename_category,
            category::delete_category,
            category::get_category_order,
            category::save_category_order,
            category::reorder_categories,
            // Note commands
            note::get_notes,
            note::create_note,
            note::get_note_content,
            note::save_note,
            note::delete_note,
            note::rename_note,
            // Tree node commands
            note::get_tree_nodes,
            note::create_folder,
            note::delete_folder,
            note::rename_folder,
            note::create_note_in_folder,
            // Settings commands
            settings::get_app_config,
            settings::save_app_config,
            settings::get_default_notes_dir,
            settings::select_notes_directory,
            settings::set_notes_directory,
            settings::is_valid_workspace,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}