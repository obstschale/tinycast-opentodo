import {
  Action,
  ActionPanel,
  closeMainWindow,
  getPreferenceValues,
  Icon,
  List,
  LocalStorage,
  open,
  showToast,
  Toast,
} from "@raycast/api";
import { useEffect, useState } from "react";
import {
  addTodo,
  completeTodo,
  DueTodo,
  getServerUrl,
  listDueTodos,
  listWorkspaces,
  pickWorkspace,
  taskWebUrl,
  Workspace,
} from "./ot";

// `LaunchProps<T>` in this API version doesn't declare `fallbackText`, so we
// describe just the shape we read. It is set for fallback / deeplink launches.
type Props = {
  fallbackText?: string;
};

interface WebPreferences {
  webBaseUrl?: string;
}

const WORKSPACES_KEY = "opentodo.workspaces";
const WORKSPACE_ID_KEY = "opentodo.workspaceId";
const NEW_TODO_ID = "new-todo";

// The second action gets an explicit ⇧↵ shortcut; Raycast assigns ⌘↵ to the
// second action by default, which this overrides (Tinycast honours action
// shortcuts). ↵ always runs the first action.

function dueLabel(task: DueTodo): string {
  if (!task.dueDate) return "ohne Datum";
  const [, month, day] = task.dueDate.split("-");
  const short = `${day}.${month}.`;
  return task.overdue ? `überfällig · ${short}` : `heute · ${short}`;
}

/**
 * A `view` command: its search bar is the launcher's normal, full-width text
 * field (unlike the small oval chips that manifest `arguments` produce).
 * A global shortcut opens this screen ready for typing instead of running the
 * command immediately. The first row stays the "add this todo" row; tasks due
 * today / overdue are listed below it and can be selected for actions.
 */
export default function Command(props: Props) {
  // A deeplink / quicklink may prefill the todo via `fallbackText`.
  const [searchText, setSearchText] = useState(props.fallbackText ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [dueTodos, setDueTodos] = useState<DueTodo[]>([]);
  const [isLoadingTodos, setIsLoadingTodos] = useState(false);
  const [focusedId, setFocusedId] = useState<string>(NEW_TODO_ID);

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

  // Reload the due list whenever the selected workspace changes. An empty
  // result (offline, or nothing due) simply hides the informational rows.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoadingTodos(true);
      try {
        const tasks = await listDueTodos(activeWorkspace?.id);
        if (!cancelled) setDueTodos(tasks);
      } finally {
        if (!cancelled) setIsLoadingTodos(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeWorkspace?.id]);

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

  async function markDone(id: string) {
    const result = await completeTodo(id, activeWorkspace?.id);
    if (!result.ok) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Nicht erledigt",
        message: result.message,
      });
      return;
    }
    await showToast({
      style: Toast.Style.Success,
      title: "Erledigt",
      message: "Todo als erledigt markiert",
    });
    // Back to the input row, then reload so the completed task disappears.
    setFocusedId(NEW_TODO_ID);
    setDueTodos(await listDueTodos(activeWorkspace?.id));
  }

  async function openInOpenTodo(id: string) {
    const configured = getPreferenceValues<WebPreferences>().webBaseUrl?.trim();
    // Resolve lazily: the config read is instant, the CLI fallback is not.
    const base = configured || (await getServerUrl());
    if (!base) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Nicht geöffnet",
        message: "Keine Web-URL – `ot auth status` prüfen oder in den Einstellungen setzen.",
      });
      return;
    }
    await open(taskWebUrl(base, id));
  }

  const items = [
    <List.Item
      key={NEW_TODO_ID}
      id={NEW_TODO_ID}
      icon={Icon.Plus}
      title={todo || "Todo eintippen …"}
      subtitle={
        todo
          ? `↵ → ${activeWorkspace?.name ?? "Standard-Workspace"}`
          : "ot add --natural"
      }
      actions={
        <ActionPanel title="Neues Todo">
          <Action title="Todo hinzufügen" icon={Icon.Plus} onAction={submit} />
        </ActionPanel>
      }
    />,
    ...dueTodos.map((task) => (
      <List.Item
        key={task.id}
        id={task.id}
        icon={task.overdue ? Icon.Exclamationmark : Icon.Clock}
        title={task.title}
        subtitle={dueLabel(task)}
        actions={
          <ActionPanel title="Todo-Aktionen">
            <Action
              title="Als erledigt markieren"
              icon={Icon.CheckCircle}
              onAction={() => void markDone(task.id)}
            />
            <Action
              title="In Open Todo öffnen"
              icon={Icon.Globe}
              shortcut={{ modifiers: ["shift"], key: "return" }}
              onAction={() => void openInOpenTodo(task.id)}
            />
          </ActionPanel>
        }
      />
    )),
  ];

  return (
    <List
      filtering={false}
      isLoading={isLoading || isLoadingTodos}
      // Typing always means "new todo": keep ↵ on the add row. Selecting a
      // todo row is still possible via arrow keys / mouse.
      selectedItemId={focusedId}
      onSelectionChange={(id) => {
        if (id) setFocusedId(id);
      }}
      searchBarPlaceholder="Todo eintippen, z. B. Morgen Milch kaufen #home p2"
      searchText={searchText}
      onSearchTextChange={(text) => {
        setSearchText(text);
        setFocusedId(NEW_TODO_ID);
      }}
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
      {items}
    </List>
  );
}
