# Changelog

## [2.8.0-nightly.4]
### Preview & Community Bug Testing Release
- **Comprehensive Action Type Architecture & 24 Maintenance Profiles**: Expanded the firearm action type dataset and added dedicated maintenance profiles with heuristic auto-detection across all 24 firearm operating mechanisms:
  - *Semi-Automatic & Auto-Loading*: `semi_pistol` (Short Recoil Handguns, Striker & DA/SA), `semi_rifle` (Direct Impingement AR-15/AR-10), `semi_piston_rifle` (Gas Piston AK-47/74, SCAR, Tavor, Bren 2), `semi_roller_delayed` (Delayed Blowback MP5/SP5, HK91, Banshee), `semi_direct_blowback` (Direct Blowback PCC & Carbine Ruger PCC, Scorpion), `semi_shotgun` (Gas & Inertia Shotguns Beretta A300/A400, Benelli M4/M2).
  - *Bolt Actions*: `bolt_action` (Modern Hunting & Tactical Push/CRF), `straight_pull_bolt` (Straight-Pull Blaser R8, Impulse, K31), `bolt_action_target` (Single Shot Target & Benchrest Rem 40-X, Anschütz), `vintage_bolt_crf` (Vintage Military CRF Mauser K98k, 1903A3, Mosin, Enfield).
  - *Lever & Pump*: `lever_action` (Tubular Magazine Marlin/Winchester/Henry), `vintage_box_lever` (Box Magazine & Rotary Winchester 1895, Savage 99, BLR), `pump_action` (Slide Action Shotguns & Rifles 870/500/7600).
  - *Revolvers*: `revolver` (Double Action / Single Action & DAO S&W 686, Python), `revolver_sa` (Single Action Gate Loading Ruger Blackhawk, Colt SAA), `revolver_top_break` (Top-Break & Tip-Up Webley, Schofield).
  - *Break Action & Single Shot*: `break_action` (Over/Under & Side-by-Side Doubles Citori, 686), `break_action_single` (Break Action Single Shot CVA Scout, Henry, T/C Encore, H&R), `falling_block_single` (Falling & Rising Block Ruger No. 1, 1885 High Wall, Sharps), `rolling_block_trapdoor` (Vintage Rolling Block, Trapdoor & Martini).
  - *Muzzleloaders & Historic Gas*: `muzzleloader_inline` (Modern In-Line 209 Primer CVA Optima, Traditions, Knight), `muzzleloader_traditional` (Traditional Caplock & Flintlock Hawken, Musket), `m1_garand` (M1 Garand & Military Long-Stroke Gas), `m1_carbine` (M1 Carbine & Short-Stroke Gas).
