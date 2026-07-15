# Lifecycle Hooks

Hooks allow you to run custom scripts or shell commands at specific points during Antigravity's execution loop. This is powerful for enforcing custom rules, running linters, or capturing diagnostics automatically.

## Configuration

Hooks are configured in a `hooks.json` file located in your customization directory (e.g., `.agents/` in your workspace or `~/.gemini/config/`).

### Schema and File Format

The `hooks.json` file maps hook names to their event configurations:

```json
{
  "my-linter-hook": {
    "PostToolUse": [
      {
        "matcher": "run_command",
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/lint.sh",
            "timeout": 10
          }
        ]
      }
    ]
  },
  "safety-gate": {
    "enabled": false,
    "PreToolUse": [
      {
        "matcher": "run_command",
        "hooks": [
          {
            "command": "./scripts/safety-check.sh"
          }
        ]
      }
    ]
  },
  "reminder": {
    "PreInvocation": [
      {
        "type": "command",
        "command": "./scripts/reminder.sh"
      }
    ]
  }
}
```

### Hook Definition Fields

- `enabled` (boolean): Optional. Set to `false` to disable the hook without removing it. Defaults to `true`.
- `PreToolUse` (array): Handlers that run before a tool is executed.
- `PostToolUse` (array): Handlers that run after a tool completes.
- `PreInvocation` (array): Handlers that run before Antigravity calls the model.
- `PostInvocation` (array): Handlers that run after tool calls finish.
- `Stop` (array): Handlers that run when the execution loop terminates.

---

## Supported Events & Matchers

| Event            | Description                       | Matcher Target                  |
| ---------------- | --------------------------------- | ------------------------------- |
| `PreToolUse`     | Fires before a tool is executed.  | Tool name (e.g., `run_command`) |
| `PostToolUse`    | Fires after a tool completes.     | Tool name                       |
| `PreInvocation`  | Fires before the model is called. | N/A (matcher ignored)           |
| `PostInvocation` | Fires after tool calls finish.    | N/A (matcher ignored)           |
| `Stop`           | Fires when execution terminates.  | N/A (matcher ignored)           |

### Matcher Rules

For `PreToolUse` and `PostToolUse`, you can use a regular expression in the `matcher` field:

- `""` or `"*"`: Match all tools.
- `"run_command"`: Match exactly `run_command`.
- `"run_command|view_file"`: Match either tool.
- `"browser_.*"`: Match any tool starting with `browser_`.

---

## Input/Output Contract

Hooks receive input via `stdin` as JSON and return output via `stdout` as JSON.

### Common Input Fields

All hooks receive the following payload on `stdin`:

- `conversationId` (string): The unique UUID of the active conversation.
- `workspacePaths` (array of strings): Absolute directory paths of mounted workspaces.
- `transcriptPath` (string): Absolute path to the persistent `transcript.jsonl` conversation logs.
- `artifactDirectoryPath` (string): Absolute path to the directory containing all conversation artifacts.

---

### PreToolUse

Fires before a tool is executed.

#### Input (stdin):

- `toolCall` (object): Proposed tool call details.
  - `toolCall.name` (string): Name of the tool (e.g., `run_command`).
  - `toolCall.args` (object): Arguments passed to the tool.
- `stepIdx` (integer): 0-based index of the current step in the trajectory.
- _(Common Fields)_

#### Output (stdout):

- `decision` (string): Required. Gating control:
  - `"allow"`: Automatically allows the execution.
  - `"deny"`: Hard blocks execution immediately.
  - `"ask"`: Prompts the user (respects "Always Allow").
  - `"force_ask"`: Always prompts the user.
- `reason` (string): Optional explanation shown to the agent or user.
- `permissionOverrides` (array of strings): Optional. List of resource override strings.

---

### PostToolUse

Fires after a tool completes.

#### Input (stdin):

- `stepIdx` (integer)
- `error` (string): Detailed runtime error message if the tool call failed.
- _(Common Fields)_

#### Output (stdout):

Returns an empty JSON object `{}`.

---

### PreInvocation

Fires before the model is called.

#### Input (stdin):

- `invocationNum` (integer)
- `initialNumSteps` (integer)
- _(Common Fields)_

#### Output (stdout):

- `injectSteps` (array of objects): Optional. Steps to inject.
  - Injected Step Schema: Can contain `toolCall` (object), `userMessage` (string), or `ephemeralMessage` (string).

---

### PostInvocation

Fires after tool calls finish.

#### Input (stdin): Same as PreInvocation.

#### Output (stdout):

- `injectSteps` (array of objects): Optional.
- `terminationBehavior` (string): Optional. Set to `"force_continue"`, `"terminate"`, or `""`.

---

### Stop

Fires when the execution loop terminates.

#### Input (stdin):

- `executionNum` (integer)
- `terminationReason` (string)
- `error` (string)
- `fullyIdle` (boolean): `true` if all async/background tasks have completed.
- _(Common Fields)_

#### Output (stdout):

- `decision` (string): Required. Set to `"continue"` to prevent stopping.
- `reason` (string): Optional explanation injected if continuing.
