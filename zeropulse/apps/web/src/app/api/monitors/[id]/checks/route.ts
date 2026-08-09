import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@zeropulse/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500);
    const hours = parseInt(searchParams.get("hours") ?? "24");

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const checks = await prisma.check.findMany({
      where: { monitorId: id, checkedAt: { gte: since } },
      orderBy: { checkedAt: "asc" },
      take: limit,
      select: {
        id: true,
        statusCode: true,
        responseTimeMs: true,
        isUp: true,
        errorMessage: true,
        checkedAt: true,
      },
    });

    return NextResponse.json(checks);
  } catch (error) {
    console.error("[GET /api/monitors/:id/checks]", error);
    return NextResponse.json({ error: "Failed to fetch checks" }, { status: 500 });
  }
}
