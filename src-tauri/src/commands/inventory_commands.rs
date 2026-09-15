use crate::storage::{AppPaths, Database, InventoryStore};
use rusqlite::Connection;
use serde_json::Value;

fn get_conn() -> Result<Connection, String> {
    let sqlite_path = AppPaths::get_sqlite_path();
    let conn = Connection::open(sqlite_path).map_err(|e| e.to_string())?;
    let _ = Database::init(&conn);
    Ok(conn)
}

// ─── Firearms ────────────────────────────────────────────────────────────
#[tauri::command]
pub fn get_firearms() -> Result<Vec<Value>, String> {
    let conn = get_conn()?;
    InventoryStore::get_firearms(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_firearm(firearm: Value) -> Result<i64, String> {
    let conn = get_conn()?;
    InventoryStore::insert_firearm(&conn, firearm).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_firearm(id: i64, firearm: Value) -> Result<i64, String> {
    let conn = get_conn()?;
    InventoryStore::update_firearm(&conn, id, firearm).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_firearm(id: i64) -> Result<i64, String> {
    let conn = get_conn()?;
    InventoryStore::delete_firearm(&conn, id).map_err(|e| e.to_string())
}

// ─── Ammunition ──────────────────────────────────────────────────────────
#[tauri::command]
pub fn get_ammo() -> Result<Vec<Value>, String> {
    let conn = get_conn()?;
    InventoryStore::get_ammo(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_ammo(ammo: Value) -> Result<i64, String> {
    let conn = get_conn()?;
    InventoryStore::insert_ammo(&conn, ammo).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_ammo(id: i64, ammo: Value) -> Result<i64, String> {
    let conn = get_conn()?;
    InventoryStore::update_ammo(&conn, id, ammo).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_ammo(id: i64) -> Result<i64, String> {
    let conn = get_conn()?;
    InventoryStore::delete_ammo(&conn, id).map_err(|e| e.to_string())
}

// ─── Accessories ─────────────────────────────────────────────────────────
#[tauri::command]
pub fn get_accessories() -> Result<Vec<Value>, String> {
    let conn = get_conn()?;
    InventoryStore::get_accessories(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_accessory(accessory: Value) -> Result<i64, String> {
    let conn = get_conn()?;
    InventoryStore::insert_accessory(&conn, accessory).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_accessory(id: i64, accessory: Value) -> Result<i64, String> {
    let conn = get_conn()?;
    InventoryStore::update_accessory(&conn, id, accessory).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_accessory(id: i64) -> Result<i64, String> {
    let conn = get_conn()?;
    InventoryStore::delete_accessory(&conn, id).map_err(|e| e.to_string())
}

// ─── Components ──────────────────────────────────────────────────────────
#[tauri::command]
pub fn get_components() -> Result<Vec<Value>, String> {
    let conn = get_conn()?;
    InventoryStore::get_components(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_component(component: Value) -> Result<i64, String> {
    let conn = get_conn()?;
    InventoryStore::insert_component(&conn, component).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_component(id: i64, component: Value) -> Result<i64, String> {
    let conn = get_conn()?;
    InventoryStore::update_component(&conn, id, component).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_component(id: i64) -> Result<i64, String> {
    let conn = get_conn()?;
    InventoryStore::delete_component(&conn, id).map_err(|e| e.to_string())
}

// ─── Custom SKUs ─────────────────────────────────────────────────────────
#[tauri::command]
pub fn get_skus() -> Result<serde_json::Map<String, Value>, String> {
    let conn = get_conn()?;
    InventoryStore::get_skus(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_skus(skus: serde_json::Map<String, Value>) -> Result<bool, String> {
    let conn = get_conn()?;
    InventoryStore::save_skus(&conn, skus).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_sku(sku_id: String) -> Result<String, String> {
    let conn = get_conn()?;
    InventoryStore::delete_sku(&conn, &sku_id).map_err(|e| e.to_string())
}

// ─── Storage Locations ───────────────────────────────────────────────────
#[tauri::command]
pub fn get_storage_locations() -> Result<Vec<Value>, String> {
    let conn = get_conn()?;
    InventoryStore::get_storage_locations(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_storage_location(location: Value) -> Result<Value, String> {
    let conn = get_conn()?;
    InventoryStore::save_storage_location(&conn, location).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_storage_location(id: String) -> Result<String, String> {
    let conn = get_conn()?;
    InventoryStore::delete_storage_location(&conn, &id).map_err(|e| e.to_string())
}

// ─── Activity Log ────────────────────────────────────────────────────────
#[tauri::command]
pub fn get_activity_log() -> Result<Vec<Value>, String> {
    let conn = get_conn()?;
    InventoryStore::get_activity_log(&conn).map_err(|e| e.to_string())
}
