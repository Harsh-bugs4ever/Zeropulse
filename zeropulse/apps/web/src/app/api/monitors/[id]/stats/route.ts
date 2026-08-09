import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@zeropulse/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const now = new Date();
    const dayAgo  = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);

    const [dayChecks, weekChecks, incidents] = await Promise.all([
      prisma.check.findMany({
        where: { monitorId: id, checkedAt: { gte: dayAgo } },
        select: { isUp: true, responseTimeMs: true },
      }),
      prisma.check.findMany({
        where: { monitorId: id, checkedAt: { gte: weekAgo } },
        select: { isUp: true, responseTimeMs: true },
      }),
      prisma.incident.findMany({
        where: { monitorId: id },
        orderBy: { startedAt: "desc" },
        take: 10,
      }),
    ]);

    const calcUptime = (checks: { isUp: boolean }[]) =>
      checks.length === 0
        ? null
        : (checks.filter((c) => c.isUp).length / checks.length) * 100;

    const calcAvgResponse = (
      checks: { isUp: boolean; responseTimeMs: number | null }[]
    ) => {
      const valid = checks
        .filter((c) => c.isUp && c.responseTimeMs !== null)
        .map((c) => c.responseTimeMs as number);
      return valid.length === 0
        ? null
        : Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
    };

    // Calculate current uptime streak (consecutive checks that are up)
    const recentChecks = await prisma.check.findMany({
      where: { monitorId: id },
      orderBy: { checkedAt: "desc" },
      take: 100,
      select: { isUp: true },
    });

    let currentStreak = 0;
    for (const check of recentChecks) {
      if (!check.isUp) break;
      currentStreak++;
    }

    return NextResponse.json({
      uptimeDay:             calcUptime(dayChecks),
      uptimeWeek:            calcUptime(weekChecks),
      avgResponseTimeDay:    calcAvgResponse(dayChecks),
      avgResponseTimeWeek:   calcAvgResponse(weekChecks),
      totalChecksDay:        dayChecks.length,
      totalChecksWeek:       weekChecks.length,
      currentStreak,
      incidents: incidents.map((i) => ({
        id:           i.id,
        startedAt:    i.startedAt.toISOString(),
        resolvedAt:   i.resolvedAt?.toISOString() ?? null,
        isOngoing:    i.isOngoing,
        errorReason:  i.errorReason,
      })),
    });
  } catch (error) {
    console.error("[GET /api/monitors/:id/stats]", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
