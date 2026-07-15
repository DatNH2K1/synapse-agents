import secrets
from pathlib import Path
from typing import List


def init_better_auth(
    db_type: str, auth_methods: List[str], project_path: str = "."
) -> str:
    """
    Initialize Better Auth in a project by generating auth.ts and updating .env file.

    Args:
        db_type: One of 'sqlite', 'mysql', 'postgresql', 'drizzle', 'prisma', 'kysely', 'mongodb'.
        auth_methods: Selected authentication methods. e.g. ['email', 'github', 'google', 'discord', '2fa', 'passkey', 'magic_link', 'username'].
        project_path: Root path of the project.

    Returns:
        A confirmation message indicating generated files and next steps.
    """
    # Map database configuration
    db_configs = {
        "sqlite": {
            "import": "import Database from 'better-sqlite3';",
            "config": 'database: new Database("./dev.db")',
            "env_var": None,
        },
        "mysql": {
            "import": "import { createPool } from 'mysql2/promise';",
            "config": "database: createPool({ connectionString: process.env.DATABASE_URL })",
            "env_var": ("DATABASE_URL", "mysql://root:password@localhost:3306/db"),
        },
        "postgresql": {
            "import": "import { Pool } from 'pg';",
            "config": "database: new Pool({ connectionString: process.env.DATABASE_URL })",
            "env_var": (
                "DATABASE_URL",
                "postgresql://postgres:password@localhost:5432/db",
            ),
        },
        "drizzle": {
            "import": "import { drizzleAdapter } from 'better-auth/adapters/drizzle';\nimport { db } from '@/db';",
            "config": "database: drizzleAdapter(db, { provider: 'pg' })",
            "env_var": None,
        },
        "prisma": {
            "import": "import { prismaAdapter } from 'better-auth/adapters/prisma';\nimport { PrismaClient } from '@prisma/client';\n\nconst prisma = new PrismaClient();",
            "config": "database: prismaAdapter(prisma, { provider: 'postgresql' })",
            "env_var": None,
        },
        "kysely": {
            "import": "import { kyselyAdapter } from 'better-auth/adapters/kysely';\nimport { db } from '@/db';",
            "config": "database: kyselyAdapter(db, { provider: 'pg' })",
            "env_var": None,
        },
        "mongodb": {
            "import": "import { mongodbAdapter } from 'better-auth/adapters/mongodb';\nimport { client } from '@/db';",
            "config": "database: mongodbAdapter(client, { databaseName: 'better-auth' })",
            "env_var": ("MONGODB_URI", "mongodb://localhost:27017"),
        },
    }

    selected_db = db_configs.get(db_type.lower())
    if not selected_db:
        return f"❌ Error: Invalid db_type. Supported values: {', '.join(db_configs.keys())}"

    # Generate auth.ts config
    imports = ["import { betterAuth } from 'better-auth';"]
    plugins = []
    plugin_imports = []
    config_parts = []

    if selected_db.get("import"):
        imports.append(selected_db["import"])

    if "email" in auth_methods:
        config_parts.append(
            "  emailAndPassword: {\n    enabled: true,\n    autoSignIn: true\n  }"
        )

    # OAuth
    social_providers = []
    if "github" in auth_methods:
        social_providers.append(
            "    github: {\n      clientId: process.env.GITHUB_CLIENT_ID!,\n      clientSecret: process.env.GITHUB_CLIENT_SECRET!,\n    }"
        )
    if "google" in auth_methods:
        social_providers.append(
            "    google: {\n      clientId: process.env.GOOGLE_CLIENT_ID!,\n      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,\n    }"
        )
    if "discord" in auth_methods:
        social_providers.append(
            "    discord: {\n      clientId: process.env.DISCORD_CLIENT_ID!,\n      clientSecret: process.env.DISCORD_CLIENT_SECRET!,\n    }"
        )

    if social_providers:
        social_providers_str = ",\n".join(social_providers)
        config_parts.append(f"  socialProviders: {{\n{social_providers_str}\n  }}")

    # Plugins
    if "2fa" in auth_methods:
        plugin_imports.append("import { twoFactor } from 'better-auth/plugins';")
        plugins.append("twoFactor()")
    if "passkey" in auth_methods:
        plugin_imports.append("import { passkey } from 'better-auth/plugins';")
        plugins.append("passkey()")
    if "magic_link" in auth_methods:
        plugin_imports.append("import { magicLink } from 'better-auth/plugins';")
        plugins.append(
            "magicLink({\n      sendMagicLink: async ({ email, url }) => {\n        // TODO: Implement email sending\n        console.log(`Magic link for ${email}: ${url}`);\n      }\n    })"
        )
    if "username" in auth_methods:
        plugin_imports.append("import { username } from 'better-auth/plugins';")
        plugins.append("username()")

    all_imports = imports + plugin_imports
    config_body = ",\n".join(config_parts)

    if plugins:
        plugins_str = ",\n    ".join(plugins)
        config_body += f",\n  plugins: [\n    {plugins_str}\n  ]"

    auth_ts_content = f"""{chr(10).join(all_imports)}

export const auth = betterAuth({{
  {selected_db["config"]},
{config_body}
}});
"""

    # Generate .env updates
    secret = secrets.token_hex(32)
    env_lines = [
        f"BETTER_AUTH_SECRET={secret}",
        "BETTER_AUTH_URL=http://localhost:3000",
    ]
    if selected_db.get("env_var"):
        key, value = selected_db["env_var"]
        env_lines.append(f"{key}={value}")
    if "github" in auth_methods:
        env_lines.extend(
            [
                "GITHUB_CLIENT_ID=your_github_client_id",
                "GITHUB_CLIENT_SECRET=your_github_client_secret",
            ]
        )
    if "google" in auth_methods:
        env_lines.extend(
            [
                "GOOGLE_CLIENT_ID=your_google_client_id",
                "GOOGLE_CLIENT_SECRET=your_google_client_secret",
            ]
        )
    if "discord" in auth_methods:
        env_lines.extend(
            [
                "DISCORD_CLIENT_ID=your_discord_client_id",
                "DISCORD_CLIENT_SECRET=your_discord_client_secret",
            ]
        )
    env_content = "\n".join(env_lines) + "\n"

    # Save files
    p_path = Path(project_path).resolve()

    # Save auth.ts into a plausible location (lib/auth.ts or root)
    lib_dir = p_path / "lib"
    if lib_dir.exists() or (p_path / "src" / "lib").exists():
        target_dir = lib_dir if lib_dir.exists() else p_path / "src" / "lib"
    else:
        target_dir = p_path

    auth_path = target_dir / "auth.ts"
    auth_path.parent.mkdir(parents=True, exist_ok=True)
    auth_path.write_text(auth_ts_content, encoding="utf-8")

    # Update or create .env
    env_path = p_path / ".env"
    if env_path.exists():
        existing = env_path.read_text(encoding="utf-8")
        if "BETTER_AUTH_SECRET" not in existing:
            env_path.write_text(existing + "\n" + env_content, encoding="utf-8")
            env_msg = "Updated existing .env with Better Auth variables."
        else:
            env_msg = "Existing .env already contains BETTER_AUTH_SECRET. Kept original variables."
    else:
        env_path.write_text(env_content, encoding="utf-8")
        env_msg = "Created new .env file."

    return (
        f"✅ Better Auth Initialization Successful!\n"
        f"- Generated config file: {auth_path.relative_to(p_path) if auth_path.is_relative_to(p_path) else auth_path}\n"
        f"- {env_msg}\n\n"
        f"Next Steps:\n"
        f"1. Run: npx @better-auth/cli generate\n"
        f"2. Run framework migrations\n"
        f"3. Mount the handler routes (e.g. app/api/auth/[...all]/route.ts)"
    )
