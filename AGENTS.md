# AGENTS.md

Anleitung für alle, die an diesem Repo arbeiten (Menschen und Coding-Agenten).

## Was das Projekt ist

Eine [Tinycast](https://tinycast.dev/)-Extension (technisch eine normale Raycast-Extension), die ein Todo
aus dem Launcher an [Open Todo](https://open-todo.app/) übergibt, indem sie den lokal installierten
[`ot`](https://open-todo.app/docs/cli/)-Client aufruft:

```sh
ot add --natural "<todo>" --lang de,en
```

Tinycast führt Raycast-Extensions nativ in JavaScriptCore aus – nicht in Node/Electron. Es stellt
`@raycast/api`, `react` und Node-Builtins (`child_process`, `fs`, `os`, `buffer`, …) bereit. Das gebaute
Bundle muss daher nur diese Module `require`n; eigene `node_modules` sind nicht nötig.

## Aufbau

| Datei | Zweck |
| --- | --- |
| `package.json` | Manifest: ein `view`-Kommando `add-todo`, zwei Preferences |
| `src/add-todo.tsx` | React-`List` mit voller Suchleiste; `↵` ruft `addTodo` |
| `src/ot.ts` | Einzige Stelle, die `ot` aufruft; Workspace-Liste, Pfad-Auflösung, `AddResult` |
| `assets/icon.png` | offizielles OpenTodo-Icon (siehe unten) |
| `dist/` | gebautes Bundle, **absichtlich versioniert**, damit ein Clone direkt installierbar ist |
| `raycast-env.d.ts` | von `ray build` generiert – nie von Hand ändern |
| `CHANGELOG.md` | Änderungsprotokoll |

## Unveränderliche IDs

**`package.json` → `name` (`opentodo-quick-add`) und `commands[].name` (`add-todo`) dürfen sich nicht
ändern.** Tinycast verknüpft damit globale Shortcuts, Aliase, Favoriten, Learned Ranking, Preferences,
Storage und Deeplinks (`extension:opentodo-quick-add/add-todo`). Eine Umbenennung verwaisen diese
Einstellungen. Der *Projektordner* / Repo-Name darf dagegen beliebig sein.

Anzeigetexte (`title`, `description`) sind frei änderbar. `author` ist der Owner-Anteil in
`raycast://`-/`tinycast://`-Links; bei einer Änderung die Deeplink-Beispiele in der README mitziehen.

## Wichtige Designentscheidungen

- **`mode: "view"`, keine `arguments`.** Manifest-Argumente erzeugen in Tinycast kleine ovale Felder
  neben der Suche, die bei langem Text nicht mitwachsen. Die Suchleiste eines `view`-Kommandos nutzt
  die volle Breite. Außerdem führt ein globaler Shortcut ein `no-view`-Kommando sofort aus; ein
  `view`-Kommando öffnet stattdessen seinen Screen und ist sofort tipbereit.
- **`fallbackText`** aus `LaunchProps` füllt die Suchleiste vor (Deeplinks / Quicklink-Fallback).
  Nicht automatisch absenden – sonst könnte ein Aufruf aus der Root-Suche ungewollt ein Todo anlegen.
- **Nie eine Shell benutzen.** `spawn(binary, args)` ohne `shell`; der Todo-Text ist genau ein Argument.
  So bleiben `"`, `$()`, Backticks usw. harmloser Text.
- **`--lang de,en`** ist der Fallback, falls eine Runtime den Manifest-Default nicht anwendet. Ohne das
  würden deutsche Formulierungen wie „morgen" nicht erkannt.
- **`ot`-Pfad:** GUI-Apps erben nicht das Terminal-`PATH`. Der Manifest-Default bleibt **leer**;
  `src/ot.ts` probt `ot` auf `PATH` sowie übliche Orte. Ein konfigurierter absoluter Pfad gewinnt.
- **Workspaces:** `listWorkspaces()` liest `ot workspaces --json` (nur `id`/`name`/`default`),
  `pickWorkspace()` liefert gemerkte Auswahl → Default → erstes Element. Die Auswahl liegt als **ID**
  in `LocalStorage` (`opentodo.workspaceId`), die Liste als JSON-String (`opentodo.workspaces`);
  `LocalStorage.Value` erlaubt nur Skalare, also keine Objekte/Arrays direkt speichern. Beim Öffnen
  erst den Cache anzeigen, dann im Hintergrund aktualisieren; leeres Ergebnis = offline, Cache behalten,
  und ohne Cache kein `--workspace` übergeben. `addTodo()` hängt `--workspace <id>` an, damit die
  Extension-Auswahl unabhängig vom `ot`-Profil-Default gilt. Niemals Workspace-Namen hardcoded.
- Nach Erfolg: `closeMainWindow()` + Success-Toast. Nach Fehler: Failure-Toast und im Screen bleiben,
  damit der Text korrigiert werden kann.

## Keine privaten Daten im Repo

Das Repo ist **öffentlich**. Niemals committen:

- absolute Home-Pfade (`/Users/…`), lokale Usernamen, Maschinennamen, Hostnamen
- API-Tokens, Passwörter, `ot`-Tokens, Server-URLs, E-Mail-Adressen
- Inhalte aus `~/Library/Application Support/com.tinycast.app/` (Preferences, `extension-data/`,
  Shortcuts) oder aus der `ot`-Config

Der `ot`-Pfad ist eine **Preference**, kein Default im Manifest. Die Commit-E-Mail dieses Repos ist
absichtlich die GitHub-Noreply-Adresse.

Vor dem Commit prüfen:

```sh
grep -RInE '/Users/|ot_[A-Za-z0-9]{10,}|token|password|@[a-z0-9.-]+\.[a-z]{2,}' \
  --exclude-dir=node_modules --exclude-dir=.git --exclude='*.png' .
```

## Build & Test

```sh
npm install
npm run build        # ray build -e dist -o dist -I -> dist/ + raycast-env.d.ts
```

**Vor jedem Commit neu bauen**, wenn `src/` oder `package.json` geändert wurden – `dist/` ist versioniert
und muss zum Quellstand passen. Source-Maps (`*.map`) sind ignoriert und werden von Tinycast ohnehin
nicht kopiert.

Tests erzeugen **keine echten Todos**:

- Realer Aufruf mit `--dry-run`: `ot add --natural "Morgen Milch kaufen" --lang de,en --dry-run`
- Für Logiktests `src/ot.ts` mit esbuild nach CJS bundeln (`external: ["@raycast/api"]`), `@raycast/api`
  per `Module._load` mocken und ein Fake-`ot`-Skript verwenden, das seine Argumente protokolliert.
- Das gebaute `dist/add-todo.js` lässt sich mit gemocktem `@raycast/api` / `react` / `react/jsx-runtime`
  zumindest als Smoke-Test laden.

## Installation (zum Verifizieren)

Inhalt von `dist/` nach
`~/Library/Application Support/com.tinycast.app/extensions/opentodo-quick-add/` kopieren (nur
`package.json`, `*.js`, `assets/` – keine `.map`), danach Tinycast neu starten. Alternativ
`Einstellungen → Extensions → Install → Add from folder` mit dem `dist/`-Ordner.

## CHANGELOG.md ist Pflicht

**Jedes neue Feature, jede Verhaltensänderung und jeder Fix braucht einen Eintrag in `CHANGELOG.md`**
(Format: [Keep a Changelog](https://keepachangelog.com/), Abschnitt `## [Unreleased]`, Kategorien
`Added` / `Changed` / `Fixed` / `Removed`). Bei einem Release den `Unreleased`-Abschnitt in eine
Version mit Datum überführen.

Das gilt ausdrücklich auch für neue Kommandos, neue Preferences, Änderungen am `ot`-Aufruf und
Änderungen am Manifest. Ein PR ohne CHANGELOG-Eintrag ist unvollständig.

## Sprache & Stil

- Nutzersichtbare Texte (Toasts, Platzhalter, Manifest-Titel/-Beschreibungen) und Doku auf **Deutsch**.
- Code, Bezeichner und Commit-Messages auf Englisch; Kommentare auf Englisch.
- Keine Abhängigkeiten ohne Notwendigkeit; die Extension soll ohne gebündelte `node_modules` laufen.
- `assets/icon.png` ist das offizielle OpenTodo-Brand-Asset (AGPL-3.0), nicht von Hand verändern.
