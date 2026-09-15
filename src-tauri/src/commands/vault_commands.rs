use crate::crypto::VaultCrypto;
use crate::storage::{AppPaths, Database};
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::State;

pub struct AppState {
    pub vault: Mutex<VaultCrypto>,
}

#[tauri::command]
pub fn is_vault_setup(state: State<AppState>) -> bool {
    let vault = state.vault.lock().unwrap();
    vault.is_vault_setup()
}

#[tauri::command]
pub fn is_vault_locked(state: State<AppState>) -> bool {
    let vault = state.vault.lock().unwrap();
    vault.is_locked()
}

#[tauri::command]
pub fn setup_vault(password: String, state: State<AppState>) -> Result<String, String> {
    let mut vault = state.vault.lock().unwrap();
    let empty_json = r#"{"schemaVersion":2,"firearms":[],"ammo":[],"accessories":[],"components":[],"storage_locations":[]}"#;
    let recovery_code = vault.setup_vault(&password, empty_json)?;

    // Also initialize SQLite tables
    let sqlite_path = AppPaths::get_sqlite_path();
    if let Ok(conn) = Connection::open(&sqlite_path) {
        let _ = Database::init(&conn);
    }

    Ok(recovery_code)
}

#[tauri::command]
pub fn unlock_vault(password: String, state: State<AppState>) -> Result<bool, String> {
    let mut vault = state.vault.lock().unwrap();
    let decrypted_json = vault.unlock_vault(&password)?;

    // Ensure SQLite database is initialized
    let sqlite_path = AppPaths::get_sqlite_path();
    if let Ok(mut conn) = Connection::open(&sqlite_path) {
        let _ = Database::init(&conn);

        // Check if SQLite is empty and we have decrypted JSON to migrate
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM firearms", [], |r| r.get(0)).unwrap_or(0);
        if count == 0 {
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&decrypted_json) {
                let _ = Database::import_legacy_json(&mut conn, &val);
            }
        }
    }

    Ok(true)
}

#[tauri::command]
pub fn unlock_with_recovery_code(code: String, state: State<AppState>) -> Result<bool, String> {
    let mut vault = state.vault.lock().unwrap();
    let decrypted_json = vault.unlock_with_recovery_code(&code)?;

    let sqlite_path = AppPaths::get_sqlite_path();
    if let Ok(mut conn) = Connection::open(&sqlite_path) {
        let _ = Database::init(&conn);
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM firearms", [], |r| r.get(0)).unwrap_or(0);
        if count == 0 {
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&decrypted_json) {
                let _ = Database::import_legacy_json(&mut conn, &val);
            }
        }
    }

    Ok(true)
}

#[tauri::command]
pub fn lock_vault(state: State<AppState>) -> Result<(), String> {
    let mut vault = state.vault.lock().unwrap();
    vault.lock();
    Ok(())
}

#[tauri::command]
pub fn get_recovery_code(state: State<AppState>) -> Option<String> {
    let vault = state.vault.lock().unwrap();
    vault.get_recovery_code()
}
