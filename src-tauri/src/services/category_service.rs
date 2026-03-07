use crate::models::{Category, CategoryOrderConfig, CreateCategoryRequest, RenameCategoryRequest};
use crate::services::config_service;
use std::fs;
use std::path::Path;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CategoryError {
    #[error("Category not found: {0}")]
    NotFound(String),
    #[error("Category already exists: {0}")]
    AlreadyExists(String),
    #[error("Invalid category name: {0}")]
    InvalidName(String),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Trash error: {0}")]
    Trash(#[from] trash::Error),
}

pub fn get_categories(notes_dir: &str) -> Result<Vec<Category>, CategoryError> {
    let notes_path = Path::new(notes_dir);
    if !notes_path.exists() {
        fs::create_dir_all(notes_path)?;
    }

    let mut categories = Vec::new();

    for entry in fs::read_dir(notes_path)? {
        let entry = entry?;
        let path = entry.path();

        if path.is_dir() {
            let name = path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default();

            // Skip hidden directories
            if name.starts_with('.') {
                continue;
            }

            let note_count = count_notes_in_dir(&path).unwrap_or(0);
            let metadata = fs::metadata(&path)?;
            let created_at = metadata.created()
                .map(|t| {
                    let datetime: chrono::DateTime<chrono::Utc> = t.into();
                    datetime.format("%Y-%m-%d %H:%M:%S").to_string()
                })
                .unwrap_or_default();
            let updated_at = metadata.modified()
                .map(|t| {
                    let datetime: chrono::DateTime<chrono::Utc> = t.into();
                    datetime.format("%Y-%m-%d %H:%M:%S").to_string()
                })
                .unwrap_or_default();

            categories.push(Category {
                id: path.to_string_lossy().to_string(),
                name,
                path: path.to_string_lossy().to_string(),
                created_at,
                updated_at,
                note_count,
            });
        }
    }

    // Sort by order config if available, otherwise by name
    let order_config = config_service::get_category_order(notes_dir).unwrap_or_default();
    if !order_config.category_ids.is_empty() {
        // Sort by order config, with items not in config sorted alphabetically at the end
        categories.sort_by(|a, b| {
            let a_index = order_config.category_ids.iter().position(|id| *id == a.id);
            let b_index = order_config.category_ids.iter().position(|id| *id == b.id);

            match (a_index, b_index) {
                (Some(a_i), Some(b_i)) => a_i.cmp(&b_i),
                (Some(_), None) => std::cmp::Ordering::Less,
                (None, Some(_)) => std::cmp::Ordering::Greater,
                (None, None) => a.name.cmp(&b.name),
            }
        });
    } else {
        categories.sort_by(|a, b| a.name.cmp(&b.name));
    }

    Ok(categories)
}

pub fn create_category(notes_dir: &str, request: CreateCategoryRequest) -> Result<Category, CategoryError> {
    let name = request.name.trim();

    if name.is_empty() {
        return Err(CategoryError::InvalidName("Name cannot be empty".to_string()));
    }

    // Validate name (no special characters)
    if name.contains(|c: char| !c.is_alphanumeric() && c != ' ' && c != '-' && c != '_') {
        return Err(CategoryError::InvalidName("Name contains invalid characters".to_string()));
    }

    let category_path = Path::new(notes_dir).join(name);

    if category_path.exists() {
        return Err(CategoryError::AlreadyExists(name.to_string()));
    }

    fs::create_dir_all(&category_path)?;

    let now = chrono::Utc::now();
    let created_at = now.format("%Y-%m-%d %H:%M:%S").to_string();

    Ok(Category {
        id: category_path.to_string_lossy().to_string(),
        name: name.to_string(),
        path: category_path.to_string_lossy().to_string(),
        created_at: created_at.clone(),
        updated_at: created_at,
        note_count: 0,
    })
}

pub fn rename_category(notes_dir: &str, request: RenameCategoryRequest) -> Result<Category, CategoryError> {
    let new_name = request.new_name.trim();

    if new_name.is_empty() {
        return Err(CategoryError::InvalidName("Name cannot be empty".to_string()));
    }

    let old_path = Path::new(&request.id);
    if !old_path.exists() {
        return Err(CategoryError::NotFound(request.id.clone()));
    }

    let parent = old_path.parent().unwrap_or(Path::new(notes_dir));
    let new_path = parent.join(new_name);

    if new_path.exists() && new_path != old_path {
        return Err(CategoryError::AlreadyExists(new_name.to_string()));
    }

    fs::rename(old_path, &new_path)?;

    let note_count = count_notes_in_dir(&new_path).unwrap_or(0);
    let now = chrono::Utc::now();
    let updated_at = now.format("%Y-%m-%d %H:%M:%S").to_string();

    Ok(Category {
        id: new_path.to_string_lossy().to_string(),
        name: new_name.to_string(),
        path: new_path.to_string_lossy().to_string(),
        created_at: "".to_string(), // Will be filled from frontend
        updated_at,
        note_count,
    })
}

pub fn delete_category(category_path: &str) -> Result<(), CategoryError> {
    let path = Path::new(category_path);

    if !path.exists() {
        return Err(CategoryError::NotFound(category_path.to_string()));
    }

    // Move to trash instead of permanent delete
    trash::delete(path)?;

    Ok(())
}

fn count_notes_in_dir(dir: &Path) -> Result<i32, std::io::Error> {
    let mut count = 0;

    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();

        if path.is_file() {
            if let Some(ext) = path.extension() {
                if ext == "md" {
                    count += 1;
                }
            }
        }
    }

    Ok(count)
}

