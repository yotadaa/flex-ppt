# Migration Checklist

This checklist records the state of the Flex-PPT migration request.

## Source repository publish

- [x] Build verified before publish: `npm run build` passed in `C:\skripsi\presentation\code-snapshot`.
- [x] H8 final slide audit recorded: `qa/h8-final-slide-audit.json`.
- [x] H8 final targeted screenshots committed.
- [x] Commit created in source repo: `3646ef4 Record H8 final audit and migration plan`.
- [x] Source repo pushed to `origin/main`.
- [x] Temporary Chrome QA profiles were not committed.

## New workspace creation

- [x] Created `C:\skripsi\flex-ppt`.
- [x] Copied `presentation\code-snapshot`.
- [x] Excluded old `.git`.
- [x] Excluded `node_modules`.
- [x] Excluded `dist`.
- [x] Preserved source folders: `src`, `public`, `scripts`.
- [x] Preserved package files and Vite/TypeScript config.

## Docs copied

- [x] Copied `docs\claude-audit.md`.
- [x] Copied `docs\claude-audit-2.md`.
- [x] Copied original planning file as `docs\source-planning-2026-06-05-react-presenter-editor.md`.

## Knowledge docs created

- [x] `docs\README.md`
- [x] `docs\session-knowledge-and-milestones.md`
- [x] `docs\architecture-and-code-map.md`
- [x] `docs\validation-and-qa-playbook.md`
- [x] `docs\next-agent-playbook.md`
- [x] `docs\feature-backlog-and-design-decisions.md`
- [x] `docs\migration-checklist.md`

## Remaining after docs creation

- [x] Run `npm ci` in `C:\skripsi\flex-ppt`. Validation: install added 97 packages, audited 98 packages, and found 0 vulnerabilities.
- [x] Run `npm run build` in `C:\skripsi\flex-ppt`. Validation: TypeScript and Vite build passed with 623 modules transformed.
- [ ] Initialize new git repository in `C:\skripsi\flex-ppt`.
- [ ] Commit baseline app and docs in the new repository.
- [ ] Confirm `git status -sb` is clean in `flex-ppt`.
