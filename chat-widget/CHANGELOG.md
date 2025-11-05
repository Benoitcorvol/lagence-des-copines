# Changelog

All notable changes to the L'Agence des Copines Chat Widget.

## [2.1.0] - 2025-11-05

### Added
- **Reset Conversation Button** 🔄 in chat header
  - Clears messages and creates new conversation ID
  - Shows new random welcome message
  - Accessible via click or keyboard
- **4 New Tests** for reset functionality (64 total tests)
- Test page `test/test-reset.html` for manual testing

### Changed
- Header layout with flexbox actions container
- Bundle size: 5.84 KB gzipped (vs 5.44 KB)

### Fixed
- Flaky `sleep` test timing in CI

---

## [2.0.0] - 2025-11-05

### Major Refactoring
- **Modular Architecture**: 7 focused modules
- **60+ Tests** with Vitest
- **Vite Build System** with HMR
- **JSDoc** documentation
- Bundle: 5.44 KB gzipped

---

## [1.0.0] - 2025-11-03

### Initial Release
- Shadow DOM Web Component
- All core features (chat, typing, cache, errors)
- Bundle: 5.21 KB gzipped
