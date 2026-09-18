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
            change_password,
            regenerate_recovery_key,
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
            update_storage_location,
            delete_storage_location,
            get_sync_queue,
            remove_sync_item,
            clear_sync_queue,
            get_chrono_strings,
            add_chrono_string,
            delete_chrono_string,
            get_target_analyses,
            add_target_analysis,
            delete_target_analysis,
            get_activity_log,
            get_local_ip,
            get_all_local_ips,
            save_base64_photo,
            save_base64_document,
            save_photo,
            save_document,
            get_backup_folder,
            select_backup_folder,
            create_zip_backup,
            restore_backup,
            select_and_save_photo,
            select_and_save_document,
            select_csv_file,
            save_qr_image,
            open_external_file,
            open_url,
            read_file_base64,
            read_file_buffer,
            generate_work_order,
            generate_armory_binder,
            generate_bill_of_sale,
            generate_insurance_report,
            complete_maintenance_task,
            log_range_session,
            import_firearms_batch,
            import_ammo_batch,
            import_accessories_batch,
            import_components_batch,
            get_config,
            set_config,
            get_module_data,
            set_module_data,
            get_ballistic_profiles,
            add_ballistic_profile,
            update_ballistic_profile,
            delete_ballistic_profile,
            get_load_ladder_tests,
            add_load_ladder_test,
            update_load_ladder_test,
            delete_load_ladder_test,
            manufacture_handload_batch
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
