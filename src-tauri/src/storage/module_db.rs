use super::paths::AppPaths;
use rusqlite::{params, Connection, Result as SqlResult};
use serde_json::Value;

/// Manages dedicated per-module SQLite databases in `userData/module_data/<module_id>.sqlite`.
///
/// Keeps core `armoryvault.sqlite` decoupled and lightweight while giving extension modules
/// (reloading, ballistics, maintenance, optics, boundbook, nfa, labels, ranges) their own
/// ACID-compliant, WAL-enabled storage files that mount automatically when loaded.
pub struct ModuleDbManager;

impl ModuleDbManager {
    /// Opens and prepares an isolated SQLite database connection for the given module ID.
    /// Automatically enables WAL mode and initializes module-specific tables.
    pub fn get_connection(module_id: &str) -> Result<Connection, String> {
        let db_path = AppPaths::get_module_sqlite_path(module_id);
        let conn = Connection::open(&db_path).map_err(|e| format!("Failed to open module DB '{}': {}", module_id, e))?;

        // 1. Concurrency & Performance Hardening: WAL Mode
        conn.execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;
             PRAGMA busy_timeout = 5000;
             PRAGMA foreign_keys = ON;"
        ).map_err(|e| format!("WAL setup error on module '{}': {}", module_id, e))?;

        // 2. Initialize Module-Specific Tables
        Self::init_module_schema(&conn, module_id)
            .map_err(|e| format!("Schema init error on module '{}': {}", module_id, e))?;

