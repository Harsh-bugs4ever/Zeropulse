import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@zeropulse/db";
import { removeMonitorSchedule, scheduleMonitor } from "@/lib/queue";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const monitor = await prisma.monitor.findUnique({
      where: { id },
    });

    if (!monitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
    }

    return NextResponse.json(monitor);
  } catch (error) {
    console.error("[GET /api/monitors/:id]", error);
    return NextResponse.json({ error: "Failed to fetch monitor" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const monitor = await prisma.monitor.findUnique({
      where: { id },
    });

    if (!monitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
    }

    await removeMonitorSchedule(id);
    await prisma.monitor.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/monitors/:id]", error);
    return NextResponse.json({ error: "Failed to delete monitor" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const monitor = await prisma.monitor.findUnique({ where: { id } });

    if (!monitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
    }

    // Handle pause/resume toggle
    if (typeof body.isActive === "boolean") {
      const updated = await prisma.monitor.update({
        where: { id },
        data: { isActive: body.isActive },
      });

      if (body.isActive) {
        await scheduleMonitor(id, updated.interval);
      } else {
        await removeMonitorSchedule(id);
      }

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  } catch (error) {
    console.error("[PATCH /api/monitors/:id]", error);
    return NextResponse.json({ error: "Failed to update monitor" }, { status: 500 });
  }
}