- **Clean Add/Edit Firearm Form Inputs**: Streamlined the `Make` and `Model` fields to clean text inputs without dropdown autocomplete clutter, and updated `Action Type` with the expanded dataset.
- **Gunpowder Multi-Unit Telemetry (Pounds, Ounces, Grains)**: Built a comprehensive ballistic weight calculation engine (`src/utils/powderUnits.ts`) providing simultaneous multi-unit tracking across **Pounds (lbs)**, **Ounces (oz)**, and **Grains (gr)** (1 lb = 16 oz = 7,000 gr; 1 oz = 437.5 gr). Supports entering and storing powder in any of the three units with a live real-time conversion banner and cost-per-grain metric in `ReloadingComponentModal`. Displays total vault powder supply across all 3 units in `ReloadingComponents` and `AmmoDashboard`, gives load yield estimators (`~253 rds of .308 @ 41.5gr`), and provides precision grain-level deduction during batch handload manufacturing in `BatchManufactureModal`.
- **Tactical Accessory Detail Cards & Dossier Modal (`AccessoryDetailModal`)**: Overhauled the display of accessories and optics across the Accessories catalog and Firearm Details page into rich tactical cards with custom color-coded type badges (Optic, Suppressor, Light, Magazine, Holster, Mount, Sling, Other), dedicated technical spec chips (Magnification, Lumens, Rated Calibers, Magazine Capacity, Platform Fits), round telemetry counters, NFA tax stamp indicators, valuation displays, and interactive mounted firearm chips. Clicking any card opens a full-spec `AccessoryDetailModal` with a multi-photo Lightbox gallery, comprehensive logistics breakdown, ATF registration tracker, and direct firearm links.
- **Unified Anchored Dropdown System (`AutocompleteInput`)**: Replaced all native `<datalist>` and browser `<select>` dropdowns across the application (`FirearmForm`, `AmmoDashboard`, `ReloadingComponentModal`, `AccessoryModal`, `RangeSessionModal`, `BatchManufactureModal`, `FirearmDetails`, `Layout` Custom SKU manager, and `Dashboard` filters) with custom anchored glassmorphic dropdowns. Eliminates detached popup floating during container scrolling, adds keyboard navigation (<kbd>Up</kbd>, <kbd>Down</kbd>, <kbd>Enter</kbd>, <kbd>Esc</kbd>), instant chevron toggling, and real-time substring filtering.
- **Viewport Modal Portal Standard & Centering**: Wrapped all application modals and dialogs (`AccessoryModal`, `AmmoCanLabelModal`, `BatchManufactureModal`, `ChangePasswordModal`, `RecoveryKeyModal`, `RangeSessionModal`, `ReloadingComponentModal`, `Lightbox`, `FirearmDetails` sub-dialogs, `AmmoDashboard` forms, `SyncInbox` prompts) in React `createPortal(..., document.body)` with `position: fixed; inset: 0; z-index: 99999;` and backdrop blur, ensuring dialogs always render centered in the viewport regardless of scroll position.
- **Intelligent Scroll Restoration Engine**: Built `useScrollRestoration` hook tracking continuous route scroll offsets with `sessionStorage` backing and `MutationObserver` synchronization, seamlessly restoring scroll positions when navigating back from detail views as asynchronous database cards render into the DOM.
- **Interactive Mobile Device Pairing Workflow**: Added dedicated QR code pairing modal with real-time Wi-Fi listening badge, instant auto-closing upon companion app scan (`/api/ping`, `/api/inventory/summary`, `/api/inventory/cache`, `/api/pair`, `/api/sync`), and an auto-disappearing emerald success notification toast.
- **Interactive PayPal Custom Donation Amount Deck**: Added selectable preset amount chips ($5, $15, $25, $50, $100) and custom numeric dollar input with dynamic deep-link generation (`paypal.me/ArmoryVault/[amount]USD`) directly in the website support section.
- **Website Performance & Asset Optimization (Phase 1)**: Compressed master branding assets (`icon.png` from 1.84 MB to 114 KB, `mobile-icon.png` from 1.43 MB to 144 KB, plus lean 37 KB / 50 KB WebP formats) yielding a 97.3% payload reduction. Removed render-blocking CSS `@import` fonts in favor of `<link rel="preconnect">` and asynchronous font stylesheets. Added 15-minute `localStorage` release caching (`fetchWithCache`) to eliminate GitHub API 60 req/hr rate limits.
- **Website UI & Interactivity Overhaul (Phase 2)**: Added Smart 1-Click Hero OS Download CTA with automatic system architecture detection (macOS Apple Silicon/Intel, Windows, Linux, Android APK), in-frame Glassmorphic modal simulator for `+ Firearm` and ATF Bound Book print previews (replacing browser alerts), tactile muzzle-flash recoil spark animation with real-time stock decrements on the Range Simulator, and a floating glassmorphic Back-to-Top quick navigation button.
- **Dependency Modernization & Package Pruning**:
  - Removed 180 obsolete packages (~150 MB disk savings) by eliminating legacy `archiver` (superseded by in-memory `adm-zip`), unused `cross-env`, conflicting `@types/jest`, and redundant ESLint/Prettier dependencies completely replaced by high-performance **Biome** (`@biomejs/biome: 2.5.9`).
  - Relocated `@types/qrcode` from runtime dependencies to devDependencies.
  - Upgraded core build tools and utilities: `lucide-react` (1.33.0), `vite` (8.2.2), `@vitejs/plugin-react` (6.1.0), `vitest` (4.1.11), `electron` (43.4.1), `concurrently` (10.0.5), and `@testing-library/user-event` (14.6.5).
  - Maintained 0 vulnerabilities across all dependencies (`npm audit`).
