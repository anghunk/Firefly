use crate::models::{
    CreateFolderRequest, CreateNoteInFolderRequest, CreateNoteRequest, FrontMatter, Note,
    NoteContent, SaveNoteRequest, TreeNode,
};
use std::fs;
use std::path::Path;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum NoteError {
    #[error("Note not found: {0}")]
    NotFound(String),
    #[error("Note already exists: {0}")]
    AlreadyExists(String),
    #[error("Invalid note title: {0}")]
    InvalidTitle(String),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Trash error: {0}")]
    Trash(#[from] trash::Error),
}

pub fn get_notes(category_path: &str) -> Result<Vec<Note>, NoteError> {
    let path = Path::new(category_path);

    if !path.exists() {
        return Ok(Vec::new());
    }

    let mut notes = Vec::new();

    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let note_path = entry.path();

        if note_path.is_file() {
            if let Some(ext) = note_path.extension() {
                if ext == "md" {
                    let name = note_path
                        .file_stem()
                        .map(|n| n.to_string_lossy().to_string())
                        .unwrap_or_default();

                    let metadata = fs::metadata(&note_path)?;
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

                    // Extract tags from front matter
                    let tags = extract_tags_from_file(&note_path).unwrap_or_default();

                    notes.push(Note {
                        id: note_path.to_string_lossy().to_string(),
                        title: name,
                        path: note_path.to_string_lossy().to_string(),
                        category_id: category_path.to_string(),
                        created_at,
                        updated_at,
                        tags,
                    });
                }
            }
        }
    }

    // Sort by updated_at descending
    notes.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

    Ok(notes)
}

pub fn create_note(request: CreateNoteRequest) -> Result<Note, NoteError> {
    let title = request.title.trim();

    if title.is_empty() {
        return Err(NoteError::InvalidTitle("Title cannot be empty".to_string()));
    }

    let category_path = Path::new(&request.category_id);
    let note_path = category_path.join(format!("{}.md", title));

    if note_path.exists() {
        return Err(NoteError::AlreadyExists(title.to_string()));
    }

    // Create initial content with front matter
    let now = chrono::Utc::now();
    let datetime_str = now.format("%Y-%m-%d %H:%M:%S").to_string();

    let content = format!(
r#"---
title: {}
tags: []
created_at: {}
updated_at: {}
---
"#,
        title, datetime_str, datetime_str
    );

    fs::write(&note_path, content)?;

    Ok(Note {
        id: note_path.to_string_lossy().to_string(),
        title: title.to_string(),
        path: note_path.to_string_lossy().to_string(),
        category_id: request.category_id,
        created_at: datetime_str.clone(),
        updated_at: datetime_str,
        tags: Vec::new(),
    })
}

pub fn get_note_content(note_path: &str) -> Result<NoteContent, NoteError> {
    let path = Path::new(note_path);

    if !path.exists() {
        return Err(NoteError::NotFound(note_path.to_string()));
    }

    let content = fs::read_to_string(path)?;
    let (front_matter, body) = parse_front_matter(&content);

    let title = path
        .file_stem()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    Ok(NoteContent {
        id: note_path.to_string(),
        title,
        content: body,
        front_matter,
    })
}

pub fn save_note(request: SaveNoteRequest) -> Result<(), NoteError> {
    let path = Path::new(&request.path);

    // Ensure parent directory exists
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }

    fs::write(path, request.content)?;

    Ok(())
}

pub fn delete_note(note_path: &str) -> Result<(), NoteError> {
    let path = Path::new(note_path);

    if !path.exists() {
        return Err(NoteError::NotFound(note_path.to_string()));
    }

    trash::delete(path)?;

    Ok(())
}