// ============ Category Order Management ============

/// Add a new category ID to the end of the order list
#[allow(dead_code)]
pub fn add_category_to_order(notes_dir: &str, category_id: &str) -> Result<(), CategoryError> {
    let mut order_config = config_service::get_category_order(notes_dir)
        .unwrap_or_default();

    if !order_config.category_ids.contains(&category_id.to_string()) {
        order_config.category_ids.push(category_id.to_string());
        config_service::save_category_order(notes_dir, &order_config)
            .map_err(|e| CategoryError::Io(std::io::Error::new(std::io::ErrorKind::Other, e.to_string())))?;
    }

    Ok(())
}

/// Remove a category ID from the order list
pub fn remove_category_from_order(notes_dir: &str, category_id: &str) -> Result<(), CategoryError> {
    let mut order_config = config_service::get_category_order(notes_dir)
        .unwrap_or_default();

    order_config.category_ids.retain(|id| id != category_id);

    config_service::save_category_order(notes_dir, &order_config)
        .map_err(|e| CategoryError::Io(std::io::Error::new(std::io::ErrorKind::Other, e.to_string())))?;

    Ok(())
}

/// Update category ID in order list (for rename)
pub fn update_category_id_in_order(notes_dir: &str, old_id: &str, new_id: &str) -> Result<(), CategoryError> {
    let mut order_config = config_service::get_category_order(notes_dir)
        .unwrap_or_default();

    if let Some(pos) = order_config.category_ids.iter().position(|id| id == old_id) {
        order_config.category_ids[pos] = new_id.to_string();
        config_service::save_category_order(notes_dir, &order_config)
            .map_err(|e| CategoryError::Io(std::io::Error::new(std::io::ErrorKind::Other, e.to_string())))?;
    }

    Ok(())
}

/// Reorder categories by moving from_id to the position of to_id
pub fn reorder_categories(notes_dir: &str, from_id: &str, to_id: &str) -> Result<(), CategoryError> {
    let mut order_config = config_service::get_category_order(notes_dir)
        .unwrap_or_default();

    // Get current categories to ensure order list is complete
    let categories = get_categories(notes_dir)?;
    let all_ids: Vec<String> = categories.iter().map(|c| c.id.clone()).collect();

    // Initialize order if empty or incomplete
    if order_config.category_ids.is_empty() {
        order_config.category_ids = all_ids.clone();
    } else {
        // Add any missing IDs at the end
        for id in &all_ids {
            if !order_config.category_ids.contains(id) {
                order_config.category_ids.push(id.clone());
            }
        }
        // Remove any IDs that no longer exist
        order_config.category_ids.retain(|id| all_ids.contains(id));
    }

    // Find positions
    let from_pos = order_config.category_ids.iter().position(|id| id == from_id);
    let to_pos = order_config.category_ids.iter().position(|id| id == to_id);

    if let (Some(from_idx), Some(to_idx)) = (from_pos, to_pos) {
        // Remove from current position
        let id = order_config.category_ids.remove(from_idx);
        // Insert at new position
        // After removal, if we were moving forward, the target index shifts left by 1
        let insert_idx = if from_idx < to_idx { to_idx - 1 } else { to_idx };
        order_config.category_ids.insert(insert_idx, id);

        config_service::save_category_order(notes_dir, &order_config)
            .map_err(|e| CategoryError::Io(std::io::Error::new(std::io::ErrorKind::Other, e.to_string())))?;
    }

    Ok(())
}

/// Get the category order config
pub fn get_category_order_config(notes_dir: &str) -> Result<CategoryOrderConfig, CategoryError> {
    config_service::get_category_order(notes_dir)
        .map_err(|e| CategoryError::Io(std::io::Error::new(std::io::ErrorKind::Other, e.to_string())))
}

/// Save the category order config
pub fn save_category_order_config(notes_dir: &str, config: &CategoryOrderConfig) -> Result<(), CategoryError> {
    config_service::save_category_order(notes_dir, config)
        .map_err(|e| CategoryError::Io(std::io::Error::new(std::io::ErrorKind::Other, e.to_string())))
}