## Description
<!-- Provide a clear, concise summary of the changes and motivation behind them. -->

## Type of Change
- [ ] 🐛 Bug fix (non-breaking change fixing an issue)
- [ ] ✨ New feature (non-breaking change adding functionality)
- [ ] ⚡ Performance improvement
- [ ] 🎨 UI/UX styling & responsiveness
- [ ] 🔧 Build / CI/CD / Dependencies

## Pre-Submission Quality Checklist
- [ ] **Automated Tests**: Ran `npm test` (`vitest run`) and all test suites pass.
- [ ] **Linter & Formatting**: Ran `npm run check` (`biome check`) with zero errors.
- [ ] **Production Build**: Ran `npm run build` and client bundle builds cleanly.
- [ ] **Pre-Flight Validation**: Ran `npm run verify:preflight` and all 8 release gates passed.
- [ ] **Rule #7 Strict Emoji Ban**: Zero raw emoji placeholders used in UI markup; dedicated Lucide vector icons or custom SVGs only.
- [ ] **Mobile Sync Compatibility**: Any changes to schemas, `/api/*` routes, or IPC bridges remain backwards-compatible with ArmoryVault Companion.
- [ ] **Documentation**: Documented changes in `CHANGELOG.md` under the appropriate version header.
- [ ] **Zero-Cloud Guarantee**: Confirmed that all firearm records, photos, and encryption keys remain strictly on the local machine.
