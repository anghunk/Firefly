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
    /// Show line numbers
    pub show_line_numbers: bool,
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
}