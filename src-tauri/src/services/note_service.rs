use crate::models::{CreateNoteRequest, Note, NoteContent, FrontMatter, SaveNoteRequest};
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

pub fn rename_note(note_path: &str, new_title: &str) -> Result<Note, NoteError> {
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
    let tags = extract_tags_from_file(&new_path).unwrap_or_default();

    Ok(Note {
        id: new_path.to_string_lossy().to_string(),
        title: new_title.to_string(),
        path: new_path.to_string_lossy().to_string(),
        category_id: parent.to_string_lossy().to_string(),
        created_at,
        updated_at,
        tags,
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