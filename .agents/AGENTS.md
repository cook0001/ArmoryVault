# ArmoryVault AI Agent Rules

## 1. Pre-Push & Versioning Requirements
- **Version Control Protocol**: Before preparing any push to GitHub or generating a release, ALWAYS determine the correct version bump by following the rules in `VersionControl` (Major.Minor.Patch). Update the version string in `package.json` to reflect this change.
- **Changelog Maintenance**: Every significant change MUST be documented in `CHANGELOG.md` under the appropriate version header. Keep a clear record of features, bug fixes, and improvements.
- **Documentation Updates**: Ensure `README.md` is kept up-to-date if any new scripts, architectural patterns, features, or setup steps are introduced.
- **Gitignore Hygiene**: If new environment files, build artifacts, keystores, or temporary folders are added to the project, ensure they are properly excluded in `.gitignore`.

## 2. Build and Deployment Context
- **Framework**: This is an Electron + React + Vite + TypeScript application (`dist-electron` and `dist` outputs). 
- **Build Troubleshooting**: We have a history of build and GitHub Actions issues (`release.yml`). When troubleshooting build errors or modifying dependencies, *always* verify compatibility with `electron-builder` and Vite plugins before proceeding. Do not assume mobile (Android/APK) environments apply directly unless running a specific web-wrapper setup.
- **GitHub Actions**: Do not modify `.github/workflows` (like Dependabot or release scripts) without first planning the steps and ensuring secrets/permissions align with standard electron-builder GitHub publishing configurations.

## 3. Barcode Scanning and Parsing
- **Library Standard**: Barcode scanning features rely heavily on `html5-qrcode` and `react-qr-code`. Do not introduce new or competing barcode libraries without explicit approval.
- **Data Parsing Protocol**: When adjusting how barcodes are interpreted, all core heuristic logic MUST go through `src/utils/BarcodeEngine.ts` (`parseBarcodeData`). Do not implement one-off regex or parsing logic directly inside React components (e.g., `FirearmDetails.tsx` or `AccessoryModal.tsx`).
- **Testing Parsing Changes**: Barcode parsing logic is highly complex (inferring ammo, components, and accessories). Any modification to `BarcodeEngine.ts` requires extreme care to avoid breaking existing heuristic scores for `scoreAmmo`, `scoreComponent`, and `scoreAccessory`.

## 4. UI and State Management
- **Styling**: Adhere to the established styling (likely Tailwind or Vanilla CSS depending on the exact setup) and use `lucide-react` for any new icons. Ensure dark/light modes and modern aesthetic standards are maintained.
- **Modal Positioning**: Ensure all modals (e.g., `AccessoryModal.tsx`) are consistently centered in the viewport and properly visible regardless of the user's scroll position. Use `fixed` positioning with a backdrop overlay, and proper centering mechanics (e.g., Flexbox or Grid) to prevent modals from rendering off-screen or out of view.
- **App Sync & Offline State**: We have encountered "App Sync Issues" historically. When creating or modifying inventory components, ensure any state mutations correctly queue or push data to the persistence layer. Account for potential network latency or offline modes.
- **Component Reloading**: When working with inventory tracking updates (like reloading components or ammunition counts), verify that the React state refreshes dynamically without requiring a full desktop window refresh.

## 5. General Best Practices
- **TypeScript Strictness**: Maintain strict typings. Use the defined interfaces in `src/types` (e.g., `Ammo`, `ReloadingComponent`, `Accessory`) instead of falling back to `any`.

## 6. Upgrade Suggestions & Implementation Plans
- **Mandatory Implementation Plans for Upgrades**: Anytime the AI agent recommends or suggests upgrades, optimizations, performance improvements, UI enhancements, or architectural modifications, it MUST automatically generate an `implementation_plan.md` artifact detailing the proposed scope, technical breakdown, and verification strategy so the user can review, annotate, and approve the plan before any execution begins.

