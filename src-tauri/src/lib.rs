pub mod commands;
pub mod crypto;
pub mod server;
pub mod storage;

use commands::*;
use crypto::VaultCrypto;
use storage::AppPaths;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Prepare state with vault crypto pointing to discovered data directory
    let enc_path = AppPaths::get_legacy_enc_path();
    let initial_state = AppState {
        vault: Mutex::new(VaultCrypto::new(enc_path)),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .register_uri_scheme_protocol("local-file", |_ctx, req| {
            storage::LocalFileProtocol::handle_request(req)
        })
        .manage(initial_state)
        .setup(|_app| {
            // Start background LAN sync server on port 5174 for Companion App
            tauri::async_runtime::spawn(async move {
                server::CompanionServer::run().await;
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            is_vault_setup,
            is_vault_locked,
            setup_vault,
            unlock_vault,
            unlock_with_recovery_code,
            lock_vault,
            get_recovery_code,
            get_firearms,
            add_firearm,
            update_firearm,
            delete_firearm,
            get_ammo,
            add_ammo,
            update_ammo,
            delete_ammo,
            get_accessories,
            add_accessory,
            update_accessory,
            delete_accessory,
            get_components,
            add_component,
            update_component,
            delete_component,
            get_skus,
            save_skus,
            delete_sku,
            get_storage_locations,
            add_storage_location,
            delete_storage_location,
            get_activity_log,
            get_local_ip,
            get_all_local_ips,
            save_base64_photo,
            save_base64_document
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
