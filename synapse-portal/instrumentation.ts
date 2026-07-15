export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const globalForScheduler = globalThis as object as {
      schedulerRegistered?: boolean;
    };

    if (globalForScheduler.schedulerRegistered) {
      return;
    }
    globalForScheduler.schedulerRegistered = true;

    console.log(
      "[Instrumentation] Starting monolithic background services on Node.js runtime...",
    );

    // Dynamically import dependencies to prevent Edge runtime bundle contamination
    const { prisma } = await import("./lib/db");
    const { sleepCycleService } =
      await import("./lib/services/sleep-cycle-service");

    const checkAndRunSleepCycle = async () => {
      console.log("[Instrumentation] Checking REM Sleep Cycle status...");
      try {
        // 1. Check if REM mode is enabled in configuration
        const remEnabledConfig = await prisma.systemConfig.findUnique({
          where: { key: "rem_mode_enabled" },
        });
        if (!remEnabledConfig || remEnabledConfig.value !== "true") {
          console.log(
            "[Instrumentation] REM sleep cycle is disabled in config. Skipping run.",
          );
          return;
        }

        // 2. Fetch last run timestamp
        const lastRunConfig = await prisma.systemConfig.findUnique({
          where: { key: "rem_last_run_time" },
        });

        const lastRun = lastRunConfig
          ? new Date(lastRunConfig.value)
          : new Date(0);
        const now = new Date();
        const hoursSinceLastRun =
          (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);

        // 3. Trigger REM sleep cycle if >= 24 hours have elapsed
        if (hoursSinceLastRun >= 24) {
          console.log(
            `[Instrumentation] Last REM cycle run was ${hoursSinceLastRun.toFixed(1)} hours ago (>= 24h). Triggering Sleep Cycle consolidation...`,
          );
          await sleepCycleService.run();
        } else {
          console.log(
            `[Instrumentation] REM cycle was run ${hoursSinceLastRun.toFixed(1)} hours ago (< 24h). Next run in ${(24 - hoursSinceLastRun).toFixed(1)} hours.`,
          );
        }
      } catch (err) {
        console.error("[Instrumentation] Error in Sleep Cycle Scheduler:", err);
      }
    };

    // Run initial scheduler check after 10 seconds (gives DB connection pool time to initialize)
    setTimeout(checkAndRunSleepCycle, 10000);

    // Schedule check to run every 10 minutes
    setInterval(checkAndRunSleepCycle, 10 * 60 * 1000);
    console.log(
      "[Instrumentation] REM Sleep Cycle Scheduler registered successfully (Interval: 10 minutes)",
    );
  }
}
