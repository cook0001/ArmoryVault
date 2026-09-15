use rusqlite::{params, Connection, Result};
use serde_json::Value;

pub struct InventoryStore;

impl InventoryStore {
    // ─── Firearms ────────────────────────────────────────────────────────
    pub fn get_firearms(conn: &Connection) -> Result<Vec<Value>> {
        let mut stmt = conn.prepare("SELECT data FROM firearms ORDER BY id ASC")?;
        let rows = stmt.query_map([], |row| {
            let data_str: String = row.get(0)?;
            Ok(serde_json::from_str(&data_str).unwrap_or(Value::Null))
        })?;

        let mut list = Vec::new();
        for r in rows {
            if let Ok(val) = r {
                if !val.is_null() {
                    list.push(val);
                }
            }
        }
        Ok(list)
    }

    pub fn insert_firearm(conn: &Connection, mut firearm: Value) -> Result<i64> {
        let next_id = match firearm.get("id").and_then(|v| v.as_i64()) {
            Some(id) if id > 0 => id,
            _ => {
                let max_id: Option<i64> = conn.query_row("SELECT MAX(id) FROM firearms", [], |r| r.get(0)).unwrap_or(None);
                max_id.unwrap_or(0) + 1
            }
        };

        if let Some(obj) = firearm.as_object_mut() {
            obj.insert("id".to_string(), Value::Number(next_id.into()));
        }

        let make = firearm.get("make").and_then(|v| v.as_str());
        let model = firearm.get("model").and_then(|v| v.as_str());
        let serial = firearm.get("serial_number").and_then(|v| v.as_str());
        let caliber = firearm.get("caliber").and_then(|v| v.as_str());
        let data_str = serde_json::to_string(&firearm).unwrap_or_default();

        conn.execute(
            "INSERT INTO firearms (id, make, model, serial_number, caliber, data)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![next_id, make, model, serial, caliber, data_str],
        )?;

        Ok(next_id)
    }

    pub fn update_firearm(conn: &Connection, id: i64, firearm: Value) -> Result<i64> {
        let make = firearm.get("make").and_then(|v| v.as_str());
        let model = firearm.get("model").and_then(|v| v.as_str());
        let serial = firearm.get("serial_number").and_then(|v| v.as_str());
        let caliber = firearm.get("caliber").and_then(|v| v.as_str());
        let data_str = serde_json::to_string(&firearm).unwrap_or_default();

        conn.execute(
            "UPDATE firearms SET make = ?2, model = ?3, serial_number = ?4, caliber = ?5, data = ?6
             WHERE id = ?1",
            params![id, make, model, serial, caliber, data_str],
        )?;

        Ok(id)
    }

    pub fn delete_firearm(conn: &Connection, id: i64) -> Result<i64> {
        conn.execute("DELETE FROM firearms WHERE id = ?1", params![id])?;
        Ok(id)
    }

    // ─── Ammunition ──────────────────────────────────────────────────────
    pub fn get_ammo(conn: &Connection) -> Result<Vec<Value>> {
        let mut stmt = conn.prepare("SELECT data FROM ammo ORDER BY id ASC")?;
        let rows = stmt.query_map([], |row| {
            let data_str: String = row.get(0)?;
            Ok(serde_json::from_str(&data_str).unwrap_or(Value::Null))
        })?;

        let mut list = Vec::new();
        for r in rows {
            if let Ok(val) = r {
                if !val.is_null() {
                    list.push(val);
                }
            }
        }
        Ok(list)
    }

    pub fn insert_ammo(conn: &Connection, mut ammo: Value) -> Result<i64> {
        let next_id = match ammo.get("id").and_then(|v| v.as_i64()) {
            Some(id) if id > 0 => id,
            _ => {
                let max_id: Option<i64> = conn.query_row("SELECT MAX(id) FROM ammo", [], |r| r.get(0)).unwrap_or(None);
                max_id.unwrap_or(0) + 1
            }
        };

        if let Some(obj) = ammo.as_object_mut() {
            obj.insert("id".to_string(), Value::Number(next_id.into()));
        }

        let caliber = ammo.get("caliber").and_then(|v| v.as_str());
        let brand = ammo.get("brand").and_then(|v| v.as_str());
        let b_type = ammo.get("bulletType").and_then(|v| v.as_str());
        let data_str = serde_json::to_string(&ammo).unwrap_or_default();

        conn.execute(
            "INSERT INTO ammo (id, caliber, brand, bullet_type, data)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![next_id, caliber, brand, b_type, data_str],
        )?;

        Ok(next_id)
    }

