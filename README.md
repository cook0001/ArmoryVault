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

## 📥 Installation

ArmouryVault is an open-source project and is not distributed with expensive code-signing certificates. Because of this, your operating system will display a security warning the first time you run it. 

### macOS
When you open ArmouryVault, you will likely see a message saying the app "is damaged and can't be opened" or "cannot be verified."
1. Drag `ArmouryVault.app` from the `.dmg` into your **Applications** folder.
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
2. Make it executable by running `chmod +x ArmouryVault-1.0.8.AppImage` in your terminal (or right-click the file > Properties > Permissions > "Allow executing file as program").
3. Double click to run!

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

ArmouryVault uses `electron-builder` coupled with **GitHub Actions** to automatically compile native installers for Windows (`.exe`), macOS (`.dmg`), and Linux (`.AppImage`).

### Automated CI/CD Pipeline
You do not need to manually compile the application on your local machine. The repository is configured with a GitHub Actions workflow that automatically handles the heavy cross-platform compilation process.

To trigger a new production build and release:
1. Update the `"version"` field in your `package.json` (e.g., `"version": "1.0.1"`).
2. Commit your changes and create a git tag matching the version prefix with `v`:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```
3. GitHub Actions will automatically spin up Windows, macOS, and Linux runners, securely compile the application, and upload the finalized `.exe`, `.dmg`, and `.AppImage` files directly to your GitHub Releases page!

This seamlessly powers the auto-updater for your users without requiring any local build dependencies (like Wine).
