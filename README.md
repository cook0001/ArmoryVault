# ArmoryVault

[![CI](https://github.com/cook0001/ArmoryVault/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/cook0001/ArmoryVault/actions/workflows/ci.yml)
[![Website](https://img.shields.io/badge/Website-cook0001.github.io%2FArmoryVault-blue?style=flat-square&logo=github)](https://cook0001.github.io/ArmoryVault/)
[![Docs](https://img.shields.io/badge/Docs-User%20Guide%20%26%20Wiki-00d2ff?style=flat-square)](https://cook0001.github.io/ArmoryVault/#docs)
[![Modules](https://img.shields.io/badge/Modules%20Hub-cook0001.github.io%2FArmoryVault--Modules-818cf8?style=flat-square)](https://cook0001.github.io/ArmoryVault-Modules/)
[![Release](https://img.shields.io/github/v/release/cook0001/ArmoryVault?style=flat-square&color=emerald)](https://github.com/cook0001/ArmoryVault/releases/latest)
[![License](https://img.shields.io/badge/License-ISC-purple?style=flat-square)](LICENSE)

> **Live Website & Download Portal**: [https://cook0001.github.io/ArmoryVault/](https://cook0001.github.io/ArmoryVault/)  
> **Modules Registry Hub**: [https://cook0001.github.io/ArmoryVault-Modules/](https://cook0001.github.io/ArmoryVault-Modules/)  
> **Official User Guide & Knowledge Base**: [https://cook0001.github.io/ArmoryVault/#docs](https://cook0001.github.io/ArmoryVault/#docs)

A secure, premium, cross-platform desktop application designed for serious firearms owners, collectors, and reloaders. ArmoryVault provides local inventory tracking, maintenance schedules, ballistics calculations, and printable ATF "Bound Book" ledgers wrapped in a modern dark Glassmorphism interface.

## Key Features

- **Tactical UI Customization & Personalization Suite**: 7 military/tactical theme presets (Tactical Blue, OD Green, Flat Dark Earth, Night Vision Crimson, Stealth Gunmetal, Desert Sand, Cyber Violet) + custom hex/RGB picker, 4 OLED pure black and ambient canvas styles, UI density & corner geometry modes, font scaling, and a 1-click Discretion Privacy Shield masking serial numbers and valuations.
- **Universal CSV Import & Migration Engine**: RFC 4180 compliant CSV/TSV streaming parser with intelligent synonym detection migrating seamlessly from GunSafe, GunLog / GunLogPro, MyGunDB, Gun Tracker, ATF Bound Book exports, and spreadsheets with live column mapping and validation.
- **Dedicated Encrypted Databases & Zero-Bloat Storage**: Decoupled high-churn audit history (`activity_log.enc`) and custom barcode dictionaries (`skus_database.enc`) into dedicated AES-256-GCM encrypted stores with atomic flushing, shrinking primary vault size and preventing database bloat.
- **High-Performance Client Caching & Anti-Monolith Architecture**: Centralized reactive state hydration via `VaultDataContext` delivering instant 0ms route transitions across all views, $O(1)$ precomputed storage indexing, and modular sub-component partitioning.
- **Lean Core & Pluggable Modular Architecture**: Core essentials (Dashboard, Firearms, Ammunition Depot, Storage Organizer, Accessories, Vault Security) remain lean, fast, and 100% air-gapped. Specialized features are installed on-demand via the in-app **Module Center** (`Reloading Workbench`, `Armorer & Maintenance`, `Ballistics Calculator`, `NFA Tracker`, `Bound Book`, `Optics Vault`, `Range Finder`, and `Batch Label Studio`).
- **Typst Vector PDF Documentation Suite**: Generates publication-grade multi-page Insurance Appraisal Binders and Official Armorer Work Order & Inspection Certificates in 0.14s using native Typst with 3-tier cloud & offline Chromium fallbacks.
- **Dedicated Modules Repository & Dynamic Discovery**: Pluggable modules are maintained independently in [cook0001/ArmoryVault-Modules](https://github.com/cook0001/ArmoryVault-Modules). The core application queries the remote catalog and registers newly published extensions without requiring a core application re-compile.
- **Encrypted Module Archiving & Data Mobility**: Uninstalled modules have their data pruned from memory and securely written to AES-256-GCM encrypted archives (`userData/module_archives/`). All module archives travel with your automated `.zip` backups so your historical records are never lost.
- **End-to-End Inventory Tracking**: Log make, model, caliber, serial number, purchase price, storage locations, optic torque specs, and high-resolution local photos.
- **Maintenance & Round Telemetry**: Keep detailed logs of gunsmithing work, deep cleanings, part replacements, and range sessions. Lifetime round counts increment dynamically across weapons and mounted accessories with proactive wear alerts.
- **ATF A&D Bound Book**: Generate professional Acquisition & Disposition (A&D) ledger views specifically formatted for 27 CFR Part 478 compliance and optimized for standard 8.5x11 printing.
- **Interactive FFL & Shooting Range Pickers**: Integrated directory lookup querying live ATF license records and 2,539 verified shooting facilities across all 50 states.
- **Local Wi-Fi Companion Sync**: Securely pair and synchronize inventory telemetry with the ArmoryVault Mobile Companion app over local Wi-Fi with zero cloud relay servers.
- **100% Private & Air-Gapped**: Built with Electron, React 19, and Vite. Your data is encrypted locally with PBKDF2/AES-256-GCM. No accounts, no cloud servers, and zero third-party telemetry.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Biome
- **Styling**: Vanilla CSS (Tactical Glassmorphism) with Lucide Vector Icons & Custom Military SVGs
- **Desktop Engine**: Electron with secure context-isolated IPC bridge
- **Document Engine**: Typst 0.15 native vector compiler with 3-tier resilient fallback
- **Testing**: Vitest CI Suite (219 automated tests across 37 suites)
- **Storage**: Native File-System & Encrypted AES-256-GCM persistence
- **CI/CD**: `electron-builder`, `electron-updater`, and GitHub Pages

## Installation

ArmoryVault is an open-source project distributed directly via GitHub Releases.

### macOS
1. Download `ArmoryVault-Mac-arm64.dmg` (Apple Silicon) or `ArmoryVault-Mac-x64.dmg` (Intel).
2. Drag `ArmoryVault.app` into your **Applications** folder.
3. If macOS Gatekeeper displays an unverified developer warning:
   - Open Terminal and run:
     ```bash
     xattr -cr /Applications/ArmoryVault.app
     ```
   - Alternatively, navigate to *System Settings > Privacy & Security* and click "Open Anyway".

### Windows
1. Download `ArmoryVault-Setup-2.9.0.exe`.
2. Double-click the installer.
3. If Microsoft Defender SmartScreen displays a warning, click **"More info"** followed by **"Run anyway"**.

### Linux (.AppImage)
1. Download `ArmoryVault-2.9.0.AppImage`.
2. Grant execution permissions:
   ```bash
   chmod +x ArmoryVault-2.9.0.AppImage && ./ArmoryVault-2.9.0.AppImage
   ```

## Development Setup

To run ArmoryVault locally for development:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/cook0001/ArmoryVault.git
   cd ArmoryVault
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   ```bash
   npm run electron:dev
   ```

4. **Run Linter & Test Suite:**
   ```bash
   npm run check       # Biome formatting & linter check
   npm test            # Full Vitest automated test suite (25 suites, 147 tests)
   npm run build       # TypeScript compiler (tsc -b) & Vite production build
   ```

> **Detailed Developer Guide**: See [WORKFLOW.md](WORKFLOW.md) for guidelines on code standards, atomic git commits, and release preparation.

## Building for Production & Releases

| Command | Platform | Output Target |
| :--- | :--- | :--- |
| `npm run package:mac` | macOS Universal (`.dmg` + `.zip`) | `dist-electron/release/` |
| `npm run package:win` | Windows Setup (`.exe`) | `dist-electron/release/` |
| `npm run package:linux` | Linux Universal (`.AppImage`) | `dist-electron/release/` |
| `npm run package:modules` | Modular Extension Archives | `dist-modules/` (`module-*.zip`) |
| `npm run release` | Multi-Platform Release | Compiles and publishes release binaries |

### Automated CI/CD Pipeline
- **Continuous Integration (`.github/workflows/ci.yml`)**: Runs linting, type-checking, and all 147 unit tests on every pull request and push.
- **Desktop Releases (`.github/workflows/release.yml`)**: Builds cross-platform binaries and publishes assets to GitHub Releases.
- **Website Portal (`.github/workflows/website.yml`)**: Deploys the official portal to [GitHub Pages](https://cook0001.github.io/ArmoryVault/).

## Associated Repositories

- **[cook0001/ArmoryVault-Modules](https://github.com/cook0001/ArmoryVault-Modules)**: Pluggable extensions repository (`reloading`, `maintenance`, `ballistics`, `nfa`, `boundbook`).
- **[cook0001/ArmoryVault-Companion-App](https://github.com/cook0001/ArmoryVault-Companion-App)**: Offline mobile companion app for Android and iOS.
- **[cook0001/armstrader.store](https://github.com/cook0001/armstrader.store)**: Web utilities suite (Firearm Bill of Sale Generator, FFL Finder, Shooting Range Locator).

## License

Released under the [ISC License](LICENSE). Copyright &copy; 2026 Daniel C. (cook0001).
