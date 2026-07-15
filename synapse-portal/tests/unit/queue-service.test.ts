import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { queueService } from "@/lib/services/queue-service";
import { prisma } from "@/lib/db";
import { vectorService } from "@/lib/services/vector-service";
import { QueueTask } from "@prisma/client";

vi.mock("@/lib/db", () => {
  return {
    prisma: {
      $queryRaw: vi.fn(),
      queueTask: {
        create: vi.fn(),
        findFirst: vi.fn(),
        deleteMany: vi.fn(),
      },
    },
  };
});

vi.mock("@/lib/services/vector-service", () => {
  return {
    vectorService: {
      updateNodeEmbedding: vi.fn(),
    },
  };
});

describe("QueueService Persistent DB Queue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("TC1: Should successfully enqueue a task to DB", async () => {
    vi.mocked(prisma.queueTask.create).mockResolvedValue({} as QueueTask);
    vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

    await queueService.enqueueEmbeddingTask("node-1", "test text");

    expect(prisma.queueTask.create).toHaveBeenCalledWith({
      data: {
        nodeId: "node-1",
        text: "test text",
        attempts: 0,
      },
    });
  });

  it("TC2: Should process tasks from DB and log success on success", async () => {
    const mockTask = {
      id: "task-1",
      nodeId: "node-2",
      text: "process text",
      attempts: 0,
      createdAt: new Date(),
    };

    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([mockTask])
      .mockResolvedValue([]);

    vi.mocked(vectorService.updateNodeEmbedding).mockResolvedValue(true);

    await queueService.enqueueEmbeddingTask("node-2", "process text");

    await vi.runAllTimersAsync();

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(vectorService.updateNodeEmbedding).toHaveBeenCalledWith(
      "node-2",
      "process text",
    );
  });

  it("TC3: Should return early when database claim fails", async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(
      new Error("DB Connection Error"),
    );

    await queueService.enqueueEmbeddingTask("node-3", "error text");
    await vi.runAllTimersAsync();

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(vectorService.updateNodeEmbedding).not.toHaveBeenCalled();
  });

  it("TC4: Should handle case when claimed tasks is empty", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

    await queueService.enqueueEmbeddingTask("node-4", "empty queue text");
    await vi.runAllTimersAsync();

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(vectorService.updateNodeEmbedding).not.toHaveBeenCalled();
  });

  it("TC5: Should schedule a retry if vectorService returns false or throws error", async () => {
    const mockTask = {
      id: "task-retry",
      nodeId: "node-retry",
      text: "retry text",
      attempts: 0,
      createdAt: new Date(),
    };

    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([mockTask])
      .mockResolvedValue([]);

    vi.mocked(vectorService.updateNodeEmbedding).mockResolvedValue(false);
    vi.mocked(prisma.queueTask.create).mockResolvedValue({} as QueueTask);

    await queueService.enqueueEmbeddingTask("node-retry", "retry text");

    // Run initial execution
    await vi.advanceTimersByTimeAsync(50);

    expect(vectorService.updateNodeEmbedding).toHaveBeenCalled();
    // The create method is called once initially when enqueueing the task
    expect(prisma.queueTask.create).toHaveBeenCalledTimes(1);

    // Advance time to trigger setTimeout retry scheduling
    await vi.runAllTimersAsync();

    // Now it should have rescheduled the task, making it 2 calls in total
    expect(prisma.queueTask.create).toHaveBeenCalledTimes(2);
    expect(prisma.queueTask.create).toHaveBeenLastCalledWith({
      data: {
        nodeId: "node-retry",
        text: "retry text",
        attempts: 1,
      },
    });
  });

  it("TC6: Should log error and not retry if attempts reached MAX_RETRIES", async () => {
    const mockTaskMaxAttempts = {
      id: "task-failed",
      nodeId: "node-failed",
      text: "failed text",
      attempts: 2, // task.attempts + 1 will equal 3 (MAX_RETRIES)
      createdAt: new Date(),
    };

    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([mockTaskMaxAttempts])
      .mockResolvedValue([]);

    vi.mocked(vectorService.updateNodeEmbedding).mockRejectedValue(
      new Error("Embedding calculation failure"),
    );

    await queueService.enqueueEmbeddingTask("node-failed", "failed text");
    await vi.runAllTimersAsync();

    expect(vectorService.updateNodeEmbedding).toHaveBeenCalled();
    // Only the initial enqueue call to create should have occurred
    expect(prisma.queueTask.create).toHaveBeenCalledTimes(1);
  });

  it("TC7: Should handle error during task rescheduling", async () => {
    const mockTaskRescheduleFail = {
      id: "task-reschedule-fail",
      nodeId: "node-reschedule-fail",
      text: "fail text",
      attempts: 0,
      createdAt: new Date(),
    };

    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([mockTaskRescheduleFail])
      .mockResolvedValue([]);

    vi.mocked(vectorService.updateNodeEmbedding).mockRejectedValue(
      new Error("Embedding error"),
    );
    vi.mocked(prisma.queueTask.create)
      .mockResolvedValueOnce({} as QueueTask) // First call (enqueue) succeeds
      .mockRejectedValueOnce(new Error("DB insert error during reschedule")); // Second call (reschedule) fails

    await queueService.enqueueEmbeddingTask(
      "node-reschedule-fail",
      "fail text",
    );
    await vi.runAllTimersAsync();

    // 1 call for enqueue, 1 call for scheduled retry (which fails)
    expect(prisma.queueTask.create).toHaveBeenCalledTimes(2);
  });

  it("TC8: Should handle error during enqueue task", async () => {
    vi.mocked(prisma.queueTask.create).mockRejectedValue(
      new Error("Database insert error during enqueue"),
    );

    // This should not throw, but log error internally
    await queueService.enqueueEmbeddingTask("node-enqueue-fail", "fail text");

    expect(prisma.queueTask.create).toHaveBeenCalled();
  });

  it("TC9: Should cover the logQueueError function directly", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Call the private exposed function directly to cover it
    queueService._logQueueError(new Error("Test queue loop error"));

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
