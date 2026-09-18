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
pub fn update_storage_location(id: String, location: Value) -> Result<Value, String> {
    let conn = get_conn()?;
    InventoryStore::update_storage_location(&conn, &id, location).map_err(|e| e.to_string())
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

// ─── Maintenance & Range Telemetry ────────────────────────────────────────
#[tauri::command]
pub fn complete_maintenance_task(
    firearm_id: i64,
    task_id: String,
    log_data: Value,
) -> Result<bool, String> {
    let conn = get_conn()?;
    InventoryStore::complete_maintenance_task(&conn, firearm_id, &task_id, log_data)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn log_range_session(session_data: Value) -> Result<Value, String> {
    let conn = get_conn()?;
    InventoryStore::log_range_session(&conn, session_data).map_err(|e| e.to_string())
}

// ─── Batch Imports ────────────────────────────────────────────────────────
#[tauri::command]
pub fn import_firearms_batch(
    firearms_list: Vec<Value>,
    updates_list: Option<Vec<Value>>,
) -> Result<Value, String> {
    let conn = get_conn()?;
    InventoryStore::import_firearms_batch(&conn, firearms_list, updates_list)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn import_ammo_batch(
    ammo_list: Vec<Value>,
    updates_list: Option<Vec<Value>>,
) -> Result<Value, String> {
    let conn = get_conn()?;
    InventoryStore::import_ammo_batch(&conn, ammo_list, updates_list)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn import_accessories_batch(accessories_list: Vec<Value>) -> Result<Value, String> {
    let conn = get_conn()?;
    InventoryStore::import_accessories_batch(&conn, accessories_list).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn import_components_batch(components_list: Vec<Value>) -> Result<Value, String> {
    let conn = get_conn()?;
    InventoryStore::import_components_batch(&conn, components_list).map_err(|e| e.to_string())
}

// ─── Key-Value Config (Modules & Settings) ────────────────────────────────
#[tauri::command]
pub fn get_config(key: String) -> Result<Option<Value>, String> {
    let conn = get_conn()?;
    InventoryStore::get_config(&conn, &key).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_config(key: String, value: Value) -> Result<bool, String> {
    let conn = get_conn()?;
    InventoryStore::set_config(&conn, &key, &value).map_err(|e| e.to_string())?;
    Ok(true)
}

// ─── Ballistic Profiles ───────────────────────────────────────────────────
#[tauri::command]
pub fn get_ballistic_profiles() -> Result<Vec<Value>, String> {
    let conn = get_conn()?;
    InventoryStore::get_ballistic_profiles(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_ballistic_profile(profile: Value) -> Result<String, String> {
    let conn = get_conn()?;
    InventoryStore::save_ballistic_profile(&conn, profile).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_ballistic_profile(id: String) -> Result<String, String> {
    let conn = get_conn()?;
    InventoryStore::delete_ballistic_profile(&conn, &id).map_err(|e| e.to_string())
}

// ─── Load Ladder Tests ────────────────────────────────────────────────────
#[tauri::command]
pub fn get_load_ladder_tests() -> Result<Vec<Value>, String> {
    let conn = get_conn()?;
    InventoryStore::get_load_ladder_tests(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_load_ladder_test(test: Value) -> Result<String, String> {
    let conn = get_conn()?;
    InventoryStore::save_load_ladder_test(&conn, test).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_load_ladder_test(id: String, test: Value) -> Result<String, String> {
    let conn = get_conn()?;
    let mut obj = test;
    if let Some(m) = obj.as_object_mut() {
        m.insert("id".to_string(), Value::String(id.clone()));
    }
    InventoryStore::save_load_ladder_test(&conn, obj).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_load_ladder_test(id: String) -> Result<String, String> {
    let conn = get_conn()?;
    InventoryStore::delete_load_ladder_test(&conn, &id).map_err(|e| e.to_string())
}

// ─── Handload Manufacturing Batch ─────────────────────────────────────────
#[tauri::command]
pub fn manufacture_handload_batch(
    ammo_id: i64,
    quantity: i64,
    deductions: Vec<Value>,
) -> Result<Value, String> {
    let conn = get_conn()?;
    InventoryStore::manufacture_handload_batch(&conn, ammo_id, quantity, deductions)
        .map_err(|e| e.to_string())
}

// ─── Sync Queue (Mobile Companion App) ────────────────────────────────────
#[tauri::command]
pub fn get_sync_queue() -> Result<Vec<Value>, String> {
    let conn = get_conn()?;
    InventoryStore::get_sync_queue(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_sync_item(id: String) -> Result<String, String> {
    let conn = get_conn()?;
    InventoryStore::remove_sync_item(&conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn clear_sync_queue() -> Result<(), String> {
    let conn = get_conn()?;
    InventoryStore::clear_sync_queue(&conn).map_err(|e| e.to_string())
}

// ─── Chronograph Strings & Target Analyses (Reloading Module) ─────────────
#[tauri::command]
pub fn get_chrono_strings() -> Result<Vec<Value>, String> {
    let conn = get_conn()?;
    InventoryStore::get_chrono_strings(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_chrono_string(chrono_string: Value) -> Result<String, String> {
    let conn = get_conn()?;
    InventoryStore::save_chrono_string(&conn, chrono_string).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_chrono_string(id: String) -> Result<String, String> {
    let conn = get_conn()?;
    InventoryStore::delete_chrono_string(&conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_target_analyses() -> Result<Vec<Value>, String> {
    let conn = get_conn()?;
    InventoryStore::get_target_analyses(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_target_analysis(target_analysis: Value) -> Result<String, String> {
    let conn = get_conn()?;
    InventoryStore::save_target_analysis(&conn, target_analysis).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_target_analysis(id: String) -> Result<String, String> {
    let conn = get_conn()?;
    InventoryStore::delete_target_analysis(&conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_ballistic_profile(id: String, profile: Value) -> Result<String, String> {
    let conn = get_conn()?;
    let mut obj = profile;
    if let Some(m) = obj.as_object_mut() {
        m.insert("id".to_string(), Value::String(id));
    }
    InventoryStore::save_ballistic_profile(&conn, obj).map_err(|e| e.to_string())
}

// ─── Module Data Direct Commands ──────────────────────────────────────────
#[tauri::command]
pub fn get_module_data(module_id: String, key: String) -> Result<Option<Value>, String> {
    crate::storage::ModuleDbManager::get_module_kv(&module_id, &key)
}

#[tauri::command]
pub fn set_module_data(module_id: String, key: String, value: Value) -> Result<bool, String> {
    crate::storage::ModuleDbManager::set_module_kv(&module_id, &key, &value)?;
    Ok(true)
}