- **Accessibility & Contrast Polish (Phase 3)**: Upgraded muted typography contrast (`--text-muted: #94a3b8`) for WCAG AAA compliance and implemented high-visibility `:focus-visible` outline rings for keyboard accessibility.

## [2.8.0-nightly.3]
### Preview & Community Bug Testing Release
- **Dedicated Build Channels (Stable vs Nightly)**: Separated Electron packaging output into dedicated `dist-electron/stable` and `dist-electron/nightly` directories with standalone build runners (`scripts/build-stable.js`, `scripts/build-nightly.js`), expanded `package.json` channel commands (`package:stable:*`, `package:nightly:*`, `release:stable`, `release:nightly`), and updated interactive `scripts/prepare-release.js` with 1-click nightly prerelease bumping.
- **Website Architecture Migration (`website/`)**: Moved the official ArmoryVault landing portal from `docs/` to its own top-level `website/` directory, supported with an automated GitHub Pages GitHub Actions deployment workflow (`.github/workflows/website.yml`).

## [2.8.0-nightly.2]
### Preview & Community Bug Testing Release
- **Mobile Companion Remote Vault Lock & Sync Hardening**: Added `/api/vault/lock` and `/api/lock` HTTP endpoints and IPC broadcast listener allowing paired mobile companion apps to remotely lock the desktop vault over local Wi-Fi, immediately clearing decryption keys from PC memory and navigating the desktop UI to the secure `VaultLogin` screen.
- **Official Web Portal Enhancements**:
  - Added PayPal donation button (`paypal.me/ArmoryVault`) across top navbar, mobile navigation drawer, support cards, and footer.
  - Added Dual Interactive Showcase Models with toggle switcher for Nightly Command Center (`v2.8.0`), Stable Release (`v2.7.1`), and Mobile Companion (`v2.6.0`).
  - Added direct scannable APK QR code for smartphone camera downloads with dynamic release channel synchronization.
  - Updated mobile companion download spotlight with new high-definition tactical cyber shield branding.

## [2.8.0-nightly.1]
### Preview & Community Bug Testing Release
- **Unified Ammo & Reloading Depot**: Merged separate Ammo and Reloading tabs into a single, cohesive command center in the top navigation bar. Features 3 integrated depot sub-views (`🎯 Live Ammunition`, `🧪 Reloading Supplies`, `📊 Combined Overview`), top caliber quick-stock showcase cards matching the website preview (colored accent borders, live counts, top load types, and stock goal gauges), unified tactical control deck, and full batch manufacture integration.
- **Customizable Metric Cards & Visibility Toggles**: Added a `⚙️ Customize Cards` popover slider allowing users to toggle individual live ammo and reloading metric cards on or off with persistent `localStorage` preferences across both the Dashboard and Depot.
- **Command Center Dashboard with Tactical Card & Table Views**: Complete redesign of the primary inventory dashboard. Includes a persistent Card View 🔲 vs Compact Table View 📋 switcher, unified control deck with 1-click Category Filter Chips (Handguns, Rifles, Shotguns, C&R / Vintage, NFA, ⚠️ Service Due), real-time search, status dropdown, live ammo inventory telemetry, lifetime rounds fired tracker, visual round wear gauges with maintenance progress meters, mounted accessories pill clouds, and a customizable metrics popover with persistent card visibility preferences.
- **ATF A&D Bound Book Overhaul**: Rebuilt the Bound Book page to match the modern tactical theme. Features compliance metrics (Total Records, Active in Safe, Transferred/Sold, ATF Standard), unified search & filter deck, two-tier A&D table with cyber-blue monospace serial number pills, status badges, and 1-click CSV and 8.5x11 landscape printing.
- **Firearm Details Dossier Polish**: Refactored the firearm details view into a clean 2-column dossier grid with constrained photo showcase gallery (`240px` cover with hover zoom and lightbox expansion), inline caliber & safe status badges, and neatly proportioned specification matrices.
- **Centered Modal Positioning & Backdrop Blur**: Converted `AccessoryModal` and `ReloadingComponentModal` to the fixed `.modal-overlay` system with `backdrop-filter: blur(16px)` and dedicated header with `✕` close button, ensuring perfect viewport centering.
- **Glassmorphic Top Navigation & Modern Tactical Styling**: Replaced the desktop sidebar with a full-width sticky Glassmorphic Top Navigation Bar matching the official website preview. Upgraded typography (Outfit + Inter + JetBrains Mono), ambient background radial mesh glows, stat card containers, metric pills, and primary gradient buttons.
- **Pre-Release & Nightly CI/CD Release Pipeline**: Added automated `--prerelease` detection and workflow dispatch triggers to `.github/workflows/release.yml` so nightly/beta test builds are built and distributed across macOS (Apple Silicon + Intel), Windows, and Linux without interfering with stable auto-update channels.
- **Website Preview & Nightly Download Hub**: Updated the official website with a dedicated Release Channel Switcher (`Stable` vs `Nightly / Beta`) with live asset resolution and direct bug reporting links.

