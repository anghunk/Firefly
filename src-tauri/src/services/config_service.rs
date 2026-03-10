use crate::models::{AppConfig, CategoryOrderConfig, WorkspaceConfig, FullConfig};
use std::fs;
use std::path::PathBuf;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ConfigError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Parse error: {0}")]
    Parse(#[from] serde_json::Error),
    #[error("No notes directory configured")]
    #[allow(dead_code)]
    NoNotesDirectory,
}

const FIREFLY_DIR: &str = ".firefly";
const WORKSPACE_CONFIG_FILE: &str = "config.json";
const CATEGORY_ORDER_FILE: &str = "category_order.json";

// ============ Local App Config (System Config Dir) ============

fn get_local_config_path() -> PathBuf {
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("firefly-notes");

    config_dir.join("config.json")
}

pub fn get_app_config() -> Result<AppConfig, ConfigError> {
    let config_path = get_local_config_path();

    if config_path.exists() {
        let content = fs::read_to_string(config_path)?;
        let config: AppConfig = serde_json::from_str(&content)?;
        Ok(config)
    } else {
        Ok(AppConfig::default())
    }
}

pub fn save_app_config(config: &AppConfig) -> Result<(), ConfigError> {
    let config_path = get_local_config_path();

    // Ensure parent directory exists
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent)?;
    }

    let content = serde_json::to_string_pretty(config)?;
    fs::write(config_path, content)?;

    Ok(())
}

// ============ Workspace Config (.firefly/config.json) ============

fn get_firefly_dir(notes_dir: &str) -> PathBuf {
    PathBuf::from(notes_dir).join(FIREFLY_DIR)
}

fn get_workspace_config_path(notes_dir: &str) -> PathBuf {
    get_firefly_dir(notes_dir).join(WORKSPACE_CONFIG_FILE)
}

/// Initialize .firefly directory and default config if not exists
pub fn init_workspace(notes_dir: &str) -> Result<(), ConfigError> {
    let firefly_dir = get_firefly_dir(notes_dir);

    if !firefly_dir.exists() {
        fs::create_dir_all(&firefly_dir)?;
    }

    let config_path = get_workspace_config_path(notes_dir);

    if !config_path.exists() {
        let default_config = WorkspaceConfig::default();
        let content = serde_json::to_string_pretty(&default_config)?;
        fs::write(config_path, content)?;
    }

    Ok(())
}

/// Check if directory is a valid workspace (has .firefly folder)
pub fn is_valid_workspace(dir: &str) -> bool {
    PathBuf::from(dir).join(FIREFLY_DIR).exists()
}

/// Get workspace config from .firefly/config.json
pub fn get_workspace_config(notes_dir: &str) -> Result<WorkspaceConfig, ConfigError> {
    let config_path = get_workspace_config_path(notes_dir);

    if config_path.exists() {
        let content = fs::read_to_string(config_path)?;
        let config: WorkspaceConfig = serde_json::from_str(&content)?;
        Ok(config)
    } else {
        // Auto-initialize workspace if config doesn't exist
        init_workspace(notes_dir)?;
        Ok(WorkspaceConfig::default())
    }
}

/// Save workspace config to .firefly/config.json
pub fn save_workspace_config(notes_dir: &str, config: &WorkspaceConfig) -> Result<(), ConfigError> {
    // Ensure .firefly directory exists
    init_workspace(notes_dir)?;

    let config_path = get_workspace_config_path(notes_dir);
    let content = serde_json::to_string_pretty(config)?;
    fs::write(config_path, content)?;

    Ok(())
}

// ============ Category Order Config (.firefly/category_order.json) ============

fn get_category_order_path(notes_dir: &str) -> PathBuf {
    get_firefly_dir(notes_dir).join(CATEGORY_ORDER_FILE)
}

/// Get category order config from .firefly/category_order.json
pub fn get_category_order(notes_dir: &str) -> Result<CategoryOrderConfig, ConfigError> {
    let order_path = get_category_order_path(notes_dir);

    if order_path.exists() {
        let content = fs::read_to_string(order_path)?;
        let config: CategoryOrderConfig = serde_json::from_str(&content)?;
        Ok(config)
    } else {
        Ok(CategoryOrderConfig::default())
    }
}

/// Save category order config to .firefly/category_order.json
pub fn save_category_order(notes_dir: &str, config: &CategoryOrderConfig) -> Result<(), ConfigError> {
    // Ensure .firefly directory exists
    init_workspace(notes_dir)?;

    let order_path = get_category_order_path(notes_dir);
    let content = serde_json::to_string_pretty(config)?;
    fs::write(order_path, content)?;

    Ok(())
}

// ============ Combined Config ============

/// Get full config (combines local and workspace configs)
pub fn get_full_config() -> Result<FullConfig, ConfigError> {
    let app_config = get_app_config()?;

    let notes_dir = if app_config.last_notes_directory.is_empty() {
        return Ok(FullConfig {
            notes_directory: String::new(),
            theme: app_config.theme,
            minimize_to_tray: app_config.minimize_to_tray,
            ..WorkspaceConfig::default().into()
        });
    } else {
        app_config.last_notes_directory.clone()
    };

    // Initialize workspace if needed
    if !is_valid_workspace(&notes_dir) {
        init_workspace(&notes_dir)?;
    }

    let workspace_config = get_workspace_config(&notes_dir)?;

    Ok(FullConfig {
        notes_directory: notes_dir,
        theme: app_config.theme,
        minimize_to_tray: app_config.minimize_to_tray,
        show_line_numbers: workspace_config.show_line_numbers,
    })
}

/// Set notes directory and initialize workspace if needed
pub fn set_notes_directory(notes_dir: &str) -> Result<(), ConfigError> {
    // Initialize workspace
    init_workspace(notes_dir)?;

    // Update local config
    let mut app_config = get_app_config()?;
    app_config.last_notes_directory = notes_dir.to_string();
    save_app_config(&app_config)?;

    Ok(())
}

/// Save full config (splits between local and workspace)
pub fn save_full_config(config: &FullConfig) -> Result<(), ConfigError> {
    // Save local config (including minimize_to_tray)
    let mut app_config = get_app_config()?;
    app_config.last_notes_directory = config.notes_directory.clone();
    app_config.theme = config.theme.clone();
    app_config.minimize_to_tray = config.minimize_to_tray;
    save_app_config(&app_config)?;

    // Save workspace config if notes directory is set
    if !config.notes_directory.is_empty() {
        let workspace_config = WorkspaceConfig {
            show_line_numbers: config.show_line_numbers,
        };
        save_workspace_config(&config.notes_directory, &workspace_config)?;
    }

    Ok(())
}

/// Set the last opened note path
pub fn set_last_note_path(note_path: &str) -> Result<(), ConfigError> {
    let mut app_config = get_app_config()?;
    app_config.last_note_path = note_path.to_string();
    save_app_config(&app_config)
}

/// Get the last opened note path
pub fn get_last_note_path() -> String {
    match get_app_config() {
        Ok(config) => config.last_note_path,
        Err(_) => String::new(),
    }
}

// ============ Helpers ============

pub fn get_default_notes_dir() -> String {
    dirs::document_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("FireflyNotes")
        .to_string_lossy()
        .to_string()
}

impl From<WorkspaceConfig> for FullConfig {
    fn from(workspace: WorkspaceConfig) -> Self {
        Self {
            notes_directory: String::new(),
            theme: "system".to_string(),
            show_line_numbers: workspace.show_line_numbers,
            minimize_to_tray: false,
        }
    }
}