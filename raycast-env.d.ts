/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Pfad zum ot-Client - Optionaler absoluter Pfad zum `ot`-Binary. GUI-Apps übernehmen nicht das PATH des Terminals. Leer lassen, damit die Extension `ot` über PATH und die üblichen Installationsorte (~/go/bin/bin/ot, ~/go/bin/ot, /opt/homebrew/bin/ot, /usr/local/bin/ot) findet. */
  "otPath": string,
  /** Sprachen für --natural - Kommagetrennte Sprachcodes, die als `--lang` an `ot add --natural` übergeben werden. Standard `de,en` (Deutsch + Englisch; Englisch ist immer aktiv). Ein leerer Wert verwendet ebenfalls `de,en`. */
  "lang": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `add-todo` command */
  export type AddTodo = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `add-todo` command */
  export type AddTodo = {}
}