    pub fn update_ammo(conn: &Connection, id: i64, ammo: Value) -> Result<i64> {
        let caliber = ammo.get("caliber").and_then(|v| v.as_str());
        let brand = ammo.get("brand").and_then(|v| v.as_str());
        let b_type = ammo.get("bulletType").and_then(|v| v.as_str());
        let data_str = serde_json::to_string(&ammo).unwrap_or_default();

        conn.execute(
            "UPDATE ammo SET caliber = ?2, brand = ?3, bullet_type = ?4, data = ?5
             WHERE id = ?1",
            params![id, caliber, brand, b_type, data_str],
        )?;

        Ok(id)
    }

    pub fn delete_ammo(conn: &Connection, id: i64) -> Result<i64> {
        conn.execute("DELETE FROM ammo WHERE id = ?1", params![id])?;
        Ok(id)
    }

    // ─── Accessories ─────────────────────────────────────────────────────
    pub fn get_accessories(conn: &Connection) -> Result<Vec<Value>> {
        let mut stmt = conn.prepare("SELECT data FROM accessories ORDER BY id ASC")?;
        let rows = stmt.query_map([], |row| {
            let data_str: String = row.get(0)?;
            Ok(serde_json::from_str(&data_str).unwrap_or(Value::Null))
        })?;

        let mut list = Vec::new();
        for r in rows {
            if let Ok(val) = r {
                if !val.is_null() {
                    list.push(val);
                }
            }
        }
        Ok(list)
    }

    pub fn insert_accessory(conn: &Connection, mut acc: Value) -> Result<i64> {
        let next_id = match acc.get("id").and_then(|v| v.as_i64()) {
            Some(id) if id > 0 => id,
            _ => {
                let max_id: Option<i64> = conn.query_row("SELECT MAX(id) FROM accessories", [], |r| r.get(0)).unwrap_or(None);
                max_id.unwrap_or(0) + 1
            }
        };

        if let Some(obj) = acc.as_object_mut() {
            obj.insert("id".to_string(), Value::Number(next_id.into()));
        }

        let name = acc.get("name").and_then(|v| v.as_str());
        let cat = acc.get("category").and_then(|v| v.as_str());
        let data_str = serde_json::to_string(&acc).unwrap_or_default();

        conn.execute(
            "INSERT INTO accessories (id, name, category, data)
             VALUES (?1, ?2, ?3, ?4)",
            params![next_id, name, cat, data_str],
        )?;

        Ok(next_id)
    }

    pub fn update_accessory(conn: &Connection, id: i64, acc: Value) -> Result<i64> {
        let name = acc.get("name").and_then(|v| v.as_str());
        let cat = acc.get("category").and_then(|v| v.as_str());
        let data_str = serde_json::to_string(&acc).unwrap_or_default();

        conn.execute(
            "UPDATE accessories SET name = ?2, category = ?3, data = ?4
             WHERE id = ?1",
            params![id, name, cat, data_str],
        )?;

        Ok(id)
    }

    pub fn delete_accessory(conn: &Connection, id: i64) -> Result<i64> {
        conn.execute("DELETE FROM accessories WHERE id = ?1", params![id])?;
        Ok(id)
    }

    // ─── Components ──────────────────────────────────────────────────────
    pub fn get_components(conn: &Connection) -> Result<Vec<Value>> {
        let mut stmt = conn.prepare("SELECT data FROM components ORDER BY id ASC")?;
        let rows = stmt.query_map([], |row| {
            let data_str: String = row.get(0)?;
            Ok(serde_json::from_str(&data_str).unwrap_or(Value::Null))
        })?;

        let mut list = Vec::new();
        for r in rows {
            if let Ok(val) = r {
                if !val.is_null() {
                    list.push(val);
                }
            }
        }
        Ok(list)
    }

    pub fn insert_component(conn: &Connection, mut comp: Value) -> Result<i64> {
        let next_id = match comp.get("id").and_then(|v| v.as_i64()) {
            Some(id) if id > 0 => id,
            _ => {
                let max_id: Option<i64> = conn.query_row("SELECT MAX(id) FROM components", [], |r| r.get(0)).unwrap_or(None);
                max_id.unwrap_or(0) + 1
            }
        };

        if let Some(obj) = comp.as_object_mut() {
            obj.insert("id".to_string(), Value::Number(next_id.into()));
        }

        let c_type = comp.get("type").and_then(|v| v.as_str());
        let caliber = comp.get("caliber").and_then(|v| v.as_str());
        let data_str = serde_json::to_string(&comp).unwrap_or_default();

        conn.execute(
            "INSERT INTO components (id, type, caliber, data)
             VALUES (?1, ?2, ?3, ?4)",
            params![next_id, c_type, caliber, data_str],
        )?;

        Ok(next_id)
    }

