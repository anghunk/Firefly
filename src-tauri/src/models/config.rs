use serde::{Deserialize, Serialize};

/// Local app config stored in system config directory
/// Device-specific settings that don't sync
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    /// Last opened notes directory
    pub last_notes_directory: String,
    /// UI theme preference (local to device)
    pub theme: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            last_notes_directory: String::new(),
            theme: "system".to_string(),
        }
    }
}

/// Workspace config stored in .firefly/config.json
/// Settings that sync across devices
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceConfig {
    /// Editor font size
    pub editor_font_size: i32,
    /// Editor line height
    pub editor_line_height: f32,
    /// Auto save delay in milliseconds
    pub auto_save_delay: i32,
    /// Show line numbers
    pub show_line_numbers: bool,
}

impl Default for WorkspaceConfig {
    fn default() -> Self {
        Self {
            editor_font_size: 14,
            editor_line_height: 1.6,
            auto_save_delay: 500,
            show_line_numbers: true,
        }
    }
}

/// Combined config for frontend use
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FullConfig {
    pub notes_directory: String,
    pub theme: String,
    pub editor_font_size: i32,
    pub editor_line_height: f32,
    pub auto_save_delay: i32,
    pub show_line_numbers: bool,
}