use crate::storage::MediaManager;

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
