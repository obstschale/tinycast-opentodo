# Changelog

Alle wesentlichen Änderungen an diesem Projekt werden hier festgehalten.

Format: [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), Versionierung nach
[Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

_Noch keine Änderungen. Neue Features, Verhaltensänderungen und Fixes kommen hier rein._

## [0.3.0] – 2026-11-10

### Added

- Fällige Todos sind auswählbar und haben zwei Aktionen im ⌘K-Menü: **↵ = Als erledigt markieren**
  (`ot done <id>`, danach Liste neu laden) und **⇧↵ = In Open Todo öffnen** (`open()` auf
  `<server>/?task=<id>`). Beim Tippen springt die Auswahl zurück auf die Eingabezeile, damit das
  Anlegen neuer Todos unverändert bleibt.
- Server-URL für „In Open Todo öffnen" wird lazy aus der lokalen `ot`-Config gelesen (nur `url`), mit
  `ot auth status --json` als Fallback; neue Preference `webBaseUrl` überschreibt sie.
- Unter der Eingabezeile werden die **heute fälligen und überfälligen Todos** des gewählten Workspace
  angezeigt (`ot today --json --workspace <id>`, überfällige zuerst). Die Liste lädt bei jedem
  Workspace-Wechsel neu; bei offline/Fehler entfallen die Zeilen, die Eingabe bleibt unverändert. Nur
  `id`/`title`/`due` werden gelesen, keine Task-Beschreibungen.
- Kontrollierte Auswahl (`selectedItemId` + `onSelectionChange`): Start und jeder Tastendruck setzen sie
  auf die Add-Zeile, ↓/Maus wählen ein fälliges Todo. So bleibt ↵ beim Tippen „neues Todo anlegen".
- Screenshot in der README (`docs/screenshot.png`): Suchleiste in voller Breite mit geöffnetem
  Workspace-Dropdown. Die Workspace-Namen im Bild sind generisch („Personal (Standard)", „Arbeit"),
  damit keine Kontodaten ins öffentliche Repo gelangen.

## [0.2.0] – 2026-11-10

### Added

- Workspace-Dropdown in der Suchleiste: Liste kommt dynamisch aus `ot workspaces --json`, der
  Default-Workspace ist markiert, neue Workspaces erscheinen ohne Konfiguration.
- Auswahl wird in `LocalStorage` gemerkt und beim nächsten Start wiederhergestellt; Workspace-Liste
  wird als Cache gespeichert, damit die Extension auch offline nutzbar bleibt.
- `ot add` erhält `--workspace <id>` für den gewählten Workspace; aktiver Workspace erscheint im
  Untertitel der Zeile und in der Erfolgs-Toast.

### Changed

- Das Kommando ist unabhängig vom `ot`-Profil-Default: ohne Cache/Liste wird kein `--workspace`
  übergeben, eine veraltete gemerkte ID wird beim nächsten erfolgreichen Laden verworfen.
- `package.json` führt jetzt eine `version`; ein Release besteht aus Version + CHANGELOG-Abschnitt +
  Git-Tag/GitHub Release.

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

[Unreleased]: https://github.com/obstschale/tinycast-opentodo/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/obstschale/tinycast-opentodo/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/obstschale/tinycast-opentodo/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/obstschale/tinycast-opentodo/releases/tag/v0.1.0