pub fn rename_note(note_path: &str, new_title: &str) -> Result<TreeNode, NoteError> {
    let path = Path::new(note_path);

    if !path.exists() {
        return Err(NoteError::NotFound(note_path.to_string()));
    }

    let new_title = new_title.trim();
    if new_title.is_empty() {
        return Err(NoteError::InvalidTitle("Title cannot be empty".to_string()));
    }

    let parent = path.parent().ok_or_else(|| NoteError::NotFound("Parent directory not found".to_string()))?;
    let new_path = parent.join(format!("{}.md", new_title));

    if new_path.exists() && new_path != path {
        return Err(NoteError::AlreadyExists(new_title.to_string()));
    }

    // Read the current content
    let content = fs::read_to_string(path)?;

    // Update front matter title if present
    let updated_content = update_front_matter_title(&content, new_title);

    // Write to new location with updated content
    fs::write(&new_path, updated_content)?;

    // Remove old file if it's different
    if new_path != path {
        fs::remove_file(path)?;
    }

    let metadata = fs::metadata(&new_path)?;
    let tags = extract_tags_from_file(&new_path).unwrap_or_default();

    // Calculate depth
    let depth = calculate_depth(&new_path, parent);

    Ok(TreeNode {
        id: new_path.to_string_lossy().to_string(),
        name: new_title.to_string(),
        path: new_path.to_string_lossy().to_string(),
        node_type: "file".to_string(),
        depth,
        created_at: format_system_time(metadata.created()),
        updated_at: format_system_time(metadata.modified()),
        tags: Some(tags),
        is_empty: None,
    })
}

fn update_front_matter_title(content: &str, new_title: &str) -> String {
    if content.starts_with("---\n") {
        if let Some(end_idx) = content[4..].find("---\n") {
            let fm_str = &content[4..end_idx + 4];
            let body = &content[end_idx + 8..];

            // Update title in front matter
            let updated_fm = fm_str.lines()
                .map(|line| {
                    if line.trim().starts_with("title:") {
                        format!("title: {}", new_title)
                    } else {
                        line.to_string()
                    }
                })
                .collect::<Vec<_>>()
                .join("\n");

            return format!("---\n{}\n---{}\n", updated_fm, body);
        }
    }
    content.to_string()
}

fn parse_front_matter(content: &str) -> (FrontMatter, String) {
    let mut front_matter = FrontMatter::default();
    let mut body = content.to_string();

    if content.starts_with("---\n") {
        if let Some(end_idx) = content[4..].find("---\n") {
            let fm_str = &content[4..end_idx + 4];
            body = content[end_idx + 8..].to_string();

            // Parse YAML-like front matter
            for line in fm_str.lines() {
                if let Some((key, value)) = line.split_once(':') {
                    let key = key.trim();
                    let value = value.trim();

                    match key {
                        "title" => front_matter.title = Some(value.to_string()),
                        "tags" => {
                            if value.starts_with('[') && value.ends_with(']') {
                                let tags_str = &value[1..value.len()-1];
                                front_matter.tags = tags_str
                                    .split(',')
                                    .map(|s| s.trim().trim_matches('"').to_string())
                                    .filter(|s| !s.is_empty())
                                    .collect();
                            }
                        }
                        "created_at" => front_matter.created_at = Some(value.to_string()),
                        "updated_at" => front_matter.updated_at = Some(value.to_string()),
                        _ => {}
                    }
                }
            }
        }
    }

    (front_matter, body)
}

fn extract_tags_from_file(path: &Path) -> Result<Vec<String>, std::io::Error> {
    let content = fs::read_to_string(path)?;
    let (front_matter, _) = parse_front_matter(&content);
    Ok(front_matter.tags)
}

// ================== Tree Node Functions ==================

/// Recursively get all nodes (folders and files) in a category
pub fn get_tree_nodes(category_path: &str) -> Result<Vec<TreeNode>, NoteError> {
    let path = Path::new(category_path);
    if !path.exists() {
        return Ok(Vec::new());
    }

    let mut nodes = Vec::new();
    collect_tree_nodes(path, 0, &mut nodes)?;
    Ok(nodes)
}

