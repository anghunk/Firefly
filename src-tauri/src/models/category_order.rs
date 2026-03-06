use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryOrderConfig {
    pub category_ids: Vec<String>,
}

impl Default for CategoryOrderConfig {
    fn default() -> Self {
        Self {
            category_ids: Vec::new(),
        }
    }
}