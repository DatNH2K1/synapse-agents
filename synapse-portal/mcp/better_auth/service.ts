import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

interface DbConfig {
  import: string;
  config: string;
  env_var: [string, string] | null;
}

const DB_CONFIGS: Record<string, DbConfig> = {
  sqlite: {
    import: "import Database from 'better-sqlite3';",
    config: 'database: new Database("./dev.db")',
    env_var: null,
  },
  mysql: {
    import: "import { createPool } from 'mysql2/promise';",
    config:
      "database: createPool({ connectionString: process.env.DATABASE_URL })",
    env_var: ["DATABASE_URL", "mysql://root:password@localhost:3306/db"],
  },
  postgresql: {
    import: "import { Pool } from 'pg';",
    config: "database: new Pool({ connectionString: process.env.DATABASE_URL })",
    env_var: [
      "DATABASE_URL",
      "postgresql://postgres:password@localhost:5432/db",
    ],
  },
  drizzle: {
    import:
      "import { drizzleAdapter } from 'better-auth/adapters/drizzle';\nimport { db } from '@/db';",
    config: "database: drizzleAdapter(db, { provider: 'pg' })",
    env_var: null,
  },
  prisma: {
    import:
      "import { prismaAdapter } from 'better-auth/adapters/prisma';\nimport { PrismaClient } from '@prisma/client';\n\nconst prisma = new PrismaClient();",
    config: "database: prismaAdapter(prisma, { provider: 'postgresql' })",
    env_var: null,
  },
  kysely: {
    import:
      "import { kyselyAdapter } from 'better-auth/adapters/kysely';\nimport { db } from '@/db';",
    config: "database: kyselyAdapter(db, { provider: 'pg' })",
    env_var: null,
  },
  mongodb: {
    import:
      "import { mongodbAdapter } from 'better-auth/adapters/mongodb';\nimport { client } from '@/db';",
    config:
      "database: mongodbAdapter(client, { databaseName: 'better-auth' })",
    env_var: ["MONGODB_URI", "mongodb://localhost:27017"],
  },
};

export function initBetterAuth(
  dbType: string,
  authMethods: string[],
  projectPath: string = ".",
): string {
  const selectedDb = DB_CONFIGS[dbType.toLowerCase()];
  if (!selectedDb) {
    return `❌ Error: Invalid db_type. Supported values: ${Object.keys(DB_CONFIGS).join(", ")}`;
  }

  const imports = ["import { betterAuth } from 'better-auth';"];
  const plugins: string[] = [];
  const pluginImports: string[] = [];
  const configParts: string[] = [];

  if (selectedDb.import) {
    imports.push(selectedDb.import);
  }

  if (authMethods.includes("email")) {
    configParts.push(
      "  emailAndPassword: {\n    enabled: true,\n    autoSignIn: true\n  }",
    );
  }

  const socialProviders: string[] = [];
  if (authMethods.includes("github")) {
    socialProviders.push(
      "    github: {\n      clientId: process.env.GITHUB_CLIENT_ID!,\n      clientSecret: process.env.GITHUB_CLIENT_SECRET!,\n    }",
    );
  }
  if (authMethods.includes("google")) {
    socialProviders.push(
      "    google: {\n      clientId: process.env.GOOGLE_CLIENT_ID!,\n      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,\n    }",
    );
  }
  if (authMethods.includes("discord")) {
    socialProviders.push(
      "    discord: {\n      clientId: process.env.DISCORD_CLIENT_ID!,\n      clientSecret: process.env.DISCORD_CLIENT_SECRET!,\n    }",
    );
  }

  if (socialProviders.length > 0) {
    configParts.push(
      `  socialProviders: {\n${socialProviders.join(",\n")}\n  }`,
    );
  }

  if (authMethods.includes("2fa")) {
    pluginImports.push("import { twoFactor } from 'better-auth/plugins';");
    plugins.push("twoFactor()");
  }
  if (authMethods.includes("passkey")) {
    pluginImports.push("import { passkey } from 'better-auth/plugins';");
    plugins.push("passkey()");
  }
  if (authMethods.includes("magic_link")) {
    pluginImports.push("import { magicLink } from 'better-auth/plugins';");
    plugins.push(
      "magicLink({\n      sendMagicLink: async ({ email, url }) => {\n        // TODO: Implement email sending\n        console.log(`Magic link for ${email}: ${url}`);\n      }\n    })",
    );
  }
  if (authMethods.includes("username")) {
    pluginImports.push("import { username } from 'better-auth/plugins';");
    plugins.push("username()");
  }

  const allImports = [...imports, ...pluginImports];
  let configBody = configParts.join(",\n");
  if (plugins.length > 0) {
    configBody += `,\n  plugins: [\n    ${plugins.join(",\n    ")}\n  ]`;
  }

  const authTsContent = `${allImports.join("\n")}\n\nexport const auth = betterAuth({\n  ${selectedDb.config},\n${configBody}\n});\n`;

  const secret = crypto.randomBytes(32).toString("hex");
  const envLines = [
    `BETTER_AUTH_SECRET=${secret}`,
    "BETTER_AUTH_URL=http://localhost:3000",
  ];

  if (selectedDb.env_var) {
    const [key, value] = selectedDb.env_var;
    envLines.push(`${key}=${value}`);
  }
  if (authMethods.includes("github")) {
    envLines.push(
      "GITHUB_CLIENT_ID=your_github_client_id",
      "GITHUB_CLIENT_SECRET=your_github_client_secret",
    );
  }
  if (authMethods.includes("google")) {
    envLines.push(
      "GOOGLE_CLIENT_ID=your_google_client_id",
      "GOOGLE_CLIENT_SECRET=your_google_client_secret",
    );
  }
  if (authMethods.includes("discord")) {
    envLines.push(
      "DISCORD_CLIENT_ID=your_discord_client_id",
      "DISCORD_CLIENT_SECRET=your_discord_client_secret",
    );
  }
  const envContent = envLines.join("\n") + "\n";

  const resolvedProjectPath = path.resolve(projectPath);
  const libDir = path.join(resolvedProjectPath, "lib");
  const srcLibDir = path.join(resolvedProjectPath, "src", "lib");

  let targetDir = resolvedProjectPath;
  if (fs.existsSync(libDir)) {
    targetDir = libDir;
  } else if (fs.existsSync(srcLibDir)) {
    targetDir = srcLibDir;
  }

  const authPath = path.join(targetDir, "auth.ts");
  fs.mkdirSync(path.dirname(authPath), { recursive: true });
  fs.writeFileSync(authPath, authTsContent, "utf-8");

  const envPath = path.join(resolvedProjectPath, ".env");
  let envMsg = "";
  if (fs.existsSync(envPath)) {
    const existing = fs.readFileSync(envPath, "utf-8");
    if (!existing.includes("BETTER_AUTH_SECRET")) {
      fs.writeFileSync(envPath, existing + "\n" + envContent, "utf-8");
      envMsg = "Updated existing .env with Better Auth variables.";
    } else {
      envMsg =
        "Existing .env already contains BETTER_AUTH_SECRET. Kept original variables.";
    }
  } else {
    fs.writeFileSync(envPath, envContent, "utf-8");
    envMsg = "Created new .env file.";
  }

  const relativeAuthPath = path.relative(resolvedProjectPath, authPath);

  return (
    `✅ Better Auth Initialization Successful!\n` +
    `- Generated config file: ${relativeAuthPath}\n` +
    `- ${envMsg}\n\n` +
    `Next Steps:\n` +
    `1. Run: npx @better-auth/cli generate\n` +
    `2. Run framework migrations\n` +
    `3. Mount the handler routes (e.g. app/api/auth/[...all]/route.ts)`
  );
}
