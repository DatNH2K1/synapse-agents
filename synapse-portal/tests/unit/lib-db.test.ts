import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@prisma/client", () => {
  return {
    PrismaClient: class {
      $transaction = vi.fn();
    },
  };
});

vi.mock("@prisma/adapter-pg", () => {
  return {
    PrismaPg: class {},
  };
});

vi.mock("pg", () => {
  return {
    Pool: class {},
  };
});

describe("lib/db", () => {
  beforeEach(() => {
    vi.resetModules();
    globalThis.prismaGlobal = undefined;
  });

  it("should return configuration object with user_name from env", async () => {
    vi.stubEnv("SYNAPSE_USER_NAME", "TestUser");
    const { getConfig } = await import("@/lib/db");
    const config = getConfig();
    expect(config.user_name).toBe("TestUser");
  });

  it("should fall back to User when SYNAPSE_USER_NAME is unset", async () => {
    vi.stubEnv("SYNAPSE_USER_NAME", "");
    const { getConfig } = await import("@/lib/db");
    const config = getConfig();
    expect(config.user_name).toBe("User");
  });

  it("should export prisma client instance with default connection string", async () => {
    vi.doMock("@/lib/config", () => ({
      DB_CONFIG: {
        url: "postgresql://user:pass@host:5432/db",
      },
    }));
    const { prisma } = await import("@/lib/db");
    expect(prisma).toBeDefined();
    expect(typeof prisma.$transaction).toBe("function");
  });

  it("should fallback when DATABASE_URL is not set but individual config is set", async () => {
    vi.doMock("@/lib/config", () => ({
      DB_CONFIG: {
        url: undefined,
        user: "postgres",
        host: "localhost",
        port: 5432,
        database: "synapse",
        password: "password",
      },
    }));

    const { prisma } = await import("@/lib/db");
    expect(prisma).toBeDefined();
  });

  it("should fallback when host is missing but user is present", async () => {
    vi.doMock("@/lib/config", () => ({
      DB_CONFIG: {
        url: undefined,
        user: "postgres",
        host: undefined,
      },
    }));

    const { prisma } = await import("@/lib/db");
    expect(prisma).toBeDefined();
  });

  it("should fallback when user is missing but host is present", async () => {
    vi.doMock("@/lib/config", () => ({
      DB_CONFIG: {
        url: undefined,
        user: undefined,
        host: "localhost",
      },
    }));

    const { prisma } = await import("@/lib/db");
    expect(prisma).toBeDefined();
  });

  it("should fallback to default PrismaClient when no connection settings are present", async () => {
    vi.doMock("@/lib/config", () => ({
      DB_CONFIG: {
        url: undefined,
        user: undefined,
        host: undefined,
      },
    }));

    const { prisma } = await import("@/lib/db");
    expect(prisma).toBeDefined();
  });

  it("should use globalThis.prismaGlobal if it is already defined", async () => {
    const dummyClient = { isDummy: true };
    globalThis.prismaGlobal =
      dummyClient as object as import("@prisma/client").PrismaClient;

    const { prisma } = await import("@/lib/db");
    expect(prisma).toBe(dummyClient);
  });

  it("should not set globalThis.prismaGlobal when NODE_ENV is production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    globalThis.prismaGlobal = undefined;

    const { prisma } = await import("@/lib/db");
    expect(prisma).toBeDefined();
    expect(globalThis.prismaGlobal).toBeUndefined();
  });
});
