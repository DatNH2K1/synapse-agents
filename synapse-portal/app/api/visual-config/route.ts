import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { id, color } = await request.json();

    await prisma.tag.update({
      where: { id },
      data: { color },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tag Config API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 },
    );
  }
}
