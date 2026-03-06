pub mod category;
pub mod category_order;
pub mod config;
pub mod note;

// Re-export types for easier imports
pub use category::{Category, CreateCategoryRequest, RenameCategoryRequest};
pub use category_order::CategoryOrderConfig;
pub use config::{AppConfig, WorkspaceConfig, FullConfig};
pub use note::{CreateNoteRequest, FrontMatter, Note, NoteContent, SaveNoteRequest};