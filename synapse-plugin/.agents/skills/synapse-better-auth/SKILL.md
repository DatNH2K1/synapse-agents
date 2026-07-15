---
name: synapse-better-auth
description: |
  Expert integration of Better Auth framework. Includes feature matrix, plugin configuration, and security checklists.

  MANDATORY: Execute when the user is implementing, modifying, or debugging authentication/authorization in a TypeScript/JavaScript project, or specifically requests integrating/configuring Better Auth, 2FA, Passkeys, Magic Links, or Social OAuth.

  Trigger immediately for:
  - Better Auth setup & configuration: "better-auth", "better auth", "auth.ts", "authClient", "createAuthClient".
  - Implementing authentication methods: "email/password login", "social login", "OAuth setup", "magic link auth", "passkey login".
  - Adding auth security features: "two-factor authentication", "2FA setup", "WebAuthn / Passkeys", "rate limit auth routes".
  - Database adapters for auth: "better-auth drizzle adapter", "prisma adapter for auth", "kysely adapter".

  DO NOT trigger for:
  - Projects not using TypeScript/JavaScript.
  - General backend database configuration unrelated to authentication.
  - Standard CSS styling or UI modifications not involving login/signup logic.
argument-hint: "[auth-method or feature]"
---

# Better Auth Skill

Better Auth is a comprehensive, framework-agnostic authentication/authorization framework for TypeScript with a built-in email/password, social OAuth, and powerful plugin ecosystem for advanced features.

## When to Use

- Implementing auth in TypeScript/JavaScript applications
- Adding email/password or social OAuth authentication
- Setting up 2FA, passkeys, magic links, advanced auth features
- Building multi-tenant apps with organization support
- Managing sessions and user lifecycle
- Working with any framework (Next.js, Nuxt, SvelteKit, Remix, Astro, Hono, Express, etc.)

## Quick Start

### Automatic Configuration with MCP

You can automatically initialize Better Auth configuration using the `init_better_auth` tool on the `SynapsePortal` MCP server.

> [!WARNING]
> **MCP Availability Rule**: If the `SynapsePortal` MCP server or its `init_better_auth` tool is not configured or is unavailable in the current environment:
>
> 1. Output a warning to the user: `⚠️ Warning: SynapsePortal MCP server is not configured or available. Skipping automatic Better Auth initialization.`
> 2. Skip the automatic setup step and guide the user through manual setup.

Arguments for `init_better_auth`:

- **`db_type`**: One of `'sqlite'`, `'mysql'`, `'postgresql'`, `'drizzle'`, `'prisma'`, `'kysely'`, `'mongodb'`.
- **`auth_methods`**: Selected authentication methods. e.g. `["email", "github", "google", "discord", "2fa", "passkey", "magic_link", "username"]`.
- **`project_path`**: Root path of the project (defaults to `"."`).

Example tool call:

```json
{
  "db_type": "drizzle",
  "auth_methods": ["email", "github", "google"],
  "project_path": "."
}
```

### Installation

```bash
npm install better-auth
# or pnpm/yarn/bun add better-auth
```

### Environment Setup

Create `.env`:

```env
BETTER_AUTH_SECRET=<generated-secret-32-chars-min>
BETTER_AUTH_URL=http://localhost:3000
```

### Basic Server Setup

Create `auth.ts` (root, lib/, utils/, or under src/app/server/):

```ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: {
    // See [Database Integration](./references/database-integration.md)
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
});
```

### Database Schema

```bash
npx @better-auth/cli generate  # Generate schema/migrations
npx @better-auth/cli migrate   # Apply migrations (Kysely only)
```

### Mount API Handler

**Next.js App Router:**

```ts
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

**Other frameworks:** See [Framework Setup](./references/email-password-auth.md#framework-setup)

### Client Setup

Create `auth-client.ts`:

```ts
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});
```

### Basic Usage

```ts
// Sign up
await authClient.signUp.email({
  email: "user@example.com",
  password: "secure123",
  name: "John Doe",
});

// Sign in
await authClient.signIn.email({
  email: "user@example.com",
  password: "secure123",
});

// OAuth
await authClient.signIn.social({ provider: "github" });

