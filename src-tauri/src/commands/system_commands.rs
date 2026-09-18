use crate::storage::paths::AppPaths;
use crate::storage::MediaManager;
use serde_json::{json, Value};
use std::io::Write;
use std::path::Path;
use zip::write::SimpleFileOptions;
use zip::CompressionMethod;

#[tauri::command]
pub fn get_local_ip() -> String {
    local_ip_address::local_ip()
        .map(|ip| ip.to_string())
        .unwrap_or_else(|_| "127.0.0.1".to_string())
}

#[tauri::command]
pub fn get_all_local_ips() -> Vec<String> {
    local_ip_address::list_afinet_netifas()
        .map(|list| list.into_iter().map(|(_, ip)| ip.to_string()).collect())
        .unwrap_or_else(|_| vec!["127.0.0.1".to_string()])
}

#[tauri::command]
pub fn save_base64_photo(base64_data: String, filename: String) -> Result<String, String> {
    MediaManager::save_base64_photo(&base64_data, &filename)
}

#[tauri::command]
pub fn save_base64_document(base64_data: String, filename: String) -> Result<String, String> {
    MediaManager::save_base64_document(&base64_data, &filename)
}

#[tauri::command]
pub fn save_photo(source_path: String, filename: String) -> Result<String, String> {
    let photos_dir = AppPaths::get_photos_dir();
    let _ = std::fs::create_dir_all(&photos_dir);
    let target_path = photos_dir.join(&filename);

    std::fs::copy(&source_path, &target_path).map_err(|e| e.to_string())?;

    // Thumbnail generation
    if let Ok(data) = std::fs::read(&target_path) {
        if let Ok(img) = image::load_from_memory(&data) {
            let thumb = img.thumbnail(200, 200);
            let thumb_path = photos_dir.join(format!("thumb_{}", filename));
            let _ = thumb.save(thumb_path);
        }
    }

    Ok(target_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn save_document(source_path: String, filename: String) -> Result<String, String> {
    let docs_dir = AppPaths::get_documents_dir();
    let _ = std::fs::create_dir_all(&docs_dir);
    let target_path = docs_dir.join(&filename);

    std::fs::copy(&source_path, &target_path).map_err(|e| e.to_string())?;
    Ok(target_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn get_backup_folder() -> Option<String> {
    let config_path = AppPaths::get_app_data_dir().join("config.json");
    if let Ok(content) = std::fs::read_to_string(config_path) {
        if let Ok(val) = serde_json::from_str::<Value>(&content) {
            return val.get("backup_folder").and_then(|v| v.as_str()).map(|s| s.to_string());
        }
    }
    None
}

#[tauri::command]
pub fn select_backup_folder() -> Option<String> {
    let picked = rfd::FileDialog::new()
        .set_title("Select Backup Folder")
        .pick_folder();

    if let Some(path) = picked {
        let folder_str = path.to_string_lossy().to_string();
        let config_path = AppPaths::get_app_data_dir().join("config.json");
        let mut cfg = if let Ok(c) = std::fs::read_to_string(&config_path) {
            serde_json::from_str::<Value>(&c).unwrap_or(json!({}))
        } else {
            json!({})
        };
        cfg["backup_folder"] = json!(folder_str);
        let _ = std::fs::write(config_path, serde_json::to_string_pretty(&cfg).unwrap_or_default());
        Some(folder_str)
    } else {
        None
    }
}

fn add_dir_to_zip<W: Write + std::io::Seek>(
    zip: &mut zip::ZipWriter<W>,
    base_dir: &Path,
    current_dir: &Path,
    options: SimpleFileOptions,
) -> Result<(), String> {
    if !current_dir.exists() {
        return Ok(());
    }
    for entry in std::fs::read_dir(current_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let rel_path = match path.strip_prefix(base_dir) {
            Ok(p) => p,
            Err(_) => continue,
        };
        let rel_str = rel_path.to_string_lossy().replace('\\', "/");

        if path.is_dir() {
            let _ = zip.add_directory(&rel_str, options);
            add_dir_to_zip(zip, base_dir, &path, options)?;
        } else if path.is_file() {
            zip.start_file(&rel_str, options).map_err(|e| e.to_string())?;
            let data = std::fs::read(&path).map_err(|e| e.to_string())?;
            zip.write_all(&data).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn create_zip_backup() -> Result<Value, String> {
    let default_date = chrono::Utc::now().format("%Y-%m-%d").to_string();
    let default_filename = format!("ArmoryVault_Full_Backup_{}.zip", default_date);

    let picked = rfd::FileDialog::new()
        .set_title("Save Full Backup Archive (.zip)")
        .set_file_name(&default_filename)
        .add_filter("Zip Archives (*.zip)", &["zip"])
        .save_file();

    let zip_path = match picked {
        Some(p) => p,
        None => return Ok(json!({ "success": false, "canceled": true })),
    };

    let file = std::fs::File::create(&zip_path).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(file);
    let options = SimpleFileOptions::default()
        .compression_method(CompressionMethod::Deflated);

    let app_data = AppPaths::get_app_data_dir();

    // Package root database & vault artifacts
    for filename in &[
        "armoryvault.sqlite",
        "armoryvault.sqlite-wal",
        "armoryvault.sqlite-shm",
        "firearms_inventory.enc",
        "config.json",
    ] {
        let f_path = app_data.join(filename);
        if f_path.exists() && f_path.is_file() {
            zip.start_file(*filename, options).map_err(|e| e.to_string())?;
            let data = std::fs::read(&f_path).map_err(|e| e.to_string())?;
            zip.write_all(&data).map_err(|e| e.to_string())?;
        }
    }

    // Package dedicated module databases (module_data/*.sqlite)
    let module_dir = app_data.join("module_data");
    if module_dir.exists() {
        add_dir_to_zip(&mut zip, &app_data, &module_dir, options)?;
    }

    // Package photos directory
    let photos_dir = AppPaths::get_photos_dir();
    if photos_dir.exists() {
        add_dir_to_zip(&mut zip, &app_data, &photos_dir, options)?;
    }

    // Package documents directory
    let docs_dir = AppPaths::get_documents_dir();
    if docs_dir.exists() {
        add_dir_to_zip(&mut zip, &app_data, &docs_dir, options)?;
    }

    zip.finish().map_err(|e| e.to_string())?;

    Ok(json!({
        "success": true,
        "filePath": zip_path.to_string_lossy().to_string()
    }))
}

#[tauri::command]
pub fn restore_backup() -> Result<Value, String> {
    let picked = rfd::FileDialog::new()
        .set_title("Select Backup File to Restore")
        .add_filter("ArmoryVault Backups (*.enc, *.zip)", &["enc", "zip"])
        .add_filter("Encrypted Vault (*.enc)", &["enc"])
        .add_filter("Full Zip Archive (*.zip)", &["zip"])
        .pick_file();

    let backup_path = match picked {
        Some(p) => p,
        None => return Ok(json!({ "canceled": true })),
    };

    let ext = backup_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    let app_data = AppPaths::get_app_data_dir();

    if ext == "enc" {
        let dest = app_data.join("firearms_inventory.enc");
        std::fs::copy(&backup_path, &dest).map_err(|e| e.to_string())?;
        return Ok(json!({
            "success": true,
            "requiresRelogin": true,
            "filePath": backup_path.to_string_lossy().to_string(),
            "type": "enc"
        }));
    } else if ext == "zip" {
        let file = std::fs::File::open(&backup_path).map_err(|e| e.to_string())?;
        let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;

        for i in 0..archive.len() {
            let mut item = archive.by_index(i).map_err(|e| e.to_string())?;
            let enclosed = match item.enclosed_name() {
                Some(n) => n.to_owned(),
                None => continue,
            };
            let outpath = app_data.join(enclosed);
            if item.is_dir() {
                let _ = std::fs::create_dir_all(&outpath);
            } else {
                if let Some(p) = outpath.parent() {
                    let _ = std::fs::create_dir_all(p);
                }
                let mut outfile = std::fs::File::create(&outpath).map_err(|e| e.to_string())?;
                std::io::copy(&mut item, &mut outfile).map_err(|e| e.to_string())?;
            }
        }
        return Ok(json!({
            "success": true,
            "requiresRelogin": true,
            "filePath": backup_path.to_string_lossy().to_string(),
            "type": "zip"
        }));
    }

    Err("Unsupported backup format. Must be .enc or .zip".to_string())
}

#[tauri::command]
pub fn select_and_save_photo() -> Result<Option<Vec<String>>, String> {
    let picked = rfd::FileDialog::new()
        .set_title("Select Photo")
        .add_filter("Images", &["jpg", "jpeg", "png", "webp", "gif"])
        .pick_files();

    let files = match picked {
        Some(f) if !f.is_empty() => f,
        _ => return Ok(None),
    };

    let mut saved_paths = Vec::new();
    let photos_dir = AppPaths::get_photos_dir();
    let _ = std::fs::create_dir_all(&photos_dir);

    for src in files {
        let ext = src
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("jpg")
            .to_lowercase();
        let filename = format!(
            "photo_{}_{}.{}",
            chrono::Utc::now().timestamp_millis(),
            rand::random::<u32>(),
            ext
        );
        let dest = photos_dir.join(&filename);
        if std::fs::copy(&src, &dest).is_ok() {
            if let Ok(data) = std::fs::read(&dest) {
                if let Ok(img) = image::load_from_memory(&data) {
                    let thumb = img.thumbnail(200, 200);
                    let thumb_path = photos_dir.join(format!("thumb_{}", filename));
                    let _ = thumb.save(thumb_path);
                }
            }
            saved_paths.push(dest.to_string_lossy().to_string());
        }
    }

    if saved_paths.is_empty() {
        Ok(None)
    } else {
        Ok(Some(saved_paths))
    }
}

#[tauri::command]
pub fn select_and_save_document() -> Result<Option<Value>, String> {
    let picked = rfd::FileDialog::new()
        .set_title("Select Document")
        .add_filter("Documents", &["pdf", "jpg", "jpeg", "png"])
        .pick_file();

    let src = match picked {
        Some(f) => f,
        None => return Ok(None),
    };

    let ext = src
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("pdf")
        .to_lowercase();
    let filename = format!("doc_{}.{}", chrono::Utc::now().timestamp_millis(), ext);
    let docs_dir = AppPaths::get_documents_dir();
    let _ = std::fs::create_dir_all(&docs_dir);
    let dest = docs_dir.join(&filename);

    std::fs::copy(&src, &dest).map_err(|e| e.to_string())?;

    let orig_name = src
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("document")
        .to_string();

    Ok(Some(json!({
        "name": orig_name,
        "path": dest.to_string_lossy().to_string()
    })))
}

#[tauri::command]
pub fn select_csv_file() -> Result<Option<Value>, String> {
    let picked = rfd::FileDialog::new()
        .set_title("Select CSV / TSV File to Import")
        .add_filter("CSV & Spreadsheets (*.csv, *.tsv, *.txt)", &["csv", "tsv", "txt"])
        .add_filter("CSV Spreadsheets (*.csv)", &["csv"])
        .add_filter("All Files (*.*)", &["*"])
        .pick_file();

    let path = match picked {
        Some(p) => p,
        None => return Ok(None),
    };

    let content = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("imported.csv")
        .to_string();

    Ok(Some(json!({
        "name": name,
        "path": path.to_string_lossy().to_string(),
        "content": content
    })))
}

#[tauri::command]
pub fn save_qr_image(item_name: String, qr_data_url: String) -> Result<bool, String> {
    let sanitized_name = item_name
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '_' })
        .collect::<String>()
        .to_lowercase();
    let default_name = format!("QR_{}.png", sanitized_name);

    let picked = rfd::FileDialog::new()
        .set_title("Save QR Code")
        .set_file_name(&default_name)
        .add_filter("Images (*.png)", &["png"])
        .save_file();

    let output_path = match picked {
        Some(p) => p,
        None => return Ok(false),
    };

    let clean_base64 = if let Some(idx) = qr_data_url.find(',') {
        &qr_data_url[idx + 1..]
    } else {
        &qr_data_url
    };

    let decoded = base64::Engine::decode(&base64::engine::general_purpose::STANDARD, clean_base64)
        .map_err(|e| e.to_string())?;

    std::fs::write(output_path, decoded).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub fn open_external_file(file_path: String) -> Result<(), String> {
    let clean_path = if file_path.starts_with("file://") {
        file_path.replace("file://", "")
    } else {
        file_path
    };

    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open").arg(&clean_path).spawn();
    }
    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("cmd").args(&["/c", "start", "", &clean_path]).spawn();
    }
    #[cfg(target_os = "linux")]
    {
        let _ = std::process::Command::new("xdg-open").arg(&clean_path).spawn();
    }

    Ok(())
}

#[tauri::command]
pub fn open_url(url: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open").arg(&url).spawn();
    }
    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("cmd").args(&["/c", "start", "", &url]).spawn();
    }
    #[cfg(target_os = "linux")]
    {
        let _ = std::process::Command::new("xdg-open").arg(&url).spawn();
    }

    Ok(())
}

#[tauri::command]
pub fn read_file_base64(file_path: String) -> Result<Option<String>, String> {
    let clean_path = if file_path.starts_with("file://") {
        file_path.replace("file://", "")
    } else {
        file_path
    };
    let bytes = std::fs::read(&clean_path).map_err(|e| e.to_string())?;
    Ok(Some(base64::Engine::encode(&base64::engine::general_purpose::STANDARD, bytes)))
}

#[tauri::command]
pub fn read_file_buffer(file_path: String) -> Result<Option<Vec<u8>>, String> {
    let clean_path = if file_path.starts_with("file://") {
        file_path.replace("file://", "")
    } else {
        file_path
    };
    let bytes = std::fs::read(&clean_path).map_err(|e| e.to_string())?;
    Ok(Some(bytes))
}
