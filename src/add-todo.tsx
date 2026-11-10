import {
  Action,
  ActionPanel,
  closeMainWindow,
  Icon,
  List,
  LocalStorage,
  showToast,
  Toast,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { addTodo, listWorkspaces, pickWorkspace, Workspace } from "./ot";

// `LaunchProps<T>` in this API version doesn't declare `fallbackText`, so we
// describe just the shape we read. It is set for fallback / deeplink launches.
type Props = {
  fallbackText?: string;
};

const WORKSPACES_KEY = "opentodo.workspaces";
const WORKSPACE_ID_KEY = "opentodo.workspaceId";

/**
 * A `view` command: its search bar is the launcher's normal, full-width text
 * field (unlike the small oval chips that manifest `arguments` produce).
 * A global shortcut opens this screen ready for typing instead of running the
 * command immediately.
 */
export default function Command(props: Props) {
  // A deeplink / quicklink may prefill the todo via `fallbackText`.
  const [searchText, setSearchText] = useState(props.fallbackText ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1. Cached values first, so the dropdown is usable immediately.
      try {
        const cached = await LocalStorage.getItem<string>(WORKSPACES_KEY);
        if (!cancelled && cached) {
          const parsed: unknown = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setWorkspaces(parsed as Workspace[]);
          }
        }
      } catch {
        // A broken cache is harmless: the fresh read below replaces it.
      }

      let savedId: string | undefined;
      try {
        savedId = await LocalStorage.getItem<string>(WORKSPACE_ID_KEY);
      } catch {
        // Ignore storage errors.
      }
      if (!cancelled && savedId) setSelectedId(savedId);

      // 2. Refresh in the background. An empty result (offline) keeps the cache.
      const fresh = await listWorkspaces();
      if (cancelled || fresh.length === 0) return;

      setWorkspaces(fresh);
      try {
        await LocalStorage.setItem(WORKSPACES_KEY, JSON.stringify(fresh));
      } catch {
        // Persistence is best-effort.
      }

      if (savedId && !fresh.some((workspace) => workspace.id === savedId)) {
        // The remembered workspace no longer exists -> fall back to the default.
        setSelectedId(undefined);
        try {
          await LocalStorage.removeItem(WORKSPACE_ID_KEY);
        } catch {
          // Ignore storage errors.
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeWorkspace = pickWorkspace(workspaces, selectedId);
  const todo = searchText.trim();

  async function selectWorkspace(id: string) {
    setSelectedId(id);
    try {
      await LocalStorage.setItem(WORKSPACE_ID_KEY, id);
    } catch {
      // Persistence is best-effort; the in-memory choice still applies.
    }
  }

  async function submit() {
    if (!todo || isLoading) return;
    setIsLoading(true);
    const result = await addTodo(todo, activeWorkspace?.id);
    setIsLoading(false);

    if (result.ok) {
      await closeMainWindow();
      await showToast({
        style: Toast.Style.Success,
        title: "Todo hinzugefügt",
        message: activeWorkspace
          ? `${activeWorkspace.name} · ${result.message}`
          : result.message,
      });
    } else {
      await showToast({
        style: Toast.Style.Failure,
        title: "Todo nicht hinzugefügt",
        message: result.message,
      });
    }
  }

  return (
    <List
      filtering={false}
      isLoading={isLoading}
      searchBarPlaceholder="Todo eintippen, z. B. Morgen Milch kaufen #home p2"
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarAccessory={
        workspaces.length > 0 ? (
          <List.Dropdown
            tooltip="Workspace"
            storeValue={false}
            value={activeWorkspace?.id ?? ""}
            defaultValue={activeWorkspace?.id ?? ""}
            onChange={(id) => void selectWorkspace(id)}
          >
            {workspaces.map((workspace) => (
              <List.Dropdown.Item
                key={workspace.id}
                value={workspace.id}
                title={workspace.default ? `${workspace.name} (Standard)` : workspace.name}
              />
            ))}
          </List.Dropdown>
        ) : undefined
      }
    >
      <List.Item
        icon={Icon.Plus}
        title={todo || "Todo eintippen …"}
        subtitle={
          todo
            ? `↵ → ${activeWorkspace?.name ?? "Standard-Workspace"}`
            : "ot add --natural"
        }
        actions={
          <ActionPanel>
            <Action title="Todo hinzufügen" icon={Icon.Plus} onAction={submit} />
          </ActionPanel>
        }
      />
    </List>
  );
}