// Session
const { data: session } = authClient.useSession(); // React/Vue/Svelte
const { data: activeSession } = await authClient.getSession(); // Vanilla JS
```

## Feature Selection Matrix

| Feature                      | Plugin Required      | Use Case               | Reference                                                                                |
| ---------------------------- | -------------------- | ---------------------- | ---------------------------------------------------------------------------------------- |
| Email/Password               | No (built-in)        | Basic auth             | [Email/Password Authentication](./references/email-password-auth.md)                     |
| OAuth (GitHub, Google, etc.) | No (built-in)        | Social login           | [OAuth Providers](./references/oauth-providers.md)                                       |
| Email Verification           | No (built-in)        | Verify email addresses | [Email Verification](./references/email-password-auth.md#email-verification)             |
| Password Reset               | No (built-in)        | Forgot password flow   | [Password Reset](./references/email-password-auth.md#password-reset-flow)                |
| Two-Factor Auth (2FA/TOTP)   | Yes (`twoFactor`)    | Enhanced security      | [Two-Factor Authentication](./references/advanced-features.md#two-factor-authentication) |
| Passkeys/WebAuthn            | Yes (`passkey`)      | Passwordless auth      | [Passkeys WebAuthn](./references/advanced-features.md#passkeys-webauthn)                 |
| Magic Link                   | Yes (`magicLink`)    | Email-based login      | [Magic Link](./references/advanced-features.md#magic-link)                               |
| Username Auth                | Yes (`username`)     | Username login         | [Username Authentication](./references/email-password-auth.md#username-authentication)   |
| Organizations/Multi-tenant   | Yes (`organization`) | Team/org features      | [Organizations](./references/advanced-features.md#organizations-multi-tenancy)           |
| Rate Limiting                | No (built-in)        | Prevent abuse          | [Rate Limiting](./references/advanced-features.md#rate-limiting)                         |
| Session Management           | No (built-in)        | User sessions          | [Session Management](./references/advanced-features.md#session-management)               |

## Auth Method Selection Guide

**Choose Email/Password when:**

- Building standard web app with traditional auth
- Need full control over user credentials
- Targeting users who prefer email-based accounts

**Choose OAuth when:**

- Want quick signup with minimal friction
- Users already have social accounts
- Need access to social profile data

**Choose Passkeys when:**

- Want passwordless experience
- Targeting modern browsers/devices
- Security is top priority

**Choose Magic Link when:**

- Want passwordless without WebAuthn complexity
- Targeting email-first users
- Need temporary access links

**Combine Multiple Methods when:**

- Want flexibility for different user preferences
- Building enterprise apps with various auth requirements
- Need progressive enhancement (start simple, add more options)

## Core Architecture

Better Auth uses client-server architecture:

1. **Server** (`better-auth`): Handles auth logic, database ops, API routes
2. **Client** (`better-auth/client`): Provides hooks/methods for frontend
3. **Plugins**: Extend both server/client functionality

## Implementation Checklist

- [ ] Install `better-auth` package
- [ ] Set environment variables (SECRET, URL)
- [ ] Create auth server instance with database config
- [ ] Run schema migration (`npx @better-auth/cli generate`)
- [ ] Mount API handler in framework
- [ ] Create client instance
- [ ] Implement sign-up/sign-in UI
- [ ] Add session management to components
- [ ] Set up protected routes/middleware
- [ ] Add plugins as needed (regenerate schema after)
- [ ] Test complete auth flow
- [ ] Configure email sending (verification/reset)
- [ ] Enable rate limiting for production
- [ ] Set up error handling

## Reference Documentation

### Core Authentication

- [Email/Password Authentication](./references/email-password-auth.md) - Email/password setup, verification, password reset, username auth
- [OAuth Providers](./references/oauth-providers.md) - Social login setup, provider configuration, token management
- [Database Integration](./references/database-integration.md) - Database adapters, schema setup, migrations

### Advanced Features

- [Advanced Features](./references/advanced-features.md) - 2FA/MFA, passkeys, magic links, organizations, rate limiting, session management

## Resources

- Docs: https://www.better-auth.com/docs
- GitHub: https://github.com/better-auth/better-auth
- Plugins: https://www.better-auth.com/docs/plugins
- Examples: https://www.better-auth.com/docs/examples
