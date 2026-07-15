import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const configs = await prisma.systemConfig.findMany();

    // Transform array to a clean key-value object
    const configMap: Record<string, string> = {};
    configs.forEach((c) => {
      configMap[c.key] = c.value;
    });

    return NextResponse.json({ success: true, config: configMap });
  } catch (error) {
    console.error("[API System Config GET] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { key, value } = await request.json();

    if (typeof key !== "string" || typeof value !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payload format (expected string key and value)",
        },
        { status: 400 },
      );
    }

    // Arthur's Safety & Validation Boundaries
    if (
      key === "rem_mode_enabled" ||
      key === "forget_mode_enabled" ||
      key === "forget_dry_run_enabled"
    ) {
      if (value !== "true" && value !== "false") {
        return NextResponse.json(
          {
            success: false,
            message: `${key} must be 'true' or 'false'`,
          },
          { status: 400 },
        );
      }
    } else if (
      key === "rem_similarity_threshold" ||
      key === "rem_confidence_threshold"
    ) {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0.0 || numValue > 1.0) {
        return NextResponse.json(
          {
            success: false,
            message: `${key} must be a number between 0.0 and 1.0`,
          },
          { status: 400 },
        );
      }
    }

    // Upsert into database
    await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API System Config POST] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
