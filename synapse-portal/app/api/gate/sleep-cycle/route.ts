import { NextResponse } from "next/server";
import { sleepCycleService } from "@/lib/services/sleep-cycle-service";

export async function POST() {
  try {
    const summary = await sleepCycleService.run();
    return NextResponse.json({
      success: true,
      message: "REM Sleep Cycle executed successfully.",
      summary,
    });
  } catch (error) {
    console.error("[SLEEP_CYCLE_API] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