## [2.7.1]
### Fixed & Improved
- **Robust Full Zip Archive Backup Engine**: Replaced stream-based archiver with pure in-memory/synchronous `adm-zip` packaging. Resolves production ASAR stream locking and unhandled stream errors when creating full `.zip` archives.
- **Enhanced Backup Feedback & Error Reporting**: Attached main window handle to system save dialogs and added rich error messages with cancel safety when generating full vault `.zip` backup archives.
- **Official GitHub Pages Website & Community Feedback Hub**: Created a responsive, dark glassmorphism landing website in `docs/` ready for GitHub Pages hosting (`https://cook0001.github.io/ArmoryVault/`). Includes interactive UI showcases, range logger simulation demo, dedicated Apple Silicon (`arm64`) vs Intel (`x64`) macOS download buttons with system auto-detection, and a 1-click Feature Suggestion & Bug Reporting portal integrated with GitHub Issues.

## [2.7.0]
### Added
- **Vintage & Military Surplus Firearm Autocomplete Support**: Added comprehensive datalist choices in `Add Firearm` for historic and collectible firearms across USGI arsenals (Springfield Armory, Inland, Rock-Ola, Underwood, Smith-Corona, Eddystone, H&R, Ithaca, Union Switch & Signal), European arsenals (Mauser Oberndorf/DWM, Enfield RSAF, Lithgow, Tula, Izhevsk, Waffenfabrik Bern, Carl Gustafs, Husqvarna, Terni, Steyr, Radom, Zastava), and collectible reproductions (Uberti, Pietta, Pedersoli, Cimarron).
- **Curio & Relic (C&R) Models & Classifications**: Added models and firearm types including `Curio & Relic (C&R) Rifle/Handgun`, `Military Surplus Service Rifle/Handgun`, `Antique / Blackpowder`, with NRA Antique Condition standards (`NRA Excellent 98-100%`, `NRA Fine`, `NRA Very Good`, `NRA Good`, `CMP Service/Collector/Field/Rack Grade`, `All-Matching Numbers`).
- **Comprehensive Historic Caliber Master List**: Added support and auto-categorization for classic military surplus calibers (.30-06 Springfield, .30 Carbine, .30-40 Krag, .303 British, 7.62x54mmR, 7.92x57mm 8mm Mauser, 6.5x55mm Swedish, 7.5x55mm Swiss GP11, 7.65x53mm Argentine, 7x57mm Mauser, 6.5x50mm/7.7x58mm Arisaka, 6.5x52mm Carcano, 8x56mmR Steyr, 8x50mmR Lebel, 7.5x54mm French, 7.62x25mm Tokarev, 9x18mm Makarov, 7.62x38mmR Nagant, 7.63x25mm Mauser, 7.65x21mm Luger, .455 Webley, .45-70 Govt, .405 Win, .30-30 Win).
- **Specialized Vintage Maintenance Profiles**: Added 4 pre-configured maintenance schedules with auto-detection for M1 Garand, M1 Carbine, Vintage Controlled-Round-Feed Bolt Actions (Springfield 1903/1903A3, Mauser 98, Lee-Enfield, Mosin-Nagant, K31), and Box-Magazine Lever Actions (Winchester Model 1895, Savage 99).

