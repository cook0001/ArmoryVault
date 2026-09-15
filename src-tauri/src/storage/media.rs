use super::paths::AppPaths;
use std::fs;

pub struct MediaManager;

impl MediaManager {
    /// Saves a base64 encoded photo and generates a lightweight thumbnail
    pub fn save_base64_photo(base64_data: &str, filename: &str) -> Result<String, String> {
        let photos_dir = AppPaths::get_photos_dir();
        let target_path = photos_dir.join(filename);

        let clean_base64 = if let Some(idx) = base64_data.find(',') {
            &base64_data[idx + 1..]
        } else {
            base64_data
        };

        let decoded = hex::decode(clean_base64)
            .or_else(|_| {
                // If not hex, try base64 standard
                base64::Engine::decode(&base64::engine::general_purpose::STANDARD, clean_base64)
                    .map_err(|e| e.to_string())
            })
            .map_err(|e| format!("Decode error: {}", e))?;

        fs::write(&target_path, &decoded).map_err(|e| e.to_string())?;

        // Optional thumbnail generation using pure-Rust `image` crate
        if let Ok(img) = image::load_from_memory(&decoded) {
            let thumb = img.thumbnail(200, 200);
            let thumb_path = photos_dir.join(format!("thumb_{}", filename));
            let _ = thumb.save(thumb_path);
        }

        Ok(target_path.to_string_lossy().to_string())
    }

    /// Saves a base64 encoded document (e.g. PDF or tax stamp)
    pub fn save_base64_document(base64_data: &str, filename: &str) -> Result<String, String> {
        let docs_dir = AppPaths::get_documents_dir();
        let target_path = docs_dir.join(filename);

        let clean_base64 = if let Some(idx) = base64_data.find(',') {
            &base64_data[idx + 1..]
        } else {
            base64_data
        };

        let decoded = base64::Engine::decode(&base64::engine::general_purpose::STANDARD, clean_base64)
            .map_err(|e| format!("Base64 decode error: {}", e))?;

        fs::write(&target_path, decoded).map_err(|e| e.to_string())?;

        Ok(target_path.to_string_lossy().to_string())
    }
}