    pub fn update_component(conn: &Connection, id: i64, comp: Value) -> Result<i64> {
        let c_type = comp.get("type").and_then(|v| v.as_str());
        let caliber = comp.get("caliber").and_then(|v| v.as_str());
        let data_str = serde_json::to_string(&comp).unwrap_or_default();

        conn.execute(
            "UPDATE components SET type = ?2, caliber = ?3, data = ?4
             WHERE id = ?1",
            params![id, c_type, caliber, data_str],
        )?;

        Ok(id)
    }

    pub fn delete_component(conn: &Connection, id: i64) -> Result<i64> {
        conn.execute("DELETE FROM components WHERE id = ?1", params![id])?;
        Ok(id)
    }

    // ─── Custom SKUs ─────────────────────────────────────────────────────
    pub fn get_skus(conn: &Connection) -> Result<serde_json::Map<String, Value>> {
        let mut stmt = conn.prepare("SELECT id, data FROM skus")?;
        let rows = stmt.query_map([], |row| {
            let id: String = row.get(0)?;
            let data_str: String = row.get(1)?;
            Ok((id, serde_json::from_str(&data_str).unwrap_or(Value::Null)))
        })?;

        let mut map = serde_json::Map::new();
        for r in rows {
            if let Ok((id, val)) = r {
                map.insert(id, val);
            }
        }
        Ok(map)
    }

    pub fn save_skus(conn: &Connection, skus: serde_json::Map<String, Value>) -> Result<bool> {
        let tx = conn.unchecked_transaction()?;
        for (id, val) in skus {
            let data_str = serde_json::to_string(&val).unwrap_or_default();
            tx.execute("INSERT OR REPLACE INTO skus (id, data) VALUES (?1, ?2)", params![id, data_str])?;
        }
        tx.commit()?;
        Ok(true)
    }

    pub fn delete_sku(conn: &Connection, sku_id: &str) -> Result<String> {
        conn.execute("DELETE FROM skus WHERE id = ?1", params![sku_id])?;
        Ok(sku_id.to_string())
    }

    // ─── Storage Locations ───────────────────────────────────────────────
    pub fn get_storage_locations(conn: &Connection) -> Result<Vec<Value>> {
        let mut stmt = conn.prepare("SELECT data FROM storage_locations ORDER BY name ASC")?;
        let rows = stmt.query_map([], |row| {
            let data_str: String = row.get(0)?;
            Ok(serde_json::from_str(&data_str).unwrap_or(Value::Null))
        })?;

        let mut list = Vec::new();
        for r in rows {
            if let Ok(val) = r {
                if !val.is_null() {
                    list.push(val);
                }
            }
        }
        Ok(list)
    }

    pub fn save_storage_location(conn: &Connection, loc: Value) -> Result<Value> {
        let id = loc.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let name = loc.get("name").and_then(|v| v.as_str());
        let data_str = serde_json::to_string(&loc).unwrap_or_default();

        conn.execute(
            "INSERT OR REPLACE INTO storage_locations (id, name, data) VALUES (?1, ?2, ?3)",
            params![id, name, data_str],
        )?;

        Ok(loc)
    }

    pub fn delete_storage_location(conn: &Connection, id: &str) -> Result<String> {
        conn.execute("DELETE FROM storage_locations WHERE id = ?1", params![id])?;
        Ok(id.to_string())
    }

    // ─── Activity Audit Log ──────────────────────────────────────────────
    pub fn get_activity_log(conn: &Connection) -> Result<Vec<Value>> {
        let mut stmt = conn.prepare("SELECT data FROM activity_log ORDER BY id DESC LIMIT 500")?;
        let rows = stmt.query_map([], |row| {
            let data_str: String = row.get(0)?;
            Ok(serde_json::from_str(&data_str).unwrap_or(Value::Null))
        })?;

        let mut list = Vec::new();
        for r in rows {
            if let Ok(val) = r {
                if !val.is_null() {
                    list.push(val);
                }
            }
        }
        Ok(list)
    }

    pub fn insert_activity_log(conn: &Connection, log: Value) -> Result<i64> {
        let ts = log.get("timestamp").and_then(|v| v.as_str());
        let action = log.get("action").and_then(|v| v.as_str());
        let data_str = serde_json::to_string(&log).unwrap_or_default();

        conn.execute(
            "INSERT INTO activity_log (timestamp, action, data) VALUES (?1, ?2, ?3)",
            params![ts, action, data_str],
        )?;

        Ok(conn.last_insert_rowid())
    }
}