## [2.6.1]
### Added
- **Master Vault Password Management & Security Hub**: Users can now change their master encryption password anytime from Settings -> **Vault Security & Encryption**. Features secure envelope re-encryption of the AES-256 master key with PBKDF2 key derivation (100,000 rounds) and live password strength/matching validation.
- **Dedicated Emergency Recovery Key Viewer & Text Backup**: Users can view, verify, copy, or download their permanent 64-character emergency recovery key (`ArmoryVault_Recovery_Key.txt`) at any time from Settings -> **View Vault Recovery Key**.
- **Vault Re-Keying & Recovery Key Regeneration**: Added option to regenerate a brand new 64-character recovery key and re-encrypt the entire inventory database (accessible as a checkbox during password changes or via the standalone **Regenerate Key** tool). Invalides old compromised recovery codes and issues a fresh master key.

## [2.6.0]
### Added
- **Dual Trigger Maintenance Scheduling (Round Count & Elapsed Days)**: Maintenance tasks now support dual wear and time triggers (e.g. 5,000 rounds OR 180 days). Includes a clean checkbox `[ ] Also trigger on elapsed time (Days)` in the schedule creator and dual progress bar countdown alerts on firearm detail cards.
- **Custom Maintenance Schedule Presets & Templates**: Users can now save any firearm's configured maintenance schedule as a reusable custom template with 1-click. Saved templates can be applied (replace or append) to other firearms and managed directly within the Presets picker modal.
- **Printable Gunsmith Service Record & Provenance Dossier**: Added a complete printable PDF/paper dossier for firearms featuring full specifications, lifetime round telemetry, reliability ratings, active wear schedules, chronological service ledger, and mounted equipment. Includes dedicated `@media print` layout.
- **Mounted Accessory Round Telemetry**: Logging range sessions now automatically propagates and increments round counts across all mounted optics, suppressors, lights, and barrels. Displayed via dedicated round badges on accessory cards and tracked within the modal.
- **Comprehensive & Proprietary Bullet Type Support**: Added full database, autocomplete datalist, and barcode intelligence support for 70+ standard, match, defensive, and proprietary bullet types across Hornady (ELD-X, ELD Match, V-Max, FTX, XTP, SST, Sub-X, CX), Federal (HST, Hydra-Shok, Syntech, Punch, Terminal Ascent, Trophy Bonded), Sierra (MatchKing, GameKing, BlitzKing, TGK), Speer (Gold Dot, Lawman, TNT), Barnes (TTSX, TSX, LRX, TAC-TX), Nosler (AccuBond, Partition, Ballistic Tip, E-Tip, RDF), Winchester (Silvertip, Ranger T, Defender, Power-Point, Deer Season XP), Remington (Core-Lokt, Golden Saber, AccuTip), Berger (VLD, Hybrid OTM), Lapua/Norma (Scenar, Oryx, Tipstrike, Naturalis), and Lehigh/Underwood (Xtreme Penetrator, Xtreme Defender, HoneyBadger).
### Improved & Fixed
- **Bulk Pack Quantity & Barcode Parsing (e.g. 1,400 Rd Bucket)**: Fixed an issue in `BarcodeEngine.ts` where comma-separated quantities (such as Remington Golden Bullet `1,400 Rounds` / `1,400 RD` bucket UPC `047700415208`) were truncated to `400` due to integer regex stopping on commas. Added support for comma-formatted counts (`1,000`, `1,400`, `5,000`), improved `.22 LR` caliber detection, and added support for `PHP` / `CPHP` bullet types.

