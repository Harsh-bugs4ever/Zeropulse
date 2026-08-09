import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@zeropulse/db";
import { scheduleMonitor } from "@/lib/queue";
import { generateSlug } from "@/lib/utils";
import type { CreateMonitorPayload } from "@/types";

export async function GET() {
  try {
    const monitors = await prisma.monitor.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        checks: {
          orderBy: { checkedAt: "desc" },
          take: 1,
        },
        incidents: {
          where: { isOngoing: true },
          take: 1,
        },
      },
    });

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const monitorsWithStats = await Promise.all(
      monitors.map(async (monitor) => {
        const dayChecks = await prisma.check.findMany({
          where: { monitorId: monitor.id, checkedAt: { gte: dayAgo } },
          select: { isUp: true, responseTimeMs: true },
        });

        const lastCheck = monitor.checks[0];
        const isOngoingIncident = monitor.incidents.length > 0;

        const uptimeDay =
          dayChecks.length > 0
            ? (dayChecks.filter((c) => c.isUp).length / dayChecks.length) * 100
            : null;

        const validTimes = dayChecks
          .map((c) => c.responseTimeMs)
          .filter((t): t is number => t !== null);

        const avgResponseTime =
          validTimes.length > 0
            ? Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length)
            : null;

        let status: "up" | "down" | "unknown" = "unknown";
        if (lastCheck) status = lastCheck.isUp ? "up" : "down";

        return {
          id: monitor.id,
          name: monitor.name,
          url: monitor.url,
          interval: monitor.interval,
          isActive: monitor.isActive,
          alertEmail: monitor.alertEmail,
          slug: monitor.slug,
          createdAt: monitor.createdAt.toISOString(),
          status,
          uptimeDay,
          uptimeWeek: null, // computed on detail page
          avgResponseTime,
          lastCheckedAt: lastCheck?.checkedAt.toISOString() ?? null,
          lastStatusCode: lastCheck?.statusCode ?? null,
          lastResponseTime: lastCheck?.responseTimeMs ?? null,
          isOngoingIncident,
        };
      })
    );

    return NextResponse.json(monitorsWithStats);
  } catch (error) {
    console.error("[GET /api/monitors]", error);
    return NextResponse.json({ error: "Failed to fetch monitors" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateMonitorPayload;

    if (!body.name || !body.url) {
      return NextResponse.json(
        { error: "Name and URL are required" },
        { status: 400 }
      );
    }

    // Basic URL validation
    try {
      new URL(body.url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const slug = generateSlug(body.name);

    const monitor = await prisma.monitor.create({
      data: {
        name: body.name.trim(),
        url: body.url.trim(),
        interval: body.interval ?? 5,
        alertEmail: body.alertEmail?.trim() || null,
        slug,
      },
    });

    // Schedule the BullMQ repeatable job
    await scheduleMonitor(monitor.id, monitor.interval);

    return NextResponse.json(monitor, { status: 201 });
  } catch (error) {
    console.error("[POST /api/monitors]", error);
    return NextResponse.json({ error: "Failed to create monitor" }, { status: 500 });
  }
}
