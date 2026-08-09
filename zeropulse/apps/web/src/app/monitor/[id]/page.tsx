"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ExternalLink, Trash2, Share2, CheckCircle,
  XCircle, Clock, Zap, TrendingUp, AlertTriangle, Copy, Check,
  Pause, Play
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { ResponseTimeChart } from "@/components/charts/ResponseTimeChart";
import {
  formatResponseTime, formatUptime, getUptimeColor, timeAgo
} from "@/lib/utils";
import type { CheckPoint, StatsResponse } from "@/types";

export default function MonitorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id     = params.id as string;

  const [monitor,  setMonitor]  = useState<any>(null);
  const [checks,   setChecks]   = useState<CheckPoint[]>([]);
  const [stats,    setStats]    = useState<StatsResponse | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [copied,   setCopied]   = useState(false);
  const [toggling, setToggling] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [monitorRes, checksRes, statsRes] = await Promise.all([
        fetch(`/api/monitors/${id}`),
        fetch(`/api/monitors/${id}/checks?hours=24`),
        fetch(`/api/monitors/${id}/stats`),
      ]);
      const [monitorData, checksData, statsData] = await Promise.all([
        monitorRes.json(),
        checksRes.json(),
        statsRes.json(),
      ]);
      setMonitor(monitorData);
      setChecks(checksData);
      setStats(statsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function handleDelete() {
    if (!confirm(`Delete "${monitor?.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/monitors/${id}`, { method: "DELETE" });
    router.push("/");
  }

  function copyStatusUrl() {
    const url = `${window.location.origin}/status/${monitor?.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleToggleActive() {
    setToggling(true);
    try {
      await fetch(`/api/monitors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !monitor.isActive }),
      });
      await fetchData();
    } catch (err) {
      console.error("Failed to toggle monitor", err);
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-32 relative overflow-hidden">
              <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!monitor) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-pulse-muted2">Monitor not found.</p>
          <Link href="/" className="btn-ghost mt-4 inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const lastCheck = checks[checks.length - 1];
  const isUp      = lastCheck?.isUp ?? false;

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-pulse-muted2 hover:text-pulse-cyan transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All monitors
        </Link>

        {/* Header */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0">
                <div className={`pulse-dot ${isUp ? "up" : "down"}`} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-pulse-text">
                  {monitor.name}
                </h1>
                <a
                  href={monitor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-pulse-muted2 hover:text-pulse-cyan transition-colors mt-0.5"
                >
                  {monitor.url}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <div className="flex items-center gap-3 mt-2">
                  {isUp
                    ? <span className="badge-up">OPERATIONAL</span>
                    : <span className="badge-down">DOWN</span>}
                  <span className="text-xs text-pulse-dim font-mono">
                    checks every {monitor.interval}m
                  </span>
                  {lastCheck && (
                    <span className="text-xs text-pulse-dim font-mono">
                      · last check {timeAgo(lastCheck.checkedAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleActive}
                disabled={toggling}
                className={`btn-ghost flex items-center gap-1.5 text-xs ${
                  monitor.isActive ? "" : "border-pulse-amber/40 text-pulse-amber"
                }`}
              >
                {monitor.isActive ? (
                  <Pause className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                {monitor.isActive ? "Pause" : "Resume"}
              </button>
              <button
                onClick={copyStatusUrl}
                className="btn-ghost flex items-center gap-1.5 text-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-pulse-green" /> : <Share2 className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Status page"}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2 text-pulse-dim hover:text-pulse-red hover:bg-pulse-red-dim rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            icon={<TrendingUp className="w-4 h-4 text-pulse-cyan" />}
            label="24h uptime"
            value={formatUptime(stats?.uptimeDay)}
            valueClass={getUptimeColor(stats?.uptimeDay)}
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4 text-pulse-muted2" />}
            label="7d uptime"
            value={formatUptime(stats?.uptimeWeek)}
            valueClass={getUptimeColor(stats?.uptimeWeek)}
          />
          <StatCard
            icon={<Zap className="w-4 h-4 text-pulse-amber" />}
            label="Avg response"
            value={formatResponseTime(stats?.avgResponseTimeDay)}
          />
          <StatCard
            icon={<CheckCircle className="w-4 h-4 text-pulse-green" />}
            label="Uptime streak"
            value={stats?.currentStreak ? `${stats.currentStreak} checks` : "—"}
          />
        </div>

        {/* Response time chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-pulse-text">
              Response time
            </h2>
            <span className="stat-label">last 24 hours</span>
          </div>
          <ResponseTimeChart checks={checks} />
        </div>

        {/* Incident history */}
        {stats?.incidents && stats.incidents.length > 0 && (
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-pulse-text mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-pulse-amber" />
              Incident history
            </h2>
            <div className="space-y-2">
              {stats.incidents.map((incident: any) => (
                <div
                  key={incident.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-pulse-muted border border-pulse-border text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    {incident.isOngoing ? (
                      <span className="badge-down">ongoing</span>
                    ) : (
                      <span className="badge-up">resolved</span>
                    )}
                    <span className="text-pulse-muted2">
                      Started {timeAgo(incident.startedAt)}
                    </span>
                  </div>
                  {incident.resolvedAt && (
                    <span className="text-pulse-dim">
                      Resolved {timeAgo(incident.resolvedAt)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Check history table */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-pulse-text mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-pulse-muted2" />
            Check history
            <span className="text-pulse-dim font-normal">· last 24h</span>
          </h2>
          {checks.length === 0 ? (
            <p className="text-pulse-dim text-sm text-center py-8 font-mono">
              No checks yet. First check runs shortly.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-pulse-border">
                    <th className="text-left text-pulse-muted2 font-normal pb-2 pr-4">Status</th>
                    <th className="text-left text-pulse-muted2 font-normal pb-2 pr-4">Time</th>
                    <th className="text-right text-pulse-muted2 font-normal pb-2 pr-4">Response</th>
                    <th className="text-right text-pulse-muted2 font-normal pb-2">HTTP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pulse-border">
                  {[...checks].reverse().slice(0, 50).map((check, i) => (
                    <tr key={i} className="hover:bg-pulse-muted transition-colors">
                      <td className="py-2 pr-4">
                        {check.isUp ? (
                          <span className="flex items-center gap-1 text-pulse-green">
                            <CheckCircle className="w-3 h-3" /> UP
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-pulse-red">
                            <XCircle className="w-3 h-3" /> DOWN
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-pulse-muted2">
                        {timeAgo(check.checkedAt)}
                      </td>
                      <td className="py-2 pr-4 text-right text-pulse-text">
                        {formatResponseTime(check.responseTimeMs)}
                      </td>
                      <td className={`py-2 text-right ${
                        check.statusCode && check.statusCode < 400
                          ? "text-pulse-green"
                          : "text-pulse-red"
                      }`}>
                        {check.statusCode ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="card px-4 py-3.5">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="stat-label">{label}</span>
      </div>
      <p className={`text-lg font-mono font-semibold ${valueClass ?? "text-pulse-text"}`}>
        {value}
      </p>
    </div>
  );
}
