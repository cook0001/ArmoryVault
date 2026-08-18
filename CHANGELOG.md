# Changelog

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
