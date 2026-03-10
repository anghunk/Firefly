use serde::{Deserialize, Serialize};

/// Local app config stored in system config directory
/// Device-specific settings that don't sync
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    /// Last opened notes directory
    #[serde(default = "default_last_notes_directory")]
    pub last_notes_directory: String,
    /// Last opened note path
    #[serde(default = "default_last_note_path")]
    pub last_note_path: String,
    /// UI theme preference (local to device)
    #[serde(default = "default_theme")]
    pub theme: String,
    /// Minimize to tray when closing window
    #[serde(default = "default_minimize_to_tray")]
    pub minimize_to_tray: bool,
}

fn default_last_notes_directory() -> String {
    String::new()
}

fn default_last_note_path() -> String {
    String::new()
}

fn default_theme() -> String {
    "system".to_string()
}

fn default_minimize_to_tray() -> bool {
    true
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            last_notes_directory: String::new(),
            last_note_path: String::new(),
            theme: "system".to_string(),
            minimize_to_tray: true,
        }
    }
}

/// Workspace config stored in .firefly/config.json
/// Settings that sync across devices
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceConfig {
    /// Show line numbers
    #[serde(default = "default_show_line_numbers")]
    pub show_line_numbers: bool,
}

fn default_show_line_numbers() -> bool {
    true
}

impl Default for WorkspaceConfig {
    fn default() -> Self {
        Self {
            show_line_numbers: true,
        }
    }
}

/// Combined config for frontend use
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FullConfig {
    pub notes_directory: String,
    pub theme: String,
    pub show_line_numbers: bool,
    pub minimize_to_tray: bool,
}

impl Default for FullConfig {
    fn default() -> Self {
        Self {
            notes_directory: String::new(),
            theme: "system".to_string(),
            show_line_numbers: true,
            minimize_to_tray: false,
        }
    }
}