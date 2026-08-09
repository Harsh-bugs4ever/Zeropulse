import { notFound } from "next/navigation";
import { prisma } from "@zeropulse/db";
import { formatUptime, formatResponseTime, getUptimeColor, timeAgo } from "@/lib/utils";
import { Activity, CheckCircle, XCircle, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  return {
    title: `Status | ZeroPulse`,
    description: `Live uptime status page`,
  };
}

export default async function StatusPage({ params }: Props) {
  let monitor;
  try {
    monitor = await prisma.monitor.findUnique({
      where: { slug: params.slug },
    });
  } catch {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <p className="text-pulse-muted2 font-mono">Service unavailable</p>
      </div>
    );
  }

  if (!monitor) notFound();

  const now     = new Date();
  const dayAgo  = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);

  const [recentChecks, dayChecks, weekChecks, ongoingIncident] =
    await Promise.all([
      prisma.check.findMany({
        where: { monitorId: monitor.id },
        orderBy: { checkedAt: "desc" },
        take: 10,
        select: { isUp: true, statusCode: true, responseTimeMs: true, checkedAt: true },
      }),
      prisma.check.findMany({
        where: { monitorId: monitor.id, checkedAt: { gte: dayAgo } },
        select: { isUp: true, responseTimeMs: true },
      }),
      prisma.check.findMany({
        where: { monitorId: monitor.id, checkedAt: { gte: weekAgo } },
        select: { isUp: true },
      }),
      prisma.incident.findFirst({
        where: { monitorId: monitor.id, isOngoing: true },
      }),
    ]);

  const lastCheck = recentChecks[0];
  const isUp      = lastCheck?.isUp ?? false;

  const uptimeDay  = dayChecks.length  ? (dayChecks.filter(c => c.isUp).length  / dayChecks.length)  * 100 : null;
  const uptimeWeek = weekChecks.length ? (weekChecks.filter(c => c.isUp).length / weekChecks.length) * 100 : null;

  const validTimes = dayChecks.filter(c => c.responseTimeMs !== null).map(c => c.responseTimeMs as number);
  const avgResponse = validTimes.length
    ? Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length)
    : null;

  return (
    <div className="min-h-screen grid-bg flex flex-col">
      <header className="border-b border-pulse-border bg-pulse-bg/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-pulse-cyan flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-pulse-bg" strokeWidth={2.5} />
            </div>
            <span className="font-mono text-sm font-semibold">
              Zero<span className="text-pulse-cyan">Pulse</span>
            </span>
          </div>
          <span className="text-xs text-pulse-dim font-mono">status page</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12 space-y-6">
        <div className={`card p-8 text-center border ${isUp ? "border-pulse-green/30" : "border-pulse-red/30"}`}>
          <div className="flex justify-center mb-4">
            <div className={`pulse-dot ${isUp ? "up" : "down"} scale-150`} />
          </div>
          <h1 className="text-2xl font-semibold text-pulse-text">{monitor.name}</h1>
          <a href={monitor.url} target="_blank" rel="noopener noreferrer"
            className="text-sm text-pulse-muted2 hover:text-pulse-cyan transition-colors mt-1 block">
            {monitor.url}
          </a>
          <div className="mt-5">
            {ongoingIncident ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pulse-red-dim border border-pulse-red/30 text-pulse-red font-mono text-sm">
                <XCircle className="w-4 h-4" /> Service disruption detected
              </div>
            ) : isUp ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pulse-green-dim border border-pulse-green/30 text-pulse-green font-mono text-sm">
                <CheckCircle className="w-4 h-4" /> All systems operational
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pulse-amber-dim border border-pulse-amber/30 text-pulse-amber font-mono text-sm">
                No data yet
              </div>
            )}
          </div>
          {lastCheck && (
            <p className="text-xs text-pulse-dim font-mono mt-3">
              Last checked {timeAgo(lastCheck.checkedAt)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="card px-4 py-4 text-center">
            <p className="stat-label mb-1">24h uptime</p>
            <p className={`text-xl font-mono font-semibold ${getUptimeColor(uptimeDay)}`}>
              {formatUptime(uptimeDay)}
            </p>
          </div>
          <div className="card px-4 py-4 text-center">
            <p className="stat-label mb-1">7d uptime</p>
            <p className={`text-xl font-mono font-semibold ${getUptimeColor(uptimeWeek)}`}>
              {formatUptime(uptimeWeek)}
            </p>
          </div>
          <div className="card px-4 py-4 text-center">
            <p className="stat-label mb-1 flex items-center justify-center gap-1">
              <Zap className="w-3 h-3" /> avg resp
            </p>
            <p className="text-xl font-mono font-semibold text-pulse-text">
              {avgResponse ? `${avgResponse}ms` : "—"}
            </p>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-sm font-semibold text-pulse-text mb-4">Recent checks</h2>
          {recentChecks.length === 0 ? (
            <p className="text-pulse-dim text-sm text-center py-6 font-mono">No checks recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {recentChecks.map((check, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-pulse-muted text-xs font-mono">
                  <div className="flex items-center gap-2">
                    {check.isUp
                      ? <CheckCircle className="w-3.5 h-3.5 text-pulse-green" />
                      : <XCircle className="w-3.5 h-3.5 text-pulse-red" />}
                    <span className={check.isUp ? "text-pulse-green" : "text-pulse-red"}>
                      {check.isUp ? "UP" : "DOWN"}
                    </span>
                    {check.statusCode && <span className="text-pulse-dim">HTTP {check.statusCode}</span>}
                  </div>
                  <div className="flex items-center gap-4 text-pulse-muted2">
                    <span>{formatResponseTime(check.responseTimeMs)}</span>
                    <span>{timeAgo(check.checkedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-pulse-dim font-mono">
          Powered by <a href="/" className="text-pulse-cyan hover:underline">ZeroPulse</a>
          {" "}&amp;{" "}
          <a href="https://zerops.io" target="_blank" rel="noopener noreferrer" className="text-pulse-cyan hover:underline">Zerops</a>
        </p>
      </main>
    </div>
  );
}