/// Recursive helper - collects nodes depth-first
fn collect_tree_nodes(
    current_dir: &Path,
    depth: i32,
    nodes: &mut Vec<TreeNode>,
) -> Result<(), NoteError> {
    let mut entries: Vec<_> = fs::read_dir(current_dir)
        .map(|iter| iter.filter_map(|e| e.ok()).collect())
        .unwrap_or_default();

    // Sort: folders first, then files, alphabetically within each group
    entries.sort_by(|a, b| {
        let a_is_dir = a.path().is_dir();
        let b_is_dir = b.path().is_dir();
        match (a_is_dir, b_is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.file_name().cmp(&b.file_name()),
        }
    });

    for entry in entries {
        let entry_path = entry.path();
        let name = entry_path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();

        // Skip hidden files/folders (starting with .)
        if name.starts_with('.') {
            continue;
        }

        if entry_path.is_dir() {
            // It's a folder
            let metadata = fs::metadata(&entry_path)?;
            let created_at = format_system_time(metadata.created());
            let updated_at = format_system_time(metadata.modified());
            let is_empty = is_dir_empty(&entry_path)?;

            nodes.push(TreeNode {
                id: entry_path.to_string_lossy().to_string(),
                name,
                path: entry_path.to_string_lossy().to_string(),
                node_type: "folder".to_string(),
                depth,
                created_at,
                updated_at,
                tags: None,
                is_empty: Some(is_empty),
            });

            // Recursively collect children
            collect_tree_nodes(&entry_path, depth + 1, nodes)?;
        } else if entry_path.extension().map(|e| e == "md").unwrap_or(false) {
            // It's a markdown file
            let metadata = fs::metadata(&entry_path)?;
            let file_name = entry_path
                .file_stem()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default();
            let tags = extract_tags_from_file(&entry_path).unwrap_or_default();

            nodes.push(TreeNode {
                id: entry_path.to_string_lossy().to_string(),
                name: file_name,
                path: entry_path.to_string_lossy().to_string(),
                node_type: "file".to_string(),
                depth,
                created_at: format_system_time(metadata.created()),
                updated_at: format_system_time(metadata.modified()),
                tags: Some(tags),
                is_empty: None,
            });
        }
    }

    Ok(())
}

fn format_system_time(result: Result<std::time::SystemTime, std::io::Error>) -> String {
    result
        .map(|t| {
            let datetime: chrono::DateTime<chrono::Utc> = t.into();
            datetime.format("%Y-%m-%d %H:%M:%S").to_string()
        })
        .unwrap_or_default()
}

fn is_dir_empty(path: &Path) -> Result<bool, NoteError> {
    let mut entries = fs::read_dir(path)?;
    Ok(entries.next().is_none())
}

/// Create a subfolder
pub fn create_folder(request: CreateFolderRequest) -> Result<TreeNode, NoteError> {
    let name = request.name.trim();

    if name.is_empty() {
        return Err(NoteError::InvalidTitle("Folder name cannot be empty".to_string()));
    }

    // Validate folder name (no special characters)
    let invalid_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|'];
    if name.chars().any(|c| invalid_chars.contains(&c)) {
        return Err(NoteError::InvalidTitle(
            "Folder name contains invalid characters".to_string()
        ));
    }

    let folder_path = Path::new(&request.parent_path).join(name);

    if folder_path.exists() {
        return Err(NoteError::AlreadyExists(name.to_string()));
    }

    fs::create_dir_all(&folder_path)?;

    let now = chrono::Utc::now();
    let datetime_str = now.format("%Y-%m-%d %H:%M:%S").to_string();

    Ok(TreeNode {
        id: folder_path.to_string_lossy().to_string(),
        name: name.to_string(),
        path: folder_path.to_string_lossy().to_string(),
        node_type: "folder".to_string(),
        depth: 0, // Will be calculated by frontend
        created_at: datetime_str.clone(),
        updated_at: datetime_str,
        tags: None,
        is_empty: Some(true),
    })
}

