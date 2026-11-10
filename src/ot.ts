import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { getPreferenceValues } from "@raycast/api";

interface Preferences {
  otPath: string;
  lang: string;
}

export interface Workspace {
  id: string;
  name: string;
  default: boolean;
}

interface RunResult {
  code: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
}

export interface AddResult {
  ok: boolean;
  message: string;
}

function decode(chunk: Uint8Array | string): string {
  return typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");
}

/** Runs `ot` without a shell, so quotes, `$()` and backticks stay plain text. */
function run(binary: string, args: string[]): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(binary, args);
    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (result: RunResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    child.stdout?.on("data", (chunk: Uint8Array | string) => {
      stdout += decode(chunk);
    });
    child.stderr?.on("data", (chunk: Uint8Array | string) => {
      stderr += decode(chunk);
    });
    child.on("error", (error) => finish({ code: null, stdout, stderr, error }));
    child.on("close", (code) => finish({ code, stdout, stderr }));
    // Some runtimes only emit "exit"; give buffered stream data a moment.
    child.on("exit", (code) => {
      setTimeout(() => finish({ code, stdout, stderr }), 50);
    });
  });
}

/**
 * GUI apps don't inherit the terminal's PATH: try the configured absolute path
 * first, then `ot` on PATH, then the usual `go install` / Homebrew locations.
 */
function otCandidates(configured?: string): string[] {
  const home = homedir();
  const candidates = [
    configured?.trim(),
    "ot",
    `${home}/go/bin/bin/ot`,
    `${home}/go/bin/ot`,
    "/opt/homebrew/bin/ot",
    "/usr/local/bin/ot",
  ].filter((value): value is string => Boolean(value));

  const unique = Array.from(new Set(candidates));
  const configuredPath = configured?.trim();
  if (configuredPath && existsSync(configuredPath)) {
    return [configuredPath, ...unique.filter((value) => value !== configuredPath)];
  }
  return unique;
}

/** Runs the first available `ot` binary with the given arguments. */
async function runOt(args: string[]): Promise<RunResult | undefined> {
  const preferences = getPreferenceValues<Preferences>() ?? ({} as Preferences);
  let result: RunResult | undefined;
  for (const binary of otCandidates(preferences.otPath)) {
    result = await run(binary, args);
    // A spawn error means "binary not here" -> try the next candidate.
    // A non-zero exit code still means ot ran, so don't retry.
    if (!result.error) break;
  }
  return result;
}

function firstLine(value: string): string {
  return value.trim().split("\n")[0]?.trim() ?? "";
}

/** Reads the account's workspaces. Returns [] on any failure (e.g. offline). */
export async function listWorkspaces(): Promise<Workspace[]> {
  const result = await runOt(["workspaces", "--json"]);
  if (!result || result.error || result.code !== 0) return [];

  try {
    const parsed: unknown = JSON.parse(result.stdout);
    if (!Array.isArray(parsed)) return [];

    const workspaces: Workspace[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const entry = item as Record<string, unknown>;
      if (typeof entry.id !== "string" || typeof entry.name !== "string") continue;
      workspaces.push({
        id: entry.id,
        name: entry.name,
        default: entry.default === true,
      });
    }
    return workspaces;
  } catch {
    return [];
  }
}

/** The remembered workspace, else the account default, else the first one. */
export function pickWorkspace(
  workspaces: Workspace[],
  selectedId?: string,
): Workspace | undefined {
  return (
    workspaces.find((workspace) => workspace.id === selectedId) ??
    workspaces.find((workspace) => workspace.default) ??
    workspaces[0]
  );
}

/** Adds one task through `ot add --natural <text> [--workspace <id>] --lang <lang>`. */
export async function addTodo(todo: string, workspaceId?: string): Promise<AddResult> {
  const text = todo.trim();
  if (!text) {
    return { ok: false, message: "Bitte ein Todo eintippen." };
  }

  const preferences = getPreferenceValues<Preferences>() ?? ({} as Preferences);

  const args = ["add", "--natural", text];
  if (workspaceId) {
    args.push("--workspace", workspaceId);
  }
  // Fall back to de,en so German quick-add phrases work even when a runtime
  // doesn't apply the manifest's default preference value.
  const lang = preferences.lang?.trim() || "de,en";
  args.push("--lang", lang);

  const result = await runOt(args);
  if (!result || result.error) {
    return {
      ok: false,
      message: "ot nicht gefunden – Pfad in den Extension-Einstellungen prüfen.",
    };
  }

  if (result.code === 0) {
    // `ot add` prints the new task's id on stdout.
    const id = firstLine(result.stdout);
    return { ok: true, message: id && id.length < 60 ? `ID ${id}` : text };
  }

  return {
    ok: false,
    message: firstLine(result.stderr || result.stdout) || `ot beendet mit Code ${result.code}`,
  };
}
