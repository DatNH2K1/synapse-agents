import { prisma } from "../db";
import { vectorService } from "./vector-service";

let runningTasks = 0;
const MAX_CONCURRENCY = 3;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

const logQueueError = (err: Error) => {
  console.error("[QueueService] Queue loop error:", err);
};

const processQueue = async (): Promise<void> => {
  if (runningTasks >= MAX_CONCURRENCY) {
    return;
  }

  let task = null;
  try {
    const claimedTasks = await prisma.$queryRaw<
      {
        id: string;
        nodeId: string;
        text: string;
        attempts: number;
        createdAt: Date;
      }[]
    >`
      DELETE FROM "QueueTask"
      WHERE id = (
        SELECT id FROM "QueueTask"
        ORDER BY "createdAt" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, "nodeId", text, attempts, "createdAt"
    `;

    if (!claimedTasks || claimedTasks.length === 0) return;

    task = claimedTasks[0];
  } catch (err) {
    console.error("[QueueService] Failed to claim task from database:", err);
    return;
  }

  runningTasks++;

  processQueue().catch(logQueueError);

  try {
    console.log(
      `[QueueService] Processing node ${task.nodeId} (Attempt ${task.attempts + 1}/${MAX_RETRIES})`,
    );
    const success = await vectorService.updateNodeEmbedding(
      task.nodeId,
      task.text,
    );
    if (success) {
      console.log(`[QueueService] Successfully vectorized node ${task.nodeId}`);
    } else {
      throw new Error("Vector calculation failed or returned false");
    }
  } catch (err) {
    console.error(
      `[QueueService] Failed to vectorize node ${task.nodeId}:`,
      err,
    );
    if (task.attempts + 1 < MAX_RETRIES) {
      const nextAttempts = task.attempts + 1;
      const delay =
        BASE_DELAY_MS * Math.pow(2, nextAttempts) + Math.random() * 1000;
      console.log(
        `[QueueService] Scheduling retry for node ${task.nodeId} in ${Math.round(delay)}ms`,
      );
      setTimeout(async () => {
        try {
          await prisma.queueTask.create({
            data: {
              nodeId: task!.nodeId,
              text: task!.text,
              attempts: nextAttempts,
            },
          });
          processQueue().catch(logQueueError);
        } catch (createErr) {
          console.error(
            "[QueueService] Failed to reschedule task in DB:",
            createErr,
          );
        }
      }, delay);
    } else {
      console.error(
        `[QueueService] Max retries (${MAX_RETRIES}) reached for node ${task.nodeId}. Keeping as failed/null vector.`,
      );
    }
  } finally {
    runningTasks--;
    processQueue().catch(logQueueError);
  }
};

export const queueService = {
  enqueueEmbeddingTask: async (nodeId: string, text: string) => {
    try {
      console.log(
        `[QueueService] Enqueueing background embedding task for node ${nodeId}`,
      );
      await prisma.queueTask.create({
        data: {
          nodeId,
          text,
          attempts: 0,
        },
      });

      processQueue().catch(logQueueError);
    } catch (err) {
      console.error(
        `[QueueService] Failed to schedule task for ${nodeId}:`,
        err,
      );
    }
  },
  _logQueueError: logQueueError,
};