/// Delete a folder (recursively moves to trash)
pub fn delete_folder(folder_path: &str) -> Result<(), NoteError> {
    let path = Path::new(folder_path);

    if !path.exists() {
        return Err(NoteError::NotFound(folder_path.to_string()));
    }

    if !path.is_dir() {
        return Err(NoteError::NotFound(format!("{} is not a directory", folder_path)));
    }

    trash::delete(path)?;

    Ok(())
}

/// Rename a folder
pub fn rename_folder(folder_path: &str, new_name: &str) -> Result<TreeNode, NoteError> {
    let path = Path::new(folder_path);

    if !path.exists() {
        return Err(NoteError::NotFound(folder_path.to_string()));
    }

    let new_name = new_name.trim();

    if new_name.is_empty() {
        return Err(NoteError::InvalidTitle("Folder name cannot be empty".to_string()));
    }

    // Validate folder name
    let invalid_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|'];
    if new_name.chars().any(|c| invalid_chars.contains(&c)) {
        return Err(NoteError::InvalidTitle(
            "Folder name contains invalid characters".to_string()
        ));
    }

    let parent = path.parent().ok_or_else(|| {
        NoteError::NotFound("Parent directory not found".to_string())
    })?;

    let new_path = parent.join(new_name);

    if new_path.exists() && new_path != path {
        return Err(NoteError::AlreadyExists(new_name.to_string()));
    }

    fs::rename(path, &new_path)?;

    let metadata = fs::metadata(&new_path)?;
    let is_empty = is_dir_empty(&new_path)?;

    Ok(TreeNode {
        id: new_path.to_string_lossy().to_string(),
        name: new_name.to_string(),
        path: new_path.to_string_lossy().to_string(),
        node_type: "folder".to_string(),
        depth: 0,
        created_at: format_system_time(metadata.created()),
        updated_at: format_system_time(metadata.modified()),
        tags: None,
        is_empty: Some(is_empty),
    })
}

/// Create note in a specific folder
pub fn create_note_in_folder(request: CreateNoteInFolderRequest) -> Result<TreeNode, NoteError> {
    let title = request.title.trim();

    if title.is_empty() {
        return Err(NoteError::InvalidTitle("Title cannot be empty".to_string()));
    }

    let parent_path = Path::new(&request.parent_path);

    // Ensure parent directory exists
    if !parent_path.exists() {
        fs::create_dir_all(parent_path)?;
    }

    let note_path = parent_path.join(format!("{}.md", title));

    if note_path.exists() {
        return Err(NoteError::AlreadyExists(title.to_string()));
    }

    // Create initial content with front matter
    let now = chrono::Utc::now();
    let datetime_str = now.format("%Y-%m-%d %H:%M:%S").to_string();

    let content = format!(
        r#"---
title: {}
tags: []
created_at: {}
updated_at: {}
---
"#,
        title, datetime_str, datetime_str
    );

    fs::write(&note_path, content)?;

    // Calculate depth
    let root = parent_path;
    let depth = calculate_depth(&note_path, root);

    Ok(TreeNode {
        id: note_path.to_string_lossy().to_string(),
        name: title.to_string(),
        path: note_path.to_string_lossy().to_string(),
        node_type: "file".to_string(),
        depth,
        created_at: datetime_str.clone(),
        updated_at: datetime_str,
        tags: Some(Vec::new()),
        is_empty: None,
    })
}

/// Calculate the depth of a node relative to a root path
fn calculate_depth(node_path: &Path, root_path: &Path) -> i32 {
    let mut depth = 0;
    let mut current = node_path.parent();

    while let Some(parent) = current {
        if parent == root_path {
            break;
        }
        depth += 1;
        current = parent.parent();
    }

    depth
}