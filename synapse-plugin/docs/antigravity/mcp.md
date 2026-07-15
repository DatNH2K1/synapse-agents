# Model Context Protocol (MCP)

Antigravity supports the Model Context Protocol (MCP), an open standard that lets AI agents and editors securely connect to local developer tools, databases, file parsers, and external remote APIs. This integration provides the AI model with real-time context and execution capabilities beyond your immediate workspace.

## What is MCP?

MCP acts as a universal bridge between Antigravity and your broader development environment. Instead of manually copying and pasting database schemas, logs, or API specifications into prompts or chat panels, MCP lets Antigravity fetch structured context directly or execute safe actions on your behalf when needed.

### Add Context

- When writing a SQL query, Antigravity can inspect your live Neon, Supabase, or AlloyDB schema to suggest correct table and column names.
- When debugging deployment failures, Antigravity can pull recent build logs directly from Netlify or Heroku.

### Add Custom Tools

- Create a Linear issue for this TODO.
- Search Notion or GitHub for authentication patterns.

---

## Configuration by Product

### Antigravity 2.0

Manage your MCP servers through the **Settings** -> **Customizations** -> **Installed MCP Servers** section. You can add servers from the MCP Store or disable/enable/uninstall existing ones.

### Antigravity IDE

Install supported servers from the built-in MCP Store via `...` at the top of the editor's agent side panel -> **MCP Servers**.
To add custom servers, click **Manage MCP Servers** -> **View raw config** to edit your configuration.

- **Global Config Path**: `~/.gemini/config/mcp_config.json`
- **Workspace-Local Config Path**: `<workspace-root>/.agents/mcp_config.json`

### Antigravity CLI

Type `/mcp` in the prompt panel to open the interactive MCP Manager Overlay.

- **Global Config Path**: `~/.gemini/config/mcp_config.json`
- **Workspace-Local Config Path**: `<workspace-root>/.agents/mcp_config.json`

> [!WARNING]
> **Remote Connection Schema**: When declaring remote SSE, Streamable HTTP, or websocket-based MCP connections, you must define the `serverUrl` field. Legacy fields like `url` or `httpUrl` are not supported.

### Antigravity SDK

The SDK automatically discovers servers configured in `.agents/mcp_config.json`. You can also instantiate agents with local configurations directly.

---

## MCP Configuration Structure

The configuration file follows a standardized format containing a single `mcpServers` object:

```json
{
  "mcpServers": {
    "sqlite-explorer": {
      "command": "node",
      "args": ["/usr/local/bin/sqlite-mcp-server.js"],
      "env": {
        "SQLITE_DB_PATH": "/var/data/app.db"
      }
    },
    "my-remote-server": {
      "serverUrl": "https://api.example.com/mcp/",
      "headers": {
        "Authorization": "Bearer YOUR_API_TOKEN"
      }
    }
  }
}
```

### Properties

- **Transport (one required)**:
  - `command` (string): Path to the executable for stdio transport.
  - `serverUrl` (string): URL for remote Streamable HTTP or SSE servers.
- **Optional**:
  - `args` (string[]): Command-line arguments for stdio transport.
  - `env` (object): Environment variables for the stdio server process.
  - `cwd` (string): Working directory for stdio servers.
  - `headers` (object): Custom HTTP headers for remote servers.
  - `authProviderType` (string): Authentication provider. Supports `"google_credentials"` for Application Default Credentials (ADC).
  - `oauth` (object): OAuth client credentials (`clientId`, `clientSecret`).
  - `disabled` (boolean): Temporarily disable a server without removing its configuration.
  - `disabledTools` (string[]): Tool names to withhold from the model.

---

## MCP Authentication

### Google Credentials

Set `authProviderType` to `"google_credentials"` to use Google Application Default Credentials (ADC):

```json
{
  "mcpServers": {
    "my-gcp-service": {
      "serverUrl": "https://example.googleapis.com/mcp/",
      "authProviderType": "google_credentials"
    }
  }
}
```

Requires running `gcloud auth application-default login` locally.

### OAuth

Antigravity automatically handles OAuth for servers that support dynamic client registration (DCR). If not supported, provide credentials manually:

```json
{
  "mcpServers": {
    "oauth-server": {
      "serverUrl": "https://api.example.com/mcp/",
      "oauth": {
        "clientId": "your-client-id",
        "clientSecret": "your-client-secret"
      }
    }
  }
}
```

Register the following redirect URI with your OAuth provider:
`https://antigravity.google/oauth-callback`

To authenticate:

1. Open settings via `Cmd+,` or `Ctrl+,`.
2. Click **Authenticate** next to the server.
3. Complete authentication in browser, copy authorization code, paste it back, and submit.

Access tokens are stored in `~/.gemini/antigravity/mcp_oauth_tokens.json`.

---

## MCP Permissions and Access Control

Access is governed by Antigravity's permissions system. By default, unconfigured tools run in `Ask` mode. Grant permissions in your safety policy using:

- `mcp(server/tool)`: Matches a specific tool on a specific server.
- `mcp(server/*)`: Matches all tools on a specified server.
- `mcp(*)`: Global wildcard matching any MCP tool.
