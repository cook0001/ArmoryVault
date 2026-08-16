# Changelog

## [Unreleased]
### Added
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
- Fixed CORS fetch errors when hitting upcitemdb.
- Fixed UI text scaling for "ADD x rds/lbs/brick" based on dynamic mobile payload parameters.
- Addressed inventory inflation bug where a scanned box of 50 would only add 1 round to the inventory.
