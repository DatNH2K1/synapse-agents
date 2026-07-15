import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/indexer/sync/route";
import { prisma } from "@/lib/db";
import { IndexerFile, IndexerSymbol, IndexerDependency } from "@prisma/client";

const mockTx = {
  indexerRepo: {
    upsert: vi.fn(),
  },
  indexerFile: {
    upsert: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
  indexerSymbol: {
    deleteMany: vi.fn(),
    create: vi.fn(),
  },
  indexerDependency: {
    deleteMany: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock("@/lib/db", () => {
  return {
    prisma: {
      $transaction: vi.fn((cb) =>
        cb(
          mockTx as unknown as Omit<
            typeof prisma,
            "$connect" | "$disconnect" | "$on" | "$use" | "$extends"
          >,
        ),
      ),
    },
  };
});

describe("API Indexer Sync Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation((cb) =>
      cb(
        mockTx as unknown as Omit<
          typeof prisma,
          "$connect" | "$disconnect" | "$on" | "$use" | "$extends"
        >,
      ),
    );
    mockTx.indexerRepo.upsert.mockResolvedValue({ id: "repo-id-1" });
    mockTx.indexerFile.upsert.mockResolvedValue({} as unknown as IndexerFile);
    mockTx.indexerFile.create.mockResolvedValue({
      id: "created-id",
    } as unknown as IndexerFile);
    mockTx.indexerFile.findUnique.mockResolvedValue({
      id: "existing-id",
    } as unknown as IndexerFile);
    mockTx.indexerFile.findMany.mockResolvedValue([]);
    mockTx.indexerSymbol.create.mockResolvedValue(
      {} as unknown as IndexerSymbol,
    );
    mockTx.indexerDependency.create.mockResolvedValue(
      {} as unknown as IndexerDependency,
    );
  });

  it("should return 400 if files is not an array", async () => {
    const req = new Request("http://localhost/api/indexer/sync", {
      method: "POST",
      body: JSON.stringify({ files: "not-an-array" }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: "Invalid payload: 'files' must be an array",
    });
  });

  it("should sync files inside a transaction on success", async () => {
    const mockFiles = [
      {
        path: "src/main.ts",
        hash: "hash1",
        exports: [{ name: "main", kind: "function", range: "1:0-5:0" }],
        imports: [{ name: "util", from: "src/utils.ts" }],
      },
    ];

    vi.mocked(mockTx.indexerFile.findMany).mockResolvedValue([
      { id: "file-id-main", path: "src/main.ts" },
    ] as unknown as IndexerFile[]);

    // Mock dependency file lookup to return an existing target file
    vi.mocked(mockTx.indexerFile.findUnique).mockResolvedValue({
      id: "file-id-utils",
      path: "src/utils.ts",
    } as unknown as IndexerFile);

    const req = new Request("http://localhost/api/indexer/sync", {
      method: "POST",
      body: JSON.stringify({ repo: "test-repo", files: mockFiles }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, syncedFilesCount: 1 });

    expect(mockTx.indexerFile.deleteMany).toHaveBeenCalledWith({
      where: { repoId: "repo-id-1" },
    });

    expect(mockTx.indexerFile.create).toHaveBeenCalledWith({
      data: { repoId: "repo-id-1", path: "src/main.ts", hash: "hash1" },
    });

    expect(mockTx.indexerSymbol.create).toHaveBeenCalledWith({
      data: {
        fileId: "file-id-main",
        name: "main",
        kind: "function",
        range: "1:0-5:0",
      },
    });

    expect(mockTx.indexerDependency.create).toHaveBeenCalledWith({
      data: {
        dependentFileId: "file-id-main",
        dependencyFileId: "file-id-utils",
        symbolName: "util",
      },
    });
  });

  it("should create dependency target file as placeholder if it does not exist", async () => {
    const mockFiles = [
      {
        path: "src/main.ts",
        hash: "hash1",
        exports: [],
        imports: [{ name: "util", from: "src/unknown.ts" }],
      },
    ];

    vi.mocked(mockTx.indexerFile.findMany).mockResolvedValue([
      { id: "file-id-main", path: "src/main.ts" },
    ] as unknown as IndexerFile[]);

    // Mock dependency file lookup to return null (not found)
    vi.mocked(mockTx.indexerFile.findUnique).mockResolvedValue(null);
    vi.mocked(mockTx.indexerFile.create).mockResolvedValue({
      id: "placeholder-id",
      path: "src/unknown.ts",
    } as unknown as IndexerFile);

    const req = new Request("http://localhost/api/indexer/sync", {
      method: "POST",
      body: JSON.stringify({ repo: "test-repo", files: mockFiles }),
    });

    await POST(req);

    expect(mockTx.indexerFile.create).toHaveBeenCalledWith({
      data: {
        repoId: "repo-id-1",
        path: "src/unknown.ts",
        hash: "placeholder",
      },
    });

    expect(mockTx.indexerDependency.create).toHaveBeenCalledWith({
      data: {
        dependentFileId: "file-id-main",
        dependencyFileId: "placeholder-id",
        symbolName: "util",
      },
    });
  });

  it("should return 500 error on transaction failure", async () => {
    vi.mocked(prisma.$transaction).mockRejectedValue(
      new Error("Transaction Error"),
    );

    const req = new Request("http://localhost/api/indexer/sync", {
      method: "POST",
      body: JSON.stringify({ files: [] }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Transaction Error" });
  });

  it("should default to synapse repo if repo is missing in body", async () => {
    const mockFiles = [{ path: "src/main.ts", hash: "hash1" }];
    vi.mocked(mockTx.indexerFile.findMany).mockResolvedValue([]);

    const req = new Request("http://localhost/api/indexer/sync", {
      method: "POST",
      body: JSON.stringify({ files: mockFiles }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, syncedFilesCount: 1 });
    expect(mockTx.indexerFile.deleteMany).toHaveBeenCalledWith({
      where: { repoId: "repo-id-1" },
    });
    expect(mockTx.indexerFile.create).toHaveBeenCalledWith({
      data: { repoId: "repo-id-1", path: "src/main.ts", hash: "hash1" },
    });
  });

  it("should skip file inserting exports/imports if currentFile is not found", async () => {
    const mockFiles = [
      {
        path: "src/main.ts",
        hash: "hash1",
        exports: [{ name: "main", kind: "function", range: "1" }],
      },
    ];
    // return empty meaning currentFile will be undefined
    vi.mocked(mockTx.indexerFile.findMany).mockResolvedValue([]);

    const req = new Request("http://localhost/api/indexer/sync", {
      method: "POST",
      body: JSON.stringify({ files: mockFiles }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, syncedFilesCount: 1 });
    expect(mockTx.indexerSymbol.create).not.toHaveBeenCalled();
  });

  it("should handle files with exports/imports that are not arrays", async () => {
    const mockFiles = [
      {
        path: "src/main.ts",
        hash: "hash1",
        exports: "not-an-array",
        imports: "not-an-array",
      },
    ];
    vi.mocked(mockTx.indexerFile.findMany).mockResolvedValue([
      { id: "file-id-main", path: "src/main.ts" },
    ] as unknown as IndexerFile[]);

    const req = new Request("http://localhost/api/indexer/sync", {
      method: "POST",
      body: JSON.stringify({ files: mockFiles }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, syncedFilesCount: 1 });
    expect(mockTx.indexerSymbol.create).not.toHaveBeenCalled();
    expect(mockTx.indexerDependency.create).not.toHaveBeenCalled();
  });

  it("should handle non-Error exceptions gracefully in transaction", async () => {
    vi.mocked(prisma.$transaction).mockRejectedValue(
      "String transaction error",
    );

    const req = new Request("http://localhost/api/indexer/sync", {
      method: "POST",
      body: JSON.stringify({ files: [] }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Internal Server Error" });
  });
});
