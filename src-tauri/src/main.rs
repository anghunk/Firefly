// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod models;
mod services;

use commands::{category, note, settings};
use std::sync::Arc;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{TrayIconBuilder, TrayIconEvent, MouseButton},
    image::Image,
    Manager,
    WindowEvent,
};

#[derive(Clone)]
pub struct AppState {
    pub minimize_to_tray: Arc<std::sync::Mutex<bool>>,
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let show_item = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
            let separator = PredefinedMenuItem::separator(app)?;
            let menu = Menu::with_items(app, &[&show_item, &separator, &quit_item])?;

            let icon_path = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                .join("icons")
                .join("32x32.png");

            let img = image::open(&icon_path)?.to_rgba8();
            let (width, height) = img.dimensions();
            let icon = Image::new_owned(img.into_raw(), width, height);

            let _tray = TrayIconBuilder::with_id("main")
                .menu(&menu)
                .icon(icon)
                .tooltip("萤火笔记")
                .show_menu_on_left_click(false)
                .on_tray_icon_event(|tray, event| match event {
                    TrayIconEvent::Click {
                        id: _,
                        position: _,
                        rect: _,
                        button,
                        button_state: _,
                    } => {
                        if button == MouseButton::Left {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                window.show().unwrap();
                                window.unminimize().unwrap();
                                window.set_focus().unwrap();
                            }
                        }
                    }
                    TrayIconEvent::DoubleClick { .. } => {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            window.show().unwrap();
                            window.unminimize().unwrap();
                            window.set_focus().unwrap();
                        }
                    }
                    _ => {}
                })
                .build(app)?;

            // Load minimize to tray setting
            let minimize_to_tray = settings::get_minimize_to_tray().unwrap_or(false);
            app.manage(AppState {
                minimize_to_tray: Arc::new(std::sync::Mutex::new(minimize_to_tray)),
            });

            Ok(())
        })
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
            settings::get_minimize_to_tray,
            settings::set_minimize_to_tray,
        ])
        .on_menu_event(|app, event| match event.id().as_ref() {
            "quit" => {
                app.exit(0);
            }
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    window.show().unwrap();
                    window.unminimize().unwrap();
                    window.set_focus().unwrap();
                }
            }
            _ => {}
        })
        .on_window_event(|app, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if let Some(state) = app.try_state::<AppState>() {
                    let minimize_to_tray = *state.minimize_to_tray.lock().unwrap();
                    if minimize_to_tray {
                        // Prevent default close behavior
                        api.prevent_close();
                        // Hide window instead
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}