import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@zeropulse/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const monitor = await prisma.monitor.findUnique({
      where: { slug },
    });

    if (!monitor) {
      return new NextResponse(generateBadge("not found", "—", "#5A6A84"), {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    // Get 24h uptime
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const checks = await prisma.check.findMany({
      where: { monitorId: monitor.id, checkedAt: { gte: dayAgo } },
      select: { isUp: true, responseTimeMs: true },
    });

    const lastCheck = await prisma.check.findFirst({
      where: { monitorId: monitor.id },
      orderBy: { checkedAt: "desc" },
      select: { isUp: true },
    });

    const uptimePercent =
      checks.length > 0
        ? ((checks.filter((c) => c.isUp).length / checks.length) * 100).toFixed(1)
        : "—";

    const isUp = lastCheck?.isUp ?? false;
    const statusText = isUp ? "UP" : "DOWN";
    const statusColor = isUp ? "#00FF88" : "#FF4466";

    return new NextResponse(
      generateBadge(monitor.name, `${uptimePercent}%`, statusColor, statusText),
      {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=60, s-maxage=60",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/badge/:slug]", error);
    return new NextResponse(generateBadge("error", "—", "#FF4466"), {
      status: 500,
      headers: { "Content-Type": "image/svg+xml" },
    });
  }
}

function generateBadge(
  label: string,
  uptime: string,
  color: string,
  status?: string
): string {
  const labelWidth = Math.max(label.length * 7.2 + 20, 80);
  const uptimeText = status ? `${uptime} · ${status}` : uptime;
  const valueWidth = Math.max(uptimeText.length * 7 + 20, 70);
  const totalWidth = labelWidth + valueWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="24" role="img" aria-label="${label}: ${uptimeText}">
  <title>${label}: ${uptimeText}</title>
  <defs>
    <linearGradient id="bg" x2="0" y2="100%">
      <stop offset="0" stop-color="#0E1420"/>
      <stop offset="1" stop-color="#080C14"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="0.5" stdDeviation="0.3" flood-opacity="0.4"/>
    </filter>
  </defs>
  <rect width="${totalWidth}" height="24" rx="4" fill="url(#bg)" stroke="#1A2235" stroke-width="1"/>
  <rect x="${labelWidth}" width="${valueWidth}" height="24" rx="0" fill="${color}22"/>
  <rect x="${totalWidth - 4}" width="4" height="24" rx="0" fill="url(#bg)"/>
  <rect x="${totalWidth - 4}" width="4" height="24" rx="4" fill="${color}22"/>
  <g fill="#E2E8F4" font-family="'Geist Mono','DejaVu Sans Mono',monospace" font-size="11" filter="url(#shadow)">
    <text x="${labelWidth / 2}" y="16.5" text-anchor="middle" fill="#5A6A84">
      <tspan>⚡</tspan> ${escapeXml(label)}
    </text>
    <text x="${labelWidth + valueWidth / 2}" y="16.5" text-anchor="middle" fill="${color}">
      ${escapeXml(uptimeText)}
    </text>
  </g>
  ${status === "UP" ? `<circle cx="${labelWidth + 10}" cy="12" r="3" fill="${color}"><animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/></circle>` : ""}
</svg>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
