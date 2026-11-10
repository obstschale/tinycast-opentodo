import {
  Action,
  ActionPanel,
  closeMainWindow,
  Icon,
  List,
  showToast,
  Toast,
} from "@raycast/api";
import { useState } from "react";
import { addTodo } from "./ot";

// `LaunchProps<T>` in this API version doesn't declare `fallbackText`, so we
// describe just the shape we read. It is set for fallback / deeplink launches.
type Props = {
  fallbackText?: string;
};

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

  const todo = searchText.trim();

  async function submit() {
    if (!todo || isLoading) return;
    setIsLoading(true);
    const result = await addTodo(todo);
    setIsLoading(false);

    if (result.ok) {
      await closeMainWindow();
      await showToast({
        style: Toast.Style.Success,
        title: "Todo hinzugefügt",
        message: result.message,
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
    >
      <List.Item
        icon={Icon.Plus}
        title={todo || "Todo eintippen …"}
        subtitle={todo ? "↵ fügt das Todo zu Open Todo hinzu" : "ot add --natural"}
        actions={
          <ActionPanel>
            <Action title="Todo hinzufügen" icon={Icon.Plus} onAction={submit} />
          </ActionPanel>
        }
      />
    </List>
  );
}