        Ok(conn)
    }

    /// Initializes tables specific to each module domain
    fn init_module_schema(conn: &Connection, module_id: &str) -> SqlResult<()> {
        match module_id {
            "reloading" => {
                conn.execute_batch(
                    "CREATE TABLE IF NOT EXISTS components (
                        id INTEGER PRIMARY KEY,
                        type TEXT,
                        caliber TEXT,
                        data TEXT NOT NULL
                    );
                    CREATE TABLE IF NOT EXISTS load_recipes (
                        id TEXT PRIMARY KEY,
                        caliber TEXT,
                        data TEXT NOT NULL
                    );
                    CREATE TABLE IF NOT EXISTS load_ladder_tests (
                        id TEXT PRIMARY KEY,
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
                    CREATE TABLE IF NOT EXISTS module_kv (
                        key TEXT PRIMARY KEY,
                        value TEXT NOT NULL
                    );"
                )?;
            }
            "ballistics" => {
                conn.execute_batch(
                    "CREATE TABLE IF NOT EXISTS ballistic_profiles (
                        id TEXT PRIMARY KEY,
                        name TEXT,
                        caliber TEXT,
                        data TEXT NOT NULL
                    );
                    CREATE TABLE IF NOT EXISTS module_kv (
                        key TEXT PRIMARY KEY,
                        value TEXT NOT NULL
                    );"
                )?;
            }
            "maintenance" => {
                conn.execute_batch(
                    "CREATE TABLE IF NOT EXISTS custom_schedule_presets (
                        id TEXT PRIMARY KEY,
                        data TEXT NOT NULL
                    );
                    CREATE TABLE IF NOT EXISTS service_logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        firearm_id INTEGER,
                        task_id TEXT,
                        data TEXT NOT NULL
                    );
                    CREATE TABLE IF NOT EXISTS module_kv (
                        key TEXT PRIMARY KEY,
                        value TEXT NOT NULL
                    );"
                )?;
            }
            "optics" => {
                conn.execute_batch(
                    "CREATE TABLE IF NOT EXISTS optics_inventory (
                        id TEXT PRIMARY KEY,
                        serial_number TEXT,
                        firearm_id INTEGER,
                        data TEXT NOT NULL
                    );
                    CREATE TABLE IF NOT EXISTS module_kv (
                        key TEXT PRIMARY KEY,
                        value TEXT NOT NULL
                    );"
                )?;
            }
            "boundbook" => {
                conn.execute_batch(
                    "CREATE TABLE IF NOT EXISTS bound_book_entries (
                        id TEXT PRIMARY KEY,
                        date TEXT,
                        type TEXT,
                        data TEXT NOT NULL
                    );
                    CREATE TABLE IF NOT EXISTS module_kv (
                        key TEXT PRIMARY KEY,
                        value TEXT NOT NULL
                    );"
                )?;
            }
            "nfa" => {
                conn.execute_batch(
                    "CREATE TABLE IF NOT EXISTS nfa_items (
                        id TEXT PRIMARY KEY,
                        form_type TEXT,
                        serial_number TEXT,
                        data TEXT NOT NULL
                    );
                    CREATE TABLE IF NOT EXISTS module_kv (
                        key TEXT PRIMARY KEY,
                        value TEXT NOT NULL
                    );"
                )?;
            }
            "labels" => {
                conn.execute_batch(
                    "CREATE TABLE IF NOT EXISTS saved_label_templates (
                        id TEXT PRIMARY KEY,
                        name TEXT,
                        data TEXT NOT NULL
                    );
                    CREATE TABLE IF NOT EXISTS module_kv (
                        key TEXT PRIMARY KEY,
                        value TEXT NOT NULL
                    );"
                )?;
            }
            "ranges" => {
                conn.execute_batch(
                    "CREATE TABLE IF NOT EXISTS saved_ranges (
                        id TEXT PRIMARY KEY,
                        name TEXT,
                        state TEXT,
                        data TEXT NOT NULL
                    );
                    CREATE TABLE IF NOT EXISTS module_kv (
                        key TEXT PRIMARY KEY,
                        value TEXT NOT NULL
                    );"
                )?;
            }
            _ => {
                // Fallback KV table for any dynamically loaded or third-party extension module
                conn.execute_batch(
                    "CREATE TABLE IF NOT EXISTS module_kv (
                        key TEXT PRIMARY KEY,
                        value TEXT NOT NULL
                    );"
                )?;
            }
        }
        Ok(())
    }

    /// Reads arbitrary key-value data stored in a module's dedicated database
    pub fn get_module_kv(module_id: &str, key: &str) -> Result<Option<Value>, String> {
        let conn = Self::get_connection(module_id)?;
        let mut stmt = conn
            .prepare("SELECT value FROM module_kv WHERE key = ?1")
            .map_err(|e| e.to_string())?;

        let mut rows = stmt.query(params![key]).map_err(|e| e.to_string())?;
        if let Some(row) = rows.next().map_err(|e| e.to_string())? {
            let val_str: String = row.get(0).map_err(|e| e.to_string())?;
            let val = serde_json::from_str(&val_str).unwrap_or(Value::Null);
            Ok(Some(val))
        } else {
            Ok(None)
        }
    }

    /// Writes arbitrary key-value data stored in a module's dedicated database
    pub fn set_module_kv(module_id: &str, key: &str, value: &Value) -> Result<(), String> {
        let conn = Self::get_connection(module_id)?;
        let val_str = serde_json::to_string(value).unwrap_or_default();
        conn.execute(
            "INSERT OR REPLACE INTO module_kv (key, value) VALUES (?1, ?2)",
            params![key, val_str],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    /// Dispatches a cross-database foreign reference cleanup when a firearm is deleted in core
    pub fn cleanup_firearm_references(firearm_id: i64) {
        // 1. Maintenance service logs
        if let Ok(conn) = Self::get_connection("maintenance") {
            let _ = conn.execute("DELETE FROM service_logs WHERE firearm_id = ?1", params![firearm_id]);
        }

        // 2. Optics mounted associations
        if let Ok(conn) = Self::get_connection("optics") {
            let _ = conn.execute("UPDATE optics_inventory SET firearm_id = NULL WHERE firearm_id = ?1", params![firearm_id]);
        }
    }

    /// Returns a list of all existing module databases on disk
    pub fn list_existing_module_dbs() -> Vec<String> {
        let dir = AppPaths::get_module_data_dir();
        let mut list = Vec::new();
        if let Ok(entries) = std::fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|ext| ext.to_str()) == Some("sqlite") {
                    if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                        list.push(stem.to_string());
                    }
                }
            }
        }
        list
    }
}
