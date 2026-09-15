# Changelog

All notable changes to the ArmoryVault native application are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