## [2.5.0]
### Added
- **Range Trip Quick-Logger & Atomic Session Handler**: New quick logger modal accessible from sidebar Tools and Firearm Details. Atomically increments firearm round counts and decrements caliber-matched ammo stock in a single transaction with full cost and location logging.
- **Offline Mobile Sync Support & Inventory Caching**: Added `/api/inventory/cache` endpoint allowing companion mobile apps to pull and cache firearms, ammo, components, and custom SKUs for offline usage at the range.
- **Sync Inbox Range Session Review**: Companion app range session submissions now appear in `SyncInbox` with full firearm, ammo deduction, and round count details for user review with **Approve**, **Modify**, and **Decline** actions.
- **Proactive Multi-Task Maintenance Scheduling with Action-Type Profiles**: Added multi-schedule tracker to `FirearmDetails.tsx` with intelligent profile auto-detection. Standard schedules now dynamically adapt to firearm action types (e.g. Pump Action shotguns track action bars, magazine tubes, and extractors without nonexistent recoil springs; Revolvers track cylinder gap, timing, and crane assemblies; Semi-Auto rifles track BCG, gas rings, and buffer springs). Includes a preset picker modal with 8 tailored profiles and live preview.
- **Task Completion & Part Replacement Modal**: Clicking "Complete Task" allows recording custom aftermarket replacement parts (e.g., Apex Tactical Heavy Duty Extractor vs OEM), part manufacturer, cost ($), date, and notes into the firearm's permanent maintenance ledger.
- **Ammo Box & Can QR Printable Sticker Labels**: Added `AmmoCanLabelModal` supporting selectable formats ("Compact 20/50-rd Box Label" vs "Large 30/50-Cal Ammo Can Label"). Includes complete load recipes for handloads (powder, charge weight, primer, brass, OAL) and high-density `AV-AMMO-<id>` QR codes for instant mobile scanning and stock adjustments.
- **Custom SKU & Barcode Support for Parts & Accessories**: Upgraded the Custom SKU Manager into a unified dictionary supporting Ammunition, Parts & Accessories (e.g. Apex extractors, Holosun optics, Magpul mags), and Reloading Supplies. `AccessoryModal` automatically checks the local SKU dictionary during barcode/part# lookups for instant offline auto-fill, displays SKU badges on accessory cards, and allows 1-click saving of newly added parts into the Custom SKU Dictionary.
- **Low-Stock & Restock Alerts with Filter Toggles**: Added configurable `min_threshold` alerts to both Ammunition and Reloading Components dashboards. Added quick-filter `[ ⚠️ Low Stock (X) ]` buttons to instantly isolate depleted inventory.
- **Optional Collection Value Analytics**: Added an investment and collection value breakdown card (Firearms, Accessories, Ammunition, Reloading Supplies) on the main dashboard, controlled via a toggle switch in Settings.

### Improved
- **Universal Scan Routing**: Enhanced `SyncInbox` universal barcode resolution to auto-route scanned custom accessory and reloading component SKUs with pre-filled metadata directly into their respective modals.
- **Barcode & Label Integration**: Integrated `AV-AMMO-<id>` QR parsing into `SyncInbox` universal scan resolver for automated ammo adjustments.
- **TypeScript Strictness & Validation**: Added strict interface types for `CustomSkuItem`, `MaintenanceScheduleItem`, `range_session`, and IPC API handlers.

## [2.4.0]
### Added
- **Database In-Memory Cache**: The encrypted vault is now decrypted once on unlock and held in memory. Writes are debounced (2-second delay) and batched, eliminating redundant decrypt/encrypt cycles on every CRUD operation. This dramatically improves performance for users with large inventories.
- **Caliber Helpers Module**: Extracted `getStandardPelletCount`, `generateInternalUPC`, `formatCaliber`, `getAmmoCategory`, and `escapeRegExp` from `AmmoDashboard.tsx` into a shared `src/utils/caliberHelpers.ts` module. Reduces the mega-component by ~100 lines and eliminates code duplication with `BarcodeEngine.ts`.
- **React Error Boundary**: App-wide crash handler prevents blank white screens. If a component throws an error, users see a "Something went wrong" fallback with "Try Again" and "Return to Dashboard" recovery actions.
- **Vitest Global Configuration**: Added `test` config to `vite.config.ts` with jsdom environment and setup file, fixing all test infrastructure issues.
- **Vault Auto-Lock Timer**: The vault automatically locks after 15 minutes of inactivity (no mouse, keyboard, or touch input). Resets on any user interaction.
- **Manual Lock Button**: New "Lock Vault" button in the sidebar lets you instantly re-lock the vault and return to the login screen.
- **Date-Stamped Backup Rotation**: Backups now use the format `ArmoryVault_Backup_YYYY-MM-DD.enc`, keeping the 5 most recent backups automatically. Older backups are cleaned up.
- **Dashboard Column Sorting**: Click any column header (Make, Model, Caliber, Serial Number, Status) to sort ascending/descending. Active sort direction shown with arrow icons.
- **Ammo Caliber Grouping**: Within each ammo category (Pistol, Rifle, Shotgun, Other), rounds are now automatically sorted by caliber so same-caliber ammo cards appear next to each other.
- **Database Backup Restoration**: Added a complete backup restoration workflow in Settings supporting both encrypted `.enc` vault files and `.zip` full archives (extracting database, photos, and PDF documents). Includes automatic pre-restore safety backups.

