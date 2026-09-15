use axum::{
    extract::{Json, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use serde::Deserialize;
use serde_json::{json, Value};
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use tower_http::cors::{Any, CorsLayer};

#[derive(Clone)]
pub struct ServerState {
    pub pairing_token: Arc<Mutex<String>>,
    pub local_ip: String,
}

pub struct CompanionServer;

impl CompanionServer {
    pub async fn run() {
        let local_ip = local_ip_address::local_ip()
                .map(|ip| ip.to_string())
                .unwrap_or_else(|_| "127.0.0.1".to_string());

            let state = ServerState {
                pairing_token: Arc::new(Mutex::new(String::new())),
                local_ip,
            };

            let cors = CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any);

            let app = Router::new()
                .route("/api/ping", get(handle_ping))
                .route("/api/pair", post(handle_pair))
                .route("/api/inventory/summary", get(handle_summary))
                .route("/api/sync", post(handle_sync))
                .layer(cors)
                .with_state(state);

            let addr = SocketAddr::from(([0, 0, 0, 0], 5174));
            println!("[CompanionServer] Listening on http://{}", addr);

            if let Ok(listener) = tokio::net::TcpListener::bind(addr).await {
                let _ = axum::serve(listener, app).await;
            }
    }
}

async fn handle_ping() -> impl IntoResponse {
    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "app": "ArmoryVault",
            "version": "2.11.0",
            "backend": "Tauri-Axum"
        })),
    )
}

#[derive(Deserialize)]
struct PairRequest {
    token: Option<String>,
    device_name: Option<String>,
}

async fn handle_pair(
    State(state): State<ServerState>,
    Json(payload): Json<PairRequest>,
) -> impl IntoResponse {
    let mut current_token = state.pairing_token.lock().unwrap();
    if current_token.is_empty() {
        *current_token = hex::encode(rand::random::<[u8; 16]>());
    }

    if let Some(token) = payload.token {
        if token == *current_token {
            return (
                StatusCode::OK,
                Json(json!({
                    "status": "paired",
                    "device": payload.device_name.unwrap_or_else(|| "Companion".to_string()),
                    "token": *current_token
                })),
            );
        }
    }

    (
        StatusCode::OK,
        Json(json!({
            "status": "pending_approval",
            "device": payload.device_name.unwrap_or_else(|| "Companion".to_string())
        })),
    )
}

async fn handle_summary() -> impl IntoResponse {
    let sqlite_path = crate::storage::AppPaths::get_sqlite_path();
    if let Ok(conn) = rusqlite::Connection::open(sqlite_path) {
        let firearms_count: i64 = conn.query_row("SELECT COUNT(*) FROM firearms", [], |r| r.get(0)).unwrap_or(0);
        let ammo_count: i64 = conn.query_row("SELECT COUNT(*) FROM ammo", [], |r| r.get(0)).unwrap_or(0);
        let acc_count: i64 = conn.query_row("SELECT COUNT(*) FROM accessories", [], |r| r.get(0)).unwrap_or(0);

        (
            StatusCode::OK,
            Json(json!({
                "firearms": firearms_count,
                "ammo": ammo_count,
                "accessories": acc_count
            })),
        )
    } else {
        (
            StatusCode::OK,
            Json(json!({ "firearms": 0, "ammo": 0, "accessories": 0 })),
        )
    }
}

async fn handle_sync(Json(payload): Json<Value>) -> impl IntoResponse {
    let sqlite_path = crate::storage::AppPaths::get_sqlite_path();
    if let Ok(conn) = rusqlite::Connection::open(sqlite_path) {
        let id = hex::encode(rand::random::<[u8; 8]>());
        let payload_str = serde_json::to_string(&payload).unwrap_or_default();
        let now = chrono_timestamp();

        let _ = conn.execute(
            "INSERT INTO sync_queue (id, payload, created_at) VALUES (?1, ?2, ?3)",
            rusqlite::params![id, payload_str, now],
        );
    }

    (
        StatusCode::OK,
        Json(json!({ "success": true, "message": "Synced to inbox queue" })),
    )
}

fn chrono_timestamp() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}
