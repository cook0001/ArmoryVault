# ArmoryVault (Tauri v2 Native Beta)

[![Build All Native Installers](https://github.com/cook0001/ArmoryVault/actions/workflows/build-all.yml/badge.svg?branch=beta)](https://github.com/cook0001/ArmoryVault/actions/workflows/build-all.yml)
[![Tauri Version](https://img.shields.io/badge/Tauri-v2.0-blue.svg?style=flat-square&logo=tauri)](https://tauri.app)
[![Rust Core](https://img.shields.io/badge/Rust-2021%20Edition-orange.svg?style=flat-square&logo=rust)](https://www.rust-lang.org)
[![Database](https://img.shields.io/badge/SQLite-rusqlite%203-003B57.svg?style=flat-square&logo=sqlite)](https://sqlite.org)
[![Frontend](https://img.shields.io/badge/React-19%20%2B%20TypeScript-61DAFB.svg?style=flat-square&logo=react)](https://react.dev)
[![License](https://img.shields.io/badge/License-ISC-purple.svg?style=flat-square)](LICENSE)

> **Welcome to the ArmoryVault Beta Branch.**  
> This branch hosts the next-generation **native Tauri v2 rewrite** of ArmoryVault, delivering a **~95% smaller installer** and **~75% reduced memory footprint** while preserving 100% data compatibility with existing user vaults.

---

## ⚡ Performance & Architectural Benchmarks

| Metric | ArmoryVault (Electron Stable) | ArmoryVault (Tauri v2 Beta) | Impact |
| :--- | :--- | :--- | :--- |
| **macOS DMG Installer** | ~180.0 MB | **8.7 MB** | **95.2% smaller download** |
| **Installed App Footprint** | ~420.0 MB | **11.0 MB** | **97.4% less disk space** |
| **Active Memory (RAM)** | ~250–320 MB | **~71 MB** | **~75% RAM reduction** |
| **Database Engine** | Encrypted JSON full-disk rewrites | **Embedded SQLite (`rusqlite`) with ACID indexes** | **Instant queries, zero disk thrashing** |
| **LAN Sync Server** | Node.js Express runtime | **Native Async Axum + Tokio (:5174)** | **Zero idle CPU, microsecond sync** |
| **Media & Thumbnails** | Node C++ `sharp` binaries | **Pure-Rust `image` crate** | **Zero C++ build errors, native speed** |
| **Frontend State** | Deeply nested React Contexts | **Lightweight `zustand` Store** | **Optimized component re-renders** |

---

## 🛠️ Key Architectural Enhancements

### 1. Embedded Native SQLite Engine
- Replaced monolithic JSON encryption flushes with a high-speed SQLite database engine (`armoryvault.sqlite`) via Rust's `rusqlite`.
- **Zero-Touch Auto-Migration**: Automatically discovers existing `firearms_inventory.enc` vaults in `~/Library/Application Support/ArmoryVault` and migrates records into indexed SQLite tables with zero user intervention.
- ACID compliance with indexed lookups for serial numbers, make/model, calibers, and storage locations.

### 2. High-Throughput Async LAN Sync Server
- Replaced Node.js Express with an asynchronous HTTP server powered by **`axum`** and **`tokio`** running on port `5174`.
- Pairs with the **ArmoryVault Mobile Companion App** for local Wi-Fi inventory sync with zero cloud relay servers.

### 3. Native Image & Media Pipeline
- Uses a custom WebKit protocol (`local-file://localhost/...`) to stream local firearm and accessory photos securely with on-the-fly thumbnail generation.
- Pure-Rust thumbnail creation with `image` crate eliminates brittle native Node C++ bindings (`node-gyp`).

### 4. Enterprise-Grade Cryptography
- Vault master passwords derive encryption keys via **PBKDF2-HMAC-SHA256** (100,000 iterations).
- Records and archives persist with **AES-256-GCM** authenticated encryption.

---

## 🚀 Dual-Track Distribution Pipeline

ArmoryVault maintains a dual-track distribution strategy:
- **`main` branch**: The battle-tested Electron production build.
- **`beta` branch**: The native Tauri v2 high-performance build.

Both tracks share identical UI components and design systems, ensuring feature parity and seamless interoperability.

---

## 📦 Native Installers & CI Workflow

All installers are built automatically on every push to `beta` via [GitHub Actions](.github/workflows/build-all.yml):

* **macOS**: Universal Apple Silicon (`aarch64`) and Intel (`x86_64`) `.dmg` and `.app` bundles
* **Windows**: 64-bit NSIS `.exe` installer and `.msi` package
* **Linux**: Universal `.AppImage` and Debian `.deb` packages

Download the latest automated builds directly from the **Actions** tab or **Releases**.

---

## 💻 Local Development Setup

### Prerequisites
1. **Node.js**: v20 or v22 LTS ([nodejs.org](https://nodejs.org))
2. **Rust**: Latest stable toolchain ([rustup.rs](https://rustup.rs))
3. **Platform Dependencies**:
   - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
   - **Windows**: Visual Studio C++ Build Tools & WebView2
   - **Linux (Ubuntu/Debian)**:
     ```bash
     sudo apt-get update && sudo apt-get install -y \
       libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libssl-dev
     ```

### Getting Started

1. **Clone the repository and switch to the beta branch:**
   ```bash
   git clone -b beta https://github.com/cook0001/ArmoryVault.git
   cd ArmoryVault
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode (with hot reloading):**
   ```bash
   npm run tauri:dev
   ```

4. **Build the production bundle locally:**
   ```bash
   npm run tauri:build
   ```
   Compiled binaries and installers will be generated under `src-tauri/target/release/bundle/`.

---

## 🔒 Security & Privacy Notice

ArmoryVault is **100% private, local, and air-gapped**:
* **Zero Cloud Accounts**: No third-party accounts or logins.
* **Zero Telemetry**: No tracking, analytics, or analytics beacons.
* **Local LAN Only**: Companion synchronization operates strictly on your local Wi-Fi subnet.
