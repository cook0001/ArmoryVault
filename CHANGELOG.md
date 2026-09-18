# Changelog

All notable changes to the ArmoryVault native application are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- **Independent Per-Module SQLite Databases**: Decoupled the database layer so `armoryvault.sqlite` is strictly the Core database, and each module (`reloading`, `ballistics`, `maintenance`, `optics`, `boundbook`, `nfa`, `labels`, `ranges`) automatically saves to its own dedicated SQLite database file under `module_data/<module_id>.sqlite` with WAL mode and foreign reference cascade cleanup.
- **Storage Spaces Auto-Migration & Catch-Up**: Fixed legacy storage space ID parser in `db.rs` supporting both numeric integer IDs (`1, 2, 3`) and string UUIDs. Added `catch_up_missing_collections` so empty tables (like storage locations) are automatically repopulated from the decrypted vault on login.
- **3-Tier Resilient Report & Work Order Engine**: Implemented native `generate_work_order`, `generate_armory_binder`, `generate_bill_of_sale`, and `generate_insurance_report` commands with native macOS Save As dialog (`rfd::FileDialog`). Features 3-tier fallback architecture: Tier 1 (local Typst binary), Tier 2 (ArmsTrader ephemeral cloud bridge), Tier 3 (standalone offline printable HTML certificate).
- **Full ZIP Backup & Restore**: Implemented native `create_zip_backup` and `restore_backup` archiving `armoryvault.sqlite`, `module_data/*.sqlite`, `firearms_inventory.enc`, `config.json`, `photos/`, and `documents/`.
- **Full 8-Module Native Tauri Suite**: Fully integrated and verified all 8 official ArmoryVault modules (`reloading`, `maintenance`, `ballistics`, `nfa`, `boundbook`, `optics`, `ranges`, and `labels`) within the native Tauri build, registering their manifests, custom vector icons, and route hosts.
- **Native Rust SQLite KV Storage for Modules**: Added `get_config` and `set_config` native Rust commands backed by the SQLite `kv_meta` table, providing persistent and encrypted storage for module inventories (`optics_vault_inventory`), bookmarked ranges (`saved_ranges`), custom print templates (`saved_label_templates`), and user schedules.
- **Native Ballistics & Load Ladder CRUD**: Added native Rust persistence commands (`get_ballistic_profiles`, `save_ballistic_profile`, `delete_ballistic_profile`, `get_load_ladder_tests`, `save_load_ladder_test`, `delete_load_ladder_test`) with complete unit test coverage.
- **Transactional Handload Batch Manufacturing**: Implemented native Rust `manufacture_handload_batch` command that transactionally increments loaded ammunition stock, decrements powder/primers/brass/bullets, and logs an audit trail event in SQLite.
- **Hybrid Cloud & Fallback Directory Lookups**: Integrated `lookupRanges` and `lookupFFL` in `tauriBridge.ts` with direct ArmsTrader API querying and graceful offline fallback.
- **Native Rust SQLite Maintenance & Range Engine**: Implemented `complete_maintenance_task` (calculating cumulative rounds, updating scheduled task counters, and recording audit activity) and `log_range_session` (appending range logs, deducting ammo stock, updating accessory counters) directly in native Rust (`rusqlite`).
- **Batch Inventory Imports**: Added native transactional batch import commands (`import_firearms_batch`, `import_ammo_batch`, `import_accessories_batch`, `import_components_batch`) with conflict resolution.
- **Platform-Adaptive Technical Inspections**: Enhanced armorer inspection certificate generator with specialized military and civilian checks dynamically branching for Revolvers, Bolt Action Rifles, Lever Action Rifles, Shotguns, Modern Sporting Rifles, and Semi-Automatic Handguns.
- **Armorer Work Order & Inspection Certificate Export**: Built native HTML certificate generator (`workOrderExporter.ts`) connected to Tauri file dialogs and filesystem writers.
- **Master Armory Schedule Controls**: Added inline task creation form, task deletion with confirmation, and preset reset capabilities to `MasterScheduleTab`.
- **ThresholdSettingsModal**: Extracted modal component to `modals/ThresholdSettingsModal.tsx` following anti-monolith architectural standards.

### Changed
- **Sidebar Navigation Restructuring**: Renamed "Tools" to "Modules". Moved "Storage" to core "Vault" group alongside Dashboard, Ammunition, and Accessories. Installed modules (Maintenance, Bound Book, Ballistics, etc.) are neatly housed under "Modules" with a quick-add header button and empty-state discovery button.
- **Core Program Isolation**: Default installed modules set to empty array (`DEFAULT_INSTALLED_MODULES = []`) so optional modules are installed only on-demand by the end user via the Module Center.
- **Icon & UI Consistency**: Replaced raw `×` characters with vector `<X size={18} />` components across firearm details maintenance modals.
- **Linux CI Dependencies**: Fixed apt package list in `.github/workflows/build-all.yml` by removing conflicting `libappindicator3-dev` and invalid package references to ensure clean Ubuntu 22.04 runner builds.
- **Linux Native File Dialog Compatibility**: Configured both `tauri-plugin-dialog` and `rfd` with `default-features = false, features = ["xdg-portal"]` to eliminate feature collision between GTK3 and XDG Desktop Portals during Linux compilation.

## [2.11.0-beta.1] - 2026-09-15

### Added
- **Tauri v2 Native Architecture**: Rebuilt core desktop runtime with native Rust and system webview engines.
- **Embedded SQLite Engine (`rusqlite`)**: Native database replacing full JSON disk rewrites with indexed, transactional SQLite persistence (`armoryvault.sqlite`).
- **Legacy Vault Auto-Migration**: Automatic discovery of existing `firearms_inventory.enc` vaults and instant zero-touch migration of firearms, ammo, accessories, components, locations, and audit history.
- **Async LAN Sync Server**: Ultra-low-latency local HTTP server built on **Axum + Tokio** on port `5174` for mobile companion synchronization.
- **Native Media Protocol Handler**: Built `local-file://localhost/...` custom URI scheme handler with automated on-the-fly thumbnail generation using the pure-Rust `image` crate.
- **Cross-Platform GitHub Actions Matrix**: Automated multi-platform workflow (`.github/workflows/build-all.yml`) building macOS DMG, Windows NSIS/MSI, and Linux AppImage/DEB installers on every push.
- **Zustand State Store**: High-performance decoupled reactive state management (`vaultStore.ts`) optimizing component renders and view transitions.

### Changed
- **Package Size Reduction**: macOS DMG installer size slashed by ~95% from 180 MB to **8.7 MB**.
- **Memory Footprint**: Active runtime memory consumption reduced by ~75% down to **~71 MB RAM**.
- **Dual-Track Distribution**: Established `beta` branch dedicated to native Tauri v2 builds while `main` maintains the stable Electron track.
