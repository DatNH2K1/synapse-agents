import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import DependencyGraphPage from "@/app/(dashboard)/dependency-graph/page";
import { prisma } from "@/lib/db";
import { IndexerRepo } from "@prisma/client";

vi.mock("@/lib/db", () => {
  return {
    prisma: {
      indexerRepo: {
        findMany: vi.fn(),
      },
    },
  };
});

vi.mock("@/app/(dashboard)/dependency-graph/page_content", () => ({
  default: ({ initialRepos }: { initialRepos: string[] }) => (
    <div data-testid="dep-graph-content">
      <span>Initial Repos: {initialRepos.join(", ")}</span>
    </div>
  ),
}));

describe("app/(dashboard)/dependency-graph/page", () => {
  const originalIndexerRepo = prisma.indexerRepo;

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    (
      prisma as unknown as {
        indexerRepo: typeof originalIndexerRepo | undefined;
      }
    ).indexerRepo = originalIndexerRepo;
  });

  it("should fetch repos from DB and render DependencyGraphContent", async () => {
    vi.mocked(prisma.indexerRepo.findMany).mockResolvedValue([
      { name: "repo-a" },
      { name: "repo-b" },
    ] as Pick<IndexerRepo, "name">[] as unknown as IndexerRepo[]);

    const element = await DependencyGraphPage();
    render(element);

    expect(screen.getByTestId("dep-graph-content")).toBeDefined();
    expect(screen.getByText("Initial Repos: repo-a, repo-b")).toBeDefined();
    expect(prisma.indexerRepo.findMany).toHaveBeenCalledWith({
      select: { name: true },
      orderBy: { lastSyncedAt: "desc" },
    });
  });

  it("should handle error when prisma.indexerRepo is undefined", async () => {
    (
      prisma as unknown as {
        indexerRepo: typeof originalIndexerRepo | undefined;
      }
    ).indexerRepo = undefined;

    const element = await DependencyGraphPage();
    render(element);

    expect(screen.getByTestId("dep-graph-content")).toBeDefined();
    expect(screen.getByText(/Initial Repos:/)).toBeDefined();
  });

  it("should handle DB errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(prisma.indexerRepo.findMany).mockRejectedValueOnce(
      new Error("DB Connection Failed"),
    );

    const element = await DependencyGraphPage();
    render(element);

    expect(screen.getByTestId("dep-graph-content")).toBeDefined();
    expect(screen.getByText(/Initial Repos:/)).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching repositories for dependency graph:",
      expect.any(Error),
    );
  });
});