### Improved
- **`SyncItem` Type Safety**: Replaced the catch-all `[key: string]: any` index signature with explicit typed fields (`measurement`, `firearm_id`, `photo_data`, `log_type`) and a string union for `type`.
- **`mockBackend.ts` Types**: Replaced `any[]` return types with proper `Accessory[]` and `ReloadingComponent[]` types from the type system.
- **Accessory Quantity Type**: Replaced `'' as any` type escape hatch with `undefined` for the optional numeric `quantity` field.
- **Deprecated Field Cleanup**: Removed legacy `mountedOnFirearmId` from the `Accessory` interface and updated `FirearmDetails.tsx` to use the `mounts` array pattern directly.
- **Sidebar & Navigation Layout**: Grouped sidebar into labeled sections (Inventory, Manage, Tools) with compact spacing to eliminate scrollbars and optimize viewport fit.
- **Centralized Data Export**: Consolidated the Firearms CSV Export button into Settings alongside the Insurance Report PDF and Full Zip Archive for a cleaner dashboard header.

### Fixed
- **Custom SKU Database Overwrite**: Fixed a critical bug in `SyncInbox` where approving an incoming barcode sync scan wrote to `saveSkus` without first loading existing SKUs into local state, unintentionally wiping prior custom SKU mappings. In addition, `database.js`'s `saveSkus` now safely merges incoming SKU records with existing database records instead of replacing the entire map.
- **CSV Export Corruption**: Fixed a bug where firearm models containing double-quote characters (e.g., `Ruger 10/22 "Takedown"`) would produce malformed CSV output. Fields are now escaped per RFC 4180.
- **`.gitignore` Gaps**: Added missing entries for `.env`, `.env.*`, `*.enc` (encrypted vault data), and `*.bak` (legacy plaintext backups) to prevent accidental commits of sensitive data.
- **Test Failures**: Fixed 4 pre-existing test failures in `Dashboard.test.tsx` and `FirearmForm.test.tsx` (missing jsdom environment, incomplete mock API, duplicate button queries).

## [2.3.2]
### Fixed
- **UI Bug**: Fixed a CSS issue where Modals (like Accessory and Reloading Component popups) would render off-screen when the user scrolled down. Modals are now properly centered in the viewport with correct `overflow-y` handling.

## [2.3.1]
### Added
- **macOS OTA Fallback**: macOS users will now receive "Update Ready" notifications with a direct link to manually download updates, bypassing the unsigned Squirrel.Mac errors.
- **Universal Sync Inbox**: New central hub to intercept all uncategorized barcode scans from the mobile app.
- **Smart Component Deduplication**: Resolving uncategorized scans now checks for manually added duplicates and prompts to merge them.
- **Dynamic Box Sizing**: Desktop sync inbox now supports live UPC lookups and local Custom SKU fallback to calculate exactly how many rounds/items are in a scanned box.
- **Unknown Box Size Modal**: Clean UI intercept for user to define a box quantity for unknown barcodes, permanently saving it to the Custom SKU dictionary.
- **Regex Sanitization**: Advanced string cleanup when parsing UPC data from upcitemdb to remove junk keywords and manufacturer redundancies.

### Changed
- Refined Barcode Engine weighting so reloading powder and primers are no longer miscategorized as ammunition.
- Re-architected API lookup flow to run through the Electron main process, eliminating CORS constraints from the renderer.
- Market pricing logic shifted from "lowest recorded history" to "median current active offers" to ignore historical pricing glitches.
- Components quantities now default to correct bulk amounts (e.g. 1000 for Primers) instead of 1.

### Fixed
- Fixed CodeQL XSS vulnerability when decoding HTML entities in BarcodeEngine.
- Fixed reloading powder parsing for Hodgdon / distributor barcodes.
- Fixed TS compilation errors on release workflow.
- Fixed CORS fetch errors when hitting upcitemdb.
- Fixed UI text scaling for "ADD x rds/lbs/brick" based on dynamic mobile payload parameters.
- Addressed inventory inflation bug where a scanned box of 50 would only add 1 round to the inventory.
