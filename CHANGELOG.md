# Changelog

Alle wesentlichen Änderungen an diesem Projekt werden hier festgehalten.

Format: [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), Versionierung nach
[Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

_Noch keine Änderungen. Neue Features, Verhaltensänderungen und Fixes kommen hier rein._

## [0.1.0] – 2026-11-10

### Added

- Erste Version: Tinycast-/Raycast-Extension, die ein Todo per `ot add --natural` an Open Todo übergibt.
- Kommando `add-todo` als **`view`-Kommando** mit Suchleiste in voller Breite; `↵` legt das Todo an,
  danach Success-Toast und Schließen des Launchers.
- Unterstützung für `fallbackText` aus Deeplinks (Quicklink-Fallback „Use … with").
- Preferences `otPath` (optionaler Pfad zum `ot`-Binary mit automatischer Suche) und `lang`
  (Standard `de,en` für deutsche `--natural`-Phrasen).
- Sichere Argumentübergabe ohne Shell via `child_process.spawn`.
- Offizielles OpenTodo-Icon (`brand/png/icon-512.png`) als Extension-Icon.
- `AGENTS.md` mit Projekt- und CHANGELOG-Konventionen, `README.md`, Build-Skript (`ray build`).

### Changed

- Projektordner/Repo von `tinycast-opentodo-quick-add` nach `tinycast-opentodo` umbenannt, damit weitere
  Funktionen Platz haben. Extension-ID `opentodo-quick-add` und Kommando-ID `add-todo` bleiben bewusst
  stabil, um Shortcuts und Preferences nicht zu verwaisen.
- Kein hartkodierter lokaler Pfad mehr im Manifest; `author` ist der öffentliche GitHub-Handle.

[Unreleased]: https://github.com/obstschale/tinycast-opentodo/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/obstschale/tinycast-opentodo/releases/tag/v0.1.0
