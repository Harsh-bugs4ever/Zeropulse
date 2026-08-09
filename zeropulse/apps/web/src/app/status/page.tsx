import { prisma } from "@zeropulse/db";
import { formatUptime, getUptimeColor, timeAgo } from "@/lib/utils";
import { Activity, CheckCircle, XCircle, Zap, Globe, ArrowRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Status Overview — ZeroPulse",
  description: "Live status of all monitored services on ZeroPulse.",
};

export default async function StatusOverviewPage() {
  let monitors: any[] = [];
  try {
    monitors = await prisma.monitor.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        checks: {
          orderBy: { checkedAt: "desc" },
          take: 1,
          select: { isUp: true, checkedAt: true, responseTimeMs: true },
        },
        incidents: {
          where: { isOngoing: true },
          take: 1,
        },
      },
    });
  } catch (e) {
    console.error("Failed to fetch monitors on /status:", e);
  }

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const monitorsWithUptime = await Promise.all(
    monitors.map(async (monitor) => {
      const dayChecks = await prisma.check.findMany({
        where: { monitorId: monitor.id, checkedAt: { gte: dayAgo } },
        select: { isUp: true },
      });

      const uptimeDay =
        dayChecks.length > 0
          ? (dayChecks.filter((c) => c.isUp).length / dayChecks.length) * 100
          : null;

      const lastCheck = monitor.checks[0];
      const isUp = lastCheck?.isUp ?? false;
      const hasIncident = monitor.incidents.length > 0;

      return {
        id: monitor.id,
        name: monitor.name,
        url: monitor.url,
        slug: monitor.slug,
        isUp,
        hasIncident,
        uptimeDay,
        lastCheckedAt: lastCheck?.checkedAt ?? null,
        responseTimeMs: lastCheck?.responseTimeMs ?? null,
      };
    })
  );

  const allUp = monitorsWithUptime.every((m) => m.isUp);
  const anyIncident = monitorsWithUptime.some((m) => m.hasIncident);
  const totalMonitors = monitorsWithUptime.length;
  const upCount = monitorsWithUptime.filter((m) => m.isUp).length;

  return (
    <div className="min-h-screen grid-bg flex flex-col">
      {/* Minimal nav */}
      <header className="border-b border-pulse-border bg-pulse-bg/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-pulse-cyan flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-pulse-bg" strokeWidth={2.5} />
            </div>
            <span className="font-mono text-sm font-semibold">
              Zero<span className="text-pulse-cyan">Pulse</span>
            </span>
          </Link>
          <span className="text-xs text-pulse-dim font-mono">
            global status overview
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 space-y-8">
        {/* Hero status */}
        <div
          className={`card p-8 text-center border ${
            totalMonitors === 0
              ? "border-pulse-border"
              : allUp
              ? "border-pulse-green/30"
              : "border-pulse-red/30"
          }`}
        >
          <div className="flex justify-center mb-4">
            {totalMonitors === 0 ? (
              <Globe className="w-10 h-10 text-pulse-dim" />
            ) : (
              <div
                className={`pulse-dot ${allUp ? "up" : "down"} scale-150`}
              />
            )}
          </div>

          <h1 className="text-2xl font-semibold text-pulse-text mb-2">
            System Status
          </h1>

          {totalMonitors === 0 ? (
            <p className="text-pulse-dim text-sm font-mono">
              No monitors configured yet.
            </p>
          ) : anyIncident ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pulse-red-dim border border-pulse-red/30 text-pulse-red font-mono text-sm">
              <XCircle className="w-4 h-4" />
              Service disruption detected
            </div>
          ) : allUp ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pulse-green-dim border border-pulse-green/30 text-pulse-green font-mono text-sm">
              <CheckCircle className="w-4 h-4" />
              All {totalMonitors} systems operational
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pulse-amber-dim border border-pulse-amber/30 text-pulse-amber font-mono text-sm">
              {upCount}/{totalMonitors} systems operational
            </div>
          )}
        </div>

        {/* Summary stats */}
        {totalMonitors > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="card px-4 py-4 text-center">
              <p className="stat-label mb-1">Monitors</p>
              <p className="text-xl font-mono font-semibold text-pulse-text">
                {totalMonitors}
              </p>
            </div>
            <div className="card px-4 py-4 text-center">
              <p className="stat-label mb-1">Operational</p>
              <p className="text-xl font-mono font-semibold text-pulse-green">
                {upCount}
              </p>
            </div>
            <div className="card px-4 py-4 text-center">
              <p className="stat-label mb-1">Down</p>
              <p
                className={`text-xl font-mono font-semibold ${
                  totalMonitors - upCount > 0
                    ? "text-pulse-red"
                    : "text-pulse-text"
                }`}
              >
                {totalMonitors - upCount}
              </p>
            </div>
          </div>
        )}

        {/* Monitor list */}
        {totalMonitors > 0 && (
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-pulse-text mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-pulse-cyan" />
              Monitored services
            </h2>
            <div className="space-y-2">
              {monitorsWithUptime.map((monitor) => (
                <Link
                  key={monitor.id}
                  href={`/status/${monitor.slug}`}
                  className="flex items-center justify-between py-3 px-4 rounded-lg bg-pulse-muted hover:bg-pulse-muted/80 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`pulse-dot ${
                        monitor.isUp ? "up" : "down"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-pulse-text">
                        {monitor.name}
                      </p>
                      <p className="text-xs text-pulse-dim font-mono">
                        {monitor.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {monitor.responseTimeMs !== null && (
                      <div className="hidden sm:block text-right">
                        <p className="text-[10px] text-pulse-dim font-mono">
                          response
                        </p>
                        <p className="text-xs font-mono text-pulse-text">
                          {monitor.responseTimeMs}ms
                        </p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-[10px] text-pulse-dim font-mono">
                        24h uptime
                      </p>
                      <p
                        className={`text-xs font-mono font-semibold ${getUptimeColor(
                          monitor.uptimeDay
                        )}`}
                      >
                        {formatUptime(monitor.uptimeDay)}
                      </p>
                    </div>
                    {monitor.isUp ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-pulse-green-dim text-pulse-green border border-pulse-green/20">
                        UP
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-pulse-red-dim text-pulse-red border border-pulse-red/20">
                        DOWN
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-pulse-dim group-hover:text-pulse-cyan transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-pulse-dim font-mono">
          Powered by{" "}
          <Link href="/" className="text-pulse-cyan hover:underline">
            ZeroPulse
          </Link>{" "}
          &amp;{" "}
          <a
            href="https://zerops.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pulse-cyan hover:underline"
          >
            Zerops
          </a>
        </p>
      </main>
    </div>
  );
}
