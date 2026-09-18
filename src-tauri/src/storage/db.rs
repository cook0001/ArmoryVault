use super::module_db::ModuleDbManager;
use rusqlite::{params, Connection, Result};
use serde_json::Value;

pub struct Database;

impl Database {
    /// Initializes core SQLite database with high-concurrency WAL mode and indexes.
    pub fn init(conn: &Connection) -> Result<()> {
        conn.execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;
             PRAGMA busy_timeout = 5000;
             PRAGMA foreign_keys = ON;

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

            CREATE TABLE IF NOT EXISTS storage_locations (
                id TEXT PRIMARY KEY,
                name TEXT,
                data TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS skus (
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

            -- Backwards-compatibility tables in core (read fallback)
            CREATE TABLE IF NOT EXISTS components (
                id INTEGER PRIMARY KEY,
                type TEXT,
                caliber TEXT,
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
            "
        )?;

        Ok(())
    }

    /// Flexible ID parser handling JSON numbers, numeric strings, UUID strings, or fallback index
    pub fn get_id_str(item: &Value, fallback_idx: usize) -> String {
        if let Some(s) = item.get("id").and_then(|v| v.as_str()) {
            if !s.is_empty() {
                return s.to_string();
            }
        }
        if let Some(n) = item.get("id").and_then(|v| v.as_i64()) {
            return n.to_string();
        }
        fallback_idx.to_string()
    }

    /// Seeds Core and Module databases from legacy decrypted JSON schema
    pub fn import_legacy_json(conn: &mut Connection, root_json: &Value) -> Result<(), String> {
        let tx = conn.transaction().map_err(|e| e.to_string())?;

        // 1. Firearms (Core)
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

        // 2. Ammo (Core)
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

        // 3. Accessories (Core, with mountedOnFirearmId -> mounts migration)
        if let Some(list) = root_json.get("accessories").and_then(|v| v.as_array()) {
            for item in list {
                let id = item.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
                if id > 0 {
                    let mut acc = item.clone();
                    if let Some(obj) = acc.as_object_mut() {
                        if let Some(fid) = obj.get("mountedOnFirearmId").and_then(|v| v.as_i64()) {
                            if !obj.contains_key("mounts") {
                                let qty = obj.get("quantity").and_then(|v| v.as_i64()).unwrap_or(1);
                                obj.insert("mounts".to_string(), serde_json::json!([{ "firearmId": fid, "quantity": qty }]));
                            }
                            obj.remove("mountedOnFirearmId");
                        }
                    }
                    let name = acc.get("name").and_then(|v| v.as_str());
                    let cat = acc.get("category").and_then(|v| v.as_str());
                    let data = serde_json::to_string(&acc).unwrap_or_default();

                    tx.execute(
                        "INSERT OR REPLACE INTO accessories (id, name, category, data)
                         VALUES (?1, ?2, ?3, ?4)",
                        params![id, name, cat, data],
                    ).map_err(|e| e.to_string())?;
                }
            }
        }

        // 4. Storage Locations (Core) — Fixed to parse integer and string IDs seamlessly
        if let Some(list) = root_json.get("storage_locations").and_then(|v| v.as_array()) {
            for (idx, item) in list.iter().enumerate() {
                let id_str = Self::get_id_str(item, idx + 1);
                let name = item.get("name").and_then(|v| v.as_str()).unwrap_or("Storage Space");
                let mut loc_clone = item.clone();
                if let Some(obj) = loc_clone.as_object_mut() {
                    if let Ok(num) = id_str.parse::<i64>() {
                        obj.insert("id".to_string(), Value::Number(serde_json::Number::from(num)));
                    } else {
                        obj.insert("id".to_string(), Value::String(id_str.clone()));
                    }
                }
                let data = serde_json::to_string(&loc_clone).unwrap_or_default();

                tx.execute(
                    "INSERT OR REPLACE INTO storage_locations (id, name, data) VALUES (?1, ?2, ?3)",
                    params![id_str, name, data],
                ).map_err(|e| e.to_string())?;
            }
        }

        // 5. Custom SKUs (Core)
        if let Some(skus_map) = root_json.get("skus").and_then(|v| v.as_object()) {
            for (id, val) in skus_map {
                let data = serde_json::to_string(val).unwrap_or_default();
                tx.execute(
                    "INSERT OR REPLACE INTO skus (id, data) VALUES (?1, ?2)",
                    params![id, data],
                ).map_err(|e| e.to_string())?;
            }
        }

        // 6. Activity Log (Core)
        if let Some(list) = root_json.get("activity_log").and_then(|v| v.as_array()) {
            for item in list {
                let timestamp = item.get("timestamp").and_then(|v| v.as_str()).unwrap_or("");
                let action = item.get("action").and_then(|v| v.as_str()).unwrap_or("LOG");
                let data = serde_json::to_string(item).unwrap_or_default();
                tx.execute(
                    "INSERT INTO activity_log (timestamp, action, data) VALUES (?1, ?2, ?3)",
                    params![timestamp, action, data],
                ).map_err(|e| e.to_string())?;
            }
        }

        tx.commit().map_err(|e| e.to_string())?;

        // ─── EXTENSION MODULE DEDICATED DATABASES MIGRATION ───────────────────
        Self::migrate_module_collections(root_json)?;

        Ok(())
    }

    /// Migrates module-specific collections into their dedicated SQLite database files in module_data/
    fn migrate_module_collections(root_json: &Value) -> Result<(), String> {
        // A. Reloading Module Database: `module_data/reloading.sqlite`
        if let Ok(mut r_conn) = ModuleDbManager::get_connection("reloading") {
            if let Ok(r_tx) = r_conn.transaction() {
                // Components
                if let Some(list) = root_json.get("components").and_then(|v| v.as_array()) {
                    for item in list {
                        let id = item.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
                        if id > 0 {
                            let c_type = item.get("type").and_then(|v| v.as_str());
                            let caliber = item.get("caliber").and_then(|v| v.as_str());
                            let data = serde_json::to_string(item).unwrap_or_default();
                            let _ = r_tx.execute(
                                "INSERT OR REPLACE INTO components (id, type, caliber, data) VALUES (?1, ?2, ?3, ?4)",
                                params![id, c_type, caliber, data],
                            );
                        }
                    }
                }

                // Load Recipes
                if let Some(list) = root_json.get("load_recipes").or_else(|| root_json.get("reloading_recipes")).and_then(|v| v.as_array()) {
                    for (idx, item) in list.iter().enumerate() {
                        let id_str = Self::get_id_str(item, idx + 1);
                        let caliber = item.get("caliber").and_then(|v| v.as_str());
                        let data = serde_json::to_string(item).unwrap_or_default();
                        let _ = r_tx.execute(
                            "INSERT OR REPLACE INTO load_recipes (id, caliber, data) VALUES (?1, ?2, ?3)",
                            params![id_str, caliber, data],
                        );
                    }
                }

                // Load Ladder Tests
                if let Some(list) = root_json.get("load_ladder_tests").and_then(|v| v.as_array()) {
                    for (idx, item) in list.iter().enumerate() {
                        let id_str = Self::get_id_str(item, idx + 1);
                        let data = serde_json::to_string(item).unwrap_or_default();
                        let _ = r_tx.execute(
                            "INSERT OR REPLACE INTO load_ladder_tests (id, data) VALUES (?1, ?2)",
                            params![id_str, data],
                        );
                    }
                }

                // Chrono Strings
                if let Some(list) = root_json.get("chrono_strings").and_then(|v| v.as_array()) {
                    for (idx, item) in list.iter().enumerate() {
                        let id_str = Self::get_id_str(item, idx + 1);
                        let data = serde_json::to_string(item).unwrap_or_default();
                        let _ = r_tx.execute(
                            "INSERT OR REPLACE INTO chrono_strings (id, data) VALUES (?1, ?2)",
                            params![id_str, data],
                        );
                    }
                }

                // Target Analyses
                if let Some(list) = root_json.get("target_analyses").and_then(|v| v.as_array()) {
                    for (idx, item) in list.iter().enumerate() {
                        let id_str = Self::get_id_str(item, idx + 1);
                        let data = serde_json::to_string(item).unwrap_or_default();
                        let _ = r_tx.execute(
                            "INSERT OR REPLACE INTO target_analyses (id, data) VALUES (?1, ?2)",
                            params![id_str, data],
                        );
                    }
                }

                let _ = r_tx.commit();
            }
        }

        // B. Ballistics Module Database: `module_data/ballistics.sqlite`
        if let Ok(mut b_conn) = ModuleDbManager::get_connection("ballistics") {
            if let Ok(b_tx) = b_conn.transaction() {
                if let Some(list) = root_json.get("ballistic_profiles").and_then(|v| v.as_array()) {
                    for (idx, item) in list.iter().enumerate() {
                        let id_str = Self::get_id_str(item, idx + 1);
                        let name = item.get("name").and_then(|v| v.as_str());
                        let caliber = item.get("caliber").and_then(|v| v.as_str());
                        let data = serde_json::to_string(item).unwrap_or_default();
                        let _ = b_tx.execute(
                            "INSERT OR REPLACE INTO ballistic_profiles (id, name, caliber, data) VALUES (?1, ?2, ?3, ?4)",
                            params![id_str, name, caliber, data],
                        );
                    }
                }
                let _ = b_tx.commit();
            }
        }

        // C. Maintenance Module Database: `module_data/maintenance.sqlite`
        if let Ok(m_conn) = ModuleDbManager::get_connection("maintenance") {
            if let Some(presets) = root_json.get("custom_schedule_presets") {
                let data = serde_json::to_string(presets).unwrap_or_default();
                let _ = m_conn.execute(
                    "INSERT OR REPLACE INTO custom_schedule_presets (id, data) VALUES ('default', ?1)",
                    params![data],
                );
            }
        }

        // D. Optics Module Database: `module_data/optics.sqlite`
        if let Ok(o_conn) = ModuleDbManager::get_connection("optics") {
            if let Some(list) = root_json.get("optics_vault_inventory").and_then(|v| v.as_array()) {
                for (idx, item) in list.iter().enumerate() {
                    let id_str = Self::get_id_str(item, idx + 1);
                    let sn = item.get("serial_number").and_then(|v| v.as_str());
                    let fid = item.get("firearm_id").and_then(|v| v.as_i64());
                    let data = serde_json::to_string(item).unwrap_or_default();
                    let _ = o_conn.execute(
                        "INSERT OR REPLACE INTO optics_inventory (id, serial_number, firearm_id, data) VALUES (?1, ?2, ?3, ?4)",
                        params![id_str, sn, fid, data],
                    );
                }
            }
        }

        Ok(())
    }

    /// Granular catch-up check executed on every vault unlock.
    /// If any core table or module database is missing records while the decrypted legacy JSON
    /// contains them, it safely and idempotently restores them without touching already populated tables.
    pub fn catch_up_missing_collections(conn: &mut Connection, root_json: &Value) -> Result<(), String> {
        // 1. Storage Locations catch-up
        let storage_count: i64 = conn.query_row("SELECT COUNT(*) FROM storage_locations", [], |r| r.get(0)).unwrap_or(0);
        if storage_count == 0 {
            if let Some(list) = root_json.get("storage_locations").and_then(|v| v.as_array()) {
                if !list.is_empty() {
                    for (idx, item) in list.iter().enumerate() {
                        let id_str = Self::get_id_str(item, idx + 1);
                        let name = item.get("name").and_then(|v| v.as_str()).unwrap_or("Storage Space");
                        let mut loc_clone = item.clone();
                        if let Some(obj) = loc_clone.as_object_mut() {
                            if let Ok(num) = id_str.parse::<i64>() {
                                obj.insert("id".to_string(), Value::Number(serde_json::Number::from(num)));
                            } else {
                                obj.insert("id".to_string(), Value::String(id_str.clone()));
                            }
                        }
                        let data = serde_json::to_string(&loc_clone).unwrap_or_default();
                        let _ = conn.execute(
                            "INSERT OR REPLACE INTO storage_locations (id, name, data) VALUES (?1, ?2, ?3)",
                            params![id_str, name, data],
                        );
                    }
                }
            }
        }

        // 2. Firearms catch-up
        let firearms_count: i64 = conn.query_row("SELECT COUNT(*) FROM firearms", [], |r| r.get(0)).unwrap_or(0);
        if firearms_count == 0 {
            let _ = Self::import_legacy_json(conn, root_json);
            return Ok(());
        }

        // 3. Module collections catch-up
        // Reloading components catch-up
        if let Ok(r_conn) = ModuleDbManager::get_connection("reloading") {
            let comp_count: i64 = r_conn.query_row("SELECT COUNT(*) FROM components", [], |r| r.get(0)).unwrap_or(0);
            if comp_count == 0 {
                let _ = Self::migrate_module_collections(root_json);
            }
        }

        // Ballistics catch-up
        if let Ok(b_conn) = ModuleDbManager::get_connection("ballistics") {
            let bal_count: i64 = b_conn.query_row("SELECT COUNT(*) FROM ballistic_profiles", [], |r| r.get(0)).unwrap_or(0);
            if bal_count == 0 {
                if let Some(list) = root_json.get("ballistic_profiles").and_then(|v| v.as_array()) {
                    for (idx, item) in list.iter().enumerate() {
                        let id_str = Self::get_id_str(item, idx + 1);
                        let name = item.get("name").and_then(|v| v.as_str());
                        let caliber = item.get("caliber").and_then(|v| v.as_str());
                        let data = serde_json::to_string(item).unwrap_or_default();
                        let _ = b_conn.execute(
                            "INSERT OR REPLACE INTO ballistic_profiles (id, name, caliber, data) VALUES (?1, ?2, ?3, ?4)",
                            params![id_str, name, caliber, data],
                        );
                    }
                }
            }
        }

        Ok(())
    }
}
