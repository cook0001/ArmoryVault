# ArmoryVault 🛡️

[![Website](https://img.shields.io/badge/Website-cook0001.github.io%2FArmoryVault-blue?style=flat-square&logo=github)](https://cook0001.github.io/ArmoryVault/)
[![Release](https://img.shields.io/github/v/release/cook0001/ArmoryVault?style=flat-square&color=emerald)](https://github.com/cook0001/ArmoryVault/releases/latest)
[![License](https://img.shields.io/badge/License-ISC-purple?style=flat-square)](LICENSE)

> 🌐 **Live Website & Download Portal**: [https://cook0001.github.io/ArmoryVault/](https://cook0001.github.io/ArmoryVault/)

A secure, premium, cross-platform desktop application designed for serious collectors and firearms owners. ArmoryVault provides local inventory tracking, maintenance logs, and printable "Bound Book" ledgers wrapped in a stunning, modern Glassmorphism interface.

## ✨ Features

- **End-to-End Inventory Tracking**: Log make, model, caliber, serial number, purchase price, and attach high-res local photos to your records.
- **Maintenance & Range Logs**: Keep detailed notes of gunsmithing work, deep cleanings, and range trips. The app automatically tallies the lifetime "rounds fired" count for every weapon.
- **A&D Bound Book**: Need physical records? ArmoryVault generates a stark, professional Acquisition & Disposition (A&D) ledger view specifically optimized with custom CSS for printing standard 8.5x11 records.
- **Data Export**: Instantly export your entire inventory to a cleanly formatted `.csv` file for insurance backups and spreadsheets.
- **Completely Private**: Built with Electron, ArmoryVault is a 100% offline desktop application. Your inventory data and photos never leave your machine; they are saved securely in your OS's native Application Data folder.
- **Over-The-Air Updates**: Features a seamless auto-update pipeline backed by GitHub Releases. The app will detect, download, and install updates automatically.

## 🛠 Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Vanilla CSS (Dark Mode Glassmorphism)
- **Desktop Engine**: Electron with secure IPC Context Bridge
- **Storage**: Native local File-System Persistence
- **CI/CD**: `electron-builder` and `electron-updater`

## 📥 Installation

ArmoryVault is an open-source project and is not distributed with expensive code-signing certificates. Because of this, your operating system will display a security warning the first time you run it. 

### macOS
When you open ArmoryVault, you will likely see a message saying the app "is damaged and can't be opened" or "cannot be verified."
1. Drag `ArmoryVault.app` from the `.dmg` into your **Applications** folder.
2. Open your Terminal and run the following command to strip the quarantine attribute:
   ```bash
   xattr -cr /Applications/ArmoryVault.app
   ```
3. You can now launch the app normally! (Alternatively, you can go to *System Settings > Privacy & Security* and click "Open Anyway").

### Windows
Windows Defender SmartScreen may display a blue warning box saying it "protected your PC."
1. Click **"More info"** on the warning screen.
2. Click **"Run anyway"**. The installer will now launch.

### Linux (.AppImage)
1. Download the `.AppImage` file.
2. Make it executable by running `chmod +x ArmoryVault-2.3.1.AppImage` in your terminal (or right-click the file > Properties > Permissions > "Allow executing file as program").
3. Double click to run!

## 🚀 Getting Started (Development)

To run ArmoryVault locally on your machine for development:

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

## 📦 Building for Production & Release Channels

ArmoryVault uses `electron-builder` with dedicated output separation between **Stable** and **Nightly / Preview** release channels:

- **Stable Builds**: Generated into `dist-electron/stable/`
- **Nightly Builds**: Generated into `dist-electron/nightly/`

### Local Packaging Commands

| Command | Channel | Output Target |
| :--- | :--- | :--- |
| `npm run package:stable:mac` / `win` / `linux` | Stable | `dist-electron/stable/` |
| `npm run package:nightly:mac` / `win` / `linux` | Nightly Preview | `dist-electron/nightly/` |
| `npm run release:stable` | Stable Release | `dist-electron/stable/` + GitHub |
| `npm run release:nightly` | Nightly Release | `dist-electron/nightly/` + GitHub |

### Automated CI/CD Pipeline
You do not need to manually compile the application on your local machine. The repository is configured with GitHub Actions workflows:
- **Desktop Releases (`.github/workflows/release.yml`)**: Compiles multi-platform installers (macOS Apple Silicon/Intel, Windows, Linux) and automatically detects whether the tag is a pre-release (`*nightly*`, `*beta*`, etc.) to publish to the proper release channel.
- **Website Portal (`.github/workflows/website.yml`)**: The official website source lives in `website/` and automatically deploys to [GitHub Pages](https://cook0001.github.io/ArmoryVault/) upon push to `main`.

To trigger a new production build:
1. Run `npm run release:prep` to bump your version (`major`, `minor`, `patch`, or `nightly`).
2. Commit your changes and push a git tag matching the version (e.g., `git tag v2.8.0` or `git tag v2.8.0-nightly.2` && `git push origin --tags`).
3. GitHub Actions handles multi-platform compilation and uploads all installers automatically!
