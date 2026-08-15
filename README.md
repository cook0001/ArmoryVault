# ArmouryVault 🛡️

A secure, premium, cross-platform desktop application designed for serious collectors and firearms owners. ArmouryVault provides local inventory tracking, maintenance logs, and printable "Bound Book" ledgers wrapped in a stunning, modern Glassmorphism interface.

## ✨ Features

- **End-to-End Inventory Tracking**: Log make, model, caliber, serial number, purchase price, and attach high-res local photos to your records.
- **Maintenance & Range Logs**: Keep detailed notes of gunsmithing work, deep cleanings, and range trips. The app automatically tallies the lifetime "rounds fired" count for every weapon.
- **A&D Bound Book**: Need physical records? ArmouryVault generates a stark, professional Acquisition & Disposition (A&D) ledger view specifically optimized with custom CSS for printing standard 8.5x11 records.
- **Data Export**: Instantly export your entire inventory to a cleanly formatted `.csv` file for insurance backups and spreadsheets.
- **Completely Private**: Built with Electron, ArmouryVault is a 100% offline desktop application. Your inventory data and photos never leave your machine; they are saved securely in your OS's native Application Data folder.
- **Over-The-Air Updates**: Features a seamless auto-update pipeline backed by GitHub Releases. The app will detect, download, and install updates automatically.

## 🛠 Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Vanilla CSS (Dark Mode Glassmorphism)
- **Desktop Engine**: Electron with secure IPC Context Bridge
- **Storage**: Native local File-System Persistence
- **CI/CD**: `electron-builder` and `electron-updater`

## 🚀 Getting Started (Development)

To run ArmouryVault locally on your machine for development:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/cook0001/ArmouryVault.git
   cd ArmouryVault
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   ```bash
   npm run electron:dev
   ```

## 📦 Building for Production

ArmouryVault uses `electron-builder` to package standalone, native installers for Windows (`.exe`), macOS (`.dmg`), and Linux (`.AppImage`).

To compile a standalone binary locally without publishing:
```bash
npm run package:mac   # For macOS
npm run package:win   # For Windows
npm run package:linux # For Linux
```

**To publish an Auto-Updating Release to GitHub:**
```bash
export GH_TOKEN="your_personal_access_token_here"
npm run release
```
*This command bundles the app, generates the installers, and uploads them directly to your repository's Releases page to trigger auto-updates for your users.*
