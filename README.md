# tinycast-opentodo

[Tinycast](https://tinycast.dev/)-Extension zum schnellen Hinzufügen eines Todos zu
[Open Todo](https://open-todo.app/) – mit Blick auf die heute fälligen und überfälligen Todos des
gewählten Workspace direkt darunter. Sie ruft den lokal installierten
[`ot`-Client](https://open-todo.app/docs/cli/) auf:

```sh
ot add --natural "<deine Eingabe>" --workspace <workspace-id> --lang de,en
```

Repository: <https://github.com/obstschale/tinycast-opentodo>

![Suchleiste in voller Breite mit geöffnetem Workspace-Dropdown](docs/screenshot.png)

*Todo eintippen, mit **⌘P** den Workspace wählen, **↵** – das Todo landet direkt in Open Todo.
Fällige Todos erscheinen darunter (im Screenshot noch nicht enthalten).*

## Warum ein `view`-Kommando?

`add-todo` ist ein **`view`-Kommando mit eigener Suchleiste** – bewusst ohne `arguments` im Manifest:

- **Volle Breite.** Die Suchleiste eines View-Kommandos ist das normale, breite Suchfeld des Launchers.
  Manifest-`arguments` erzeugen dagegen die kleinen ovalen Felder neben der Suche, die bei langem Text
  nicht mitwachsen und den Text abschneiden.
- **Shortcut öffnet, statt sofort auszuführen.** Ein globaler Shortcut auf ein `no-view`-Kommando führt
  es sofort aus (mit leerem Argument). Ein `view`-Kommando öffnet beim Shortcut seinen Screen: die
  Suchleiste ist fokussiert, man kann sofort lostippen. Ein zweites Drücken schließt ihn wieder.

Extensions können den Text der *Root-Suche* nicht direkt auslesen. Wer dort tippen möchte, kann den
optionalen [Quicklink-Fallback](#optional-in-der-root-suche-tippen) nutzen.

## Projektstruktur

```
tinycast-opentodo/
├── package.json          # Raycast-/Tinycast-Manifest (Kommando + Preferences)
├── src/
│   ├── add-todo.tsx      # view-Kommando: Suchleiste, Dropdown, Add-Zeile + fällige Todos
│   └── ot.ts             # ot-Aufruf, Workspaces, listDueTodos(), Pfad-Auflösung
├── tsconfig.json
├── assets/icon.png       # offizielles OpenTodo-Icon, 512×512 PNG
├── raycast-env.d.ts      # von `ray build` generierte Typen
├── AGENTS.md             # Konventionen für die Arbeit am Projekt
├── CHANGELOG.md          # wird bei jedem Feature gepflegt
└── dist/                 # gebautes, installierbares Bundle (ist committet)
    ├── package.json
    ├── add-todo.js
    └── assets/icon.png
```

## Voraussetzungen

- `ot` ist installiert und eingeloggt (`ot auth status`), und der Server ist erreichbar – `ot` ist ein
  Online-Client. Siehe [CLI-Doku](https://open-todo.app/docs/cli/).
- Für den Build: Node + npm. Für die **Installation** braucht Tinycast kein Node, es kopiert nur die
  fertigen Dateien aus `dist/`.

## Bauen

```sh
cd ~/Code/tinycast-opentodo
npm install
npm run build     # ray build -e dist -o dist -I
```

`dist/` ist absichtlich versioniert, damit ein Clone direkt per „Add from folder" installiert werden
kann. **Vor jedem Commit neu bauen**, wenn sich `src/` oder `package.json` geändert haben.

## Installieren

`Einstellungen → Extensions → Install → Add from folder` und den Ordner `dist/` auswählen. Tinycast
kopiert dabei `package.json`, die gebauten Kommandos und `assets/` nach
`~/Library/Application Support/com.tinycast.app/extensions/<extension-name>/`.

Alternativ (entspricht demselben Kopiervorgang) den Inhalt von `dist/` direkt dorthin kopieren. Danach
**Tinycast neu starten**, damit der Ordner eingescannt wird. Extensions müssen global eingeschaltet sein.

> Aus Ordnern/GitHub installierte Extensions aktualisiert Tinycast nicht automatisch. Nach einer
> Änderung: neu bauen und erneut installieren bzw. `dist/` erneut kopieren.

## Benutzung

**Mit Shortcut (empfohlen):** In `Einstellungen → Extensions → Open Todo Quick Add` dem Kommando
„Todo hinzufügen" einen Shortcut geben. Drücken → der Launcher öffnet sich mit fokussierter Suchleiste →
bei Bedarf rechts im Suchfeld den Workspace wählen → Todo eintippen → `↵`. Danach schließt sich das
Fenster und eine Toast bestätigt (oder meldet den Fehler).

**Ohne Shortcut:** Im Launcher `Todo` suchen, „Todo hinzufügen" mit `↵` öffnen, dann Todo eintippen und
`↵`.

Beispiele, die `ot add --natural` versteht:

```
Morgen Milch kaufen #home @einkauf p2
Call the plumber tomorrow at 9
Water plants every Monday remind me at 8 #home
Freitag Steuererklärung abgeben p1
```

`#projekt`, `@label`, `p1`–`p4`, `morgen`/`tomorrow`, `every …`, `remind me …`, `+30m` usw. parst `ot`
(siehe [`--natural`](https://open-todo.app/docs/cli/#add-and-edit)). Der Text geht als **ein** Argument
ohne Shell an `ot` – Anführungszeichen, `$()` und Backticks werden nicht interpretiert.

## Fällige Todos unter der Eingabe

Unter der Eingabezeile listet die Extension die **heute fälligen und überfälligen Todos** des gerade
gewählten Workspace auf – gelesen mit `ot today --json --workspace <id>`, überfällige zuerst. Jede Zeile
zeigt Titel und Fälligkeit (`heute · 10.11.` bzw. `überfällig · 09.11.`).

Die **Eingabe bleibt unverändert**: die erste Zeile ist immer „Todo eintippen …" bzw. der getippte
Text, und `↵` legt weiterhin genau dieses Todo an. Sobald man tippt, springt die Auswahl automatisch
auf diese Zeile zurück. Mit **↓** (oder per Maus) wählt man stattdessen ein fälliges Todo aus.

Beim Wechsel des Workspace wird die Liste neu geladen. Ist der Server nicht erreichbar oder ist nichts
fällig, erscheinen einfach keine zusätzlichen Zeilen – die Eingabe funktioniert trotzdem. Es werden nur
`id`, `title` und `due` aus der Antwort gelesen; Task-Beschreibungen können Kundendaten enthalten und
werden nie angezeigt oder gespeichert.

### Aktionen auf einem gewählten Todo

| Taste | Aktion |
| --- | --- |
| **↵** | **Als erledigt markieren** – `ot done <id>`, danach verschwindet das Todo aus der Liste und die Auswahl springt zurück auf die Eingabe. |
| **⇧↵** | **In Open Todo öffnen** – öffnet `<server>/?task=<id>` im Browser. |

Beide Aktionen stehen zusätzlich im **⌘K-Menü** („Todo-Aktionen"). `⇧↵` ist ein alternatives Shortcut
der zweiten Aktion; Raycast/Tinycast zeigt solche Alternativen im Aktionsmenü nicht zwingend an, sie
funktionieren aber. Auf der zweiten Aktion liegt standardmäßig **⌘↵**, das je nach Tinycast-Version
zusätzlich greifen kann.

Die Server-URL wird erst beim Öffnen ermittelt: aus der lokalen `ot`-Config (nur das Feld `url`, sofort
und offline) oder als Fallback aus `ot auth status --json`. Über die Preference **Web-URL von Open Todo**
lässt sie sich überschreiben – sinnvoll, wenn die Weboberfläche unter einer anderen Adresse läuft als
die API.

## Workspace-Auswahl

Rechts in der Suchleiste sitzt ein **Workspace-Dropdown**. Die Liste kommt bei jedem Öffnen aus
`ot workspaces --json` (nur lesend, ~65 ms) – es muss nichts konfiguriert werden, und neue Workspaces
erscheinen automatisch. Der als `default` markierte Workspace ist mit „(Standard)" beschriftet und ist
die Vorauswahl.

Die **letzte Auswahl wird in `LocalStorage` gemerkt** und beim nächsten Start wiederhergestellt. Im
Normalfall tippst du also einfach los; nur beim Wechsel einmal das Dropdown öffnen. Der aktive
Workspace steht zusätzlich im Untertitel der Zeile und in der Erfolgs-Toast.

**Per Tastatur:** **⌘P** öffnet das Dropdown (Raycast-/Tinycast-Standard für Suchleisten-Dropdowns),
dann mit **↑/↓** oder durch Tippen filtern und mit **↵** übernehmen, **esc** bricht ab. `tab` wechselt
in Tinycast zwischen den Screens, nicht in das Dropdown. Das Dropdown hat kein eigenes
`shortcut`-Prop, die Taste ist also nicht konfigurierbar.

Beim Anlegen bekommt `ot add` ein `--workspace <id>` (ID statt Name, damit Umbenennungen nichts
kaputtmachen). Ohne Auswahl nutzt `ot` seinen Default-Workspace. Das gleiche Flag bekommt
`ot today --json`, deshalb zeigt die Liste darunter genau die Todos des gewählten Workspace und lädt
bei einem Wechsel automatisch neu.

**Offline / Server nicht erreichbar:** Die zuletzt geladene Liste wird als JSON in `LocalStorage`
gecacht. Schlägt `ot workspaces --json` fehl, bleibt der Cache aktiv; ohne Cache wird gar kein
`--workspace` übergeben. Eine Auswahl, die es nicht mehr gibt, wird beim nächsten erfolgreichen Laden
verworfen und auf den Default zurückgesetzt.

Storage-Keys: `opentodo.workspaces` (JSON-Array) und `opentodo.workspaceId`.

## Optional: in der Root-Suche tippen

Wer den Todo-Text in die normale Root-Suche tippen will, kann einen **Quicklink** als
„Use … with"-Fallback anlegen (`Einstellungen → Quicklinks`, Feature ggf. einschalten):

| Feld | Wert |
| --- | --- |
| Name | `Open Todo` |
| Link | `tinycast://extensions/obstschale/opentodo-quick-add/add-todo?fallbackText={argument}` |

Dann erscheint bei beliebigem Suchtext unten „Use **Open Todo** with"; der getippte Text wird als
`fallbackText` übergeben und füllt die Suchleiste des Kommandos vor. Ein `↵` fügt das Todo hinzu.
Falls Tinycast den `tinycast://`-Link nicht annimmt, dieselbe URL mit `raycast://` probieren; ein Link
mit Text kann einmalig um Erlaubnis fragen („Always Allow").

Der Owner-Anteil im Link ist der `author` aus `package.json`.

## Einstellungen

`Einstellungen → Extensions → Open Todo Quick Add` (oder `⌘K → Configure Extension`):

| Preference | Bedeutung | Default |
| --- | --- | --- |
| **Pfad zum `ot`-Client** | Optionaler absoluter Pfad. GUI-Apps übernehmen nicht das `PATH` des Terminals. Leer lassen → die Extension probt `ot` über `PATH` sowie `~/go/bin/bin/ot`, `~/go/bin/ot`, `/opt/homebrew/bin/ot` und `/usr/local/bin/ot`. | *(leer)* |
| **Sprachen für `--natural`** | Wird als `--lang` übergeben, damit deutsche Formulierungen wie „morgen" erkannt werden. Englisch ist immer aktiv. Leer → ebenfalls `de,en`. | `de,en` |
| **Web-URL von Open Todo** | Optionale Basis-URL der Weboberfläche für „In Open Todo öffnen". Leer → die Extension liest die URL aus der lokalen `ot`-Config bzw. `ot auth status --json`. Setzen, wenn Web-App und API verschiedene Adressen haben. | *(leer)* |

Es werden keine Zugangsdaten gespeichert; `ot` liest seinen Token selbst aus seiner Config.

## Fehlersuche

| Meldung | Ursache |
| --- | --- |
| `ot nicht gefunden` | Pfad in den Einstellungen prüfen; `which ot` im Terminal vergleichen. |
| `ot: …` | `ot` ist gelaufen, aber der Aufruf schlug fehl (Server nicht erreichbar, Token abgelaufen, …). `ot auth status` prüfen. |
| `Nicht erledigt` / `Nicht geöffnet` | `ot done` schlug fehl, bzw. es konnte keine Server-URL ermittelt werden – dann die Preference **Web-URL von Open Todo** setzen. |
| `unknown workspace "…"` | Die gemerkte ID gibt es nicht mehr. Beim nächsten erfolgreichen Laden wird sie automatisch verworfen; zur Not `LocalStorage` leeren bzw. Workspace neu wählen. |
| Dropdown fehlt | `ot workspaces --json` war nicht erreichbar und es gibt noch keinen Cache. Beim nächsten Start mit Serverkontakt erscheint es; bis dahin gilt der `ot`-Default. |
| Keine fälligen Todos in der Liste | Nichts heute fällig/überfällig, Workspace gewechselt oder `ot today --json` nicht erreichbar. Die Eingabezeile bleibt davon unberührt. |
| Keine Reaktion | Extensions global aus? Tinycast nach der Installation neu gestartet? |

Ohne echtes Todo testen: `ot add --natural "Morgen Milch kaufen" --lang de,en --dry-run`.

## Icon

`assets/icon.png` ist das unveränderte offizielle OpenTodo-App-Icon
[`brand/png/icon-512.png`](https://github.com/OpenTodoApp/OpenTodo/blob/main/brand/png/icon-512.png)
aus dem [Brand-Kit](https://github.com/OpenTodoApp/OpenTodo/tree/main/brand), 512×512 RGBA-PNG
(SHA-256 `e8646027caabce05f35f882a526221f9b63ca67fcb67879233cd5be3d7f3d790`). PNG statt SVG, weil das
Manifest ein PNG mit mindestens 512×512 px erwartet. Die Marke steht unter AGPL-3.0 (siehe `LICENSE`
im OpenTodo-Repository).

## Deinstallieren

`Einstellungen → Extensions` → Zeile der Extension → Papierkorb, oder den Ordner
`~/Library/Application Support/com.tinycast.app/extensions/opentodo-quick-add/` löschen.
