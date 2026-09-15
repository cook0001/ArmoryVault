use rusqlite::{params, Connection, Result};
use serde_json::Value;

pub struct Database;

impl Database {
    pub fn init(conn: &Connection) -> Result<()> {
        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS kv_meta (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS firearms (
                id INTEGER PRIMARY KEY,
                make TEXT,
                model TEXT,
                serial_number TEXT,
                caliber TEXT,
                data TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_firearms_serial ON firearms(serial_number);
            CREATE INDEX IF NOT EXISTS idx_firearms_make_model ON firearms(make, model);

            CREATE TABLE IF NOT EXISTS ammo (
                id INTEGER PRIMARY KEY,
                caliber TEXT,
                brand TEXT,
                bullet_type TEXT,
                data TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_ammo_caliber ON ammo(caliber);

            CREATE TABLE IF NOT EXISTS accessories (
                id INTEGER PRIMARY KEY,
                name TEXT,
                category TEXT,
                data TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS components (
                id INTEGER PRIMARY KEY,
                type TEXT,
                caliber TEXT,
                data TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS skus (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS storage_locations (
                id TEXT PRIMARY KEY,
                name TEXT,
                data TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS chrono_strings (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS target_analyses (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS load_ladder_tests (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS ballistic_profiles (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                action TEXT,
                data TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sync_queue (
                id TEXT PRIMARY KEY,
                payload TEXT NOT NULL,
                created_at INTEGER
            );
            "
        )?;

        Ok(())
    }

    /// Seeds SQLite from legacy decrypted JSON schema (one-time migration)
    pub fn import_legacy_json(conn: &mut Connection, root_json: &Value) -> Result<(), String> {
        let tx = conn.transaction().map_err(|e| e.to_string())?;

        // Firearms
        if let Some(list) = root_json.get("firearms").and_then(|v| v.as_array()) {
            for item in list {
                let id = item.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
                if id > 0 {
                    let make = item.get("make").and_then(|v| v.as_str());
                    let model = item.get("model").and_then(|v| v.as_str());
                    let serial = item.get("serial_number").and_then(|v| v.as_str());
                    let caliber = item.get("caliber").and_then(|v| v.as_str());
                    let data = serde_json::to_string(item).unwrap_or_default();

                    tx.execute(
                        "INSERT OR REPLACE INTO firearms (id, make, model, serial_number, caliber, data)
                         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                        params![id, make, model, serial, caliber, data],
                    ).map_err(|e| e.to_string())?;
                }
            }
        }

        // Ammo
        if let Some(list) = root_json.get("ammo").and_then(|v| v.as_array()) {
            for item in list {
                let id = item.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
                if id > 0 {
                    let caliber = item.get("caliber").and_then(|v| v.as_str());
                    let brand = item.get("brand").and_then(|v| v.as_str());
                    let b_type = item.get("bulletType").and_then(|v| v.as_str());
                    let data = serde_json::to_string(item).unwrap_or_default();

                    tx.execute(
                        "INSERT OR REPLACE INTO ammo (id, caliber, brand, bullet_type, data)
                         VALUES (?1, ?2, ?3, ?4, ?5)",
                        params![id, caliber, brand, b_type, data],
                    ).map_err(|e| e.to_string())?;
                }
            }
        }

        // Accessories
        if let Some(list) = root_json.get("accessories").and_then(|v| v.as_array()) {
            for item in list {
                let id = item.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
                if id > 0 {
                    let name = item.get("name").and_then(|v| v.as_str());
                    let cat = item.get("category").and_then(|v| v.as_str());
                    let data = serde_json::to_string(item).unwrap_or_default();

                    tx.execute(
                        "INSERT OR REPLACE INTO accessories (id, name, category, data)
                         VALUES (?1, ?2, ?3, ?4)",
                        params![id, name, cat, data],
                    ).map_err(|e| e.to_string())?;
                }
            }
        }

        // Components
        if let Some(list) = root_json.get("components").and_then(|v| v.as_array()) {
            for item in list {
                let id = item.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
                if id > 0 {
                    let c_type = item.get("type").and_then(|v| v.as_str());
                    let caliber = item.get("caliber").and_then(|v| v.as_str());
                    let data = serde_json::to_string(item).unwrap_or_default();

                    tx.execute(
                        "INSERT OR REPLACE INTO components (id, type, caliber, data)
                         VALUES (?1, ?2, ?3, ?4)",
                        params![id, c_type, caliber, data],
                    ).map_err(|e| e.to_string())?;
                }
            }
        }

        // SKUs
        if let Some(skus_map) = root_json.get("skus").and_then(|v| v.as_object()) {
            for (id, val) in skus_map {
                let data = serde_json::to_string(val).unwrap_or_default();
                tx.execute(
                    "INSERT OR REPLACE INTO skus (id, data) VALUES (?1, ?2)",
                    params![id, data],
                ).map_err(|e| e.to_string())?;
            }
        }

        // Storage locations
        if let Some(list) = root_json.get("storage_locations").and_then(|v| v.as_array()) {
            for item in list {
                let id = item.get("id").and_then(|v| v.as_str()).unwrap_or("");
                if !id.is_empty() {
                    let name = item.get("name").and_then(|v| v.as_str());
                    let data = serde_json::to_string(item).unwrap_or_default();
                    tx.execute(
                        "INSERT OR REPLACE INTO storage_locations (id, name, data) VALUES (?1, ?2, ?3)",
                        params![id, name, data],
                    ).map_err(|e| e.to_string())?;
                }
            }
        }

        tx.commit().map_err(|e| e.to_string())?;
        Ok(())
    }
}
