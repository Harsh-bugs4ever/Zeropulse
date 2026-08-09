"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Activity, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { MonitorCard } from "@/components/monitors/MonitorCard";
import { AddMonitorDialog } from "@/components/monitors/AddMonitorDialog";
import type { MonitorWithStats } from "@/types";

const REFRESH_INTERVAL = 30_000; // 30 seconds

export default function DashboardPage() {
  const [monitors, setMonitors] = useState<MonitorWithStats[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const fetchMonitors = useCallback(async () => {
    try {
      const res  = await fetch("/api/monitors");
      const data = await res.json();
      setMonitors(data);
      setLastSync(new Date());
    } catch (err) {
      console.error("Failed to fetch monitors", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitors();
    const interval = setInterval(fetchMonitors, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMonitors]);

  // Stats
  const totalUp      = monitors.filter((m) => m.status === "up").length;
  const totalDown    = monitors.filter((m) => m.status === "down").length;
  const avgUptime    = monitors.length
    ? monitors
        .filter((m) => m.uptimeDay !== null)
        .reduce((s, m) => s + (m.uptimeDay ?? 0), 0) /
      Math.max(monitors.filter((m) => m.uptimeDay !== null).length, 1)
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8">
        {/* Hero header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-pulse-text tracking-tight">
              Monitor dashboard
            </h1>
            <p className="text-sm text-pulse-muted2 mt-1">
              {monitors.length === 0
                ? "Add your first monitor to start tracking uptime."
                : `Watching ${monitors.length} endpoint${monitors.length !== 1 ? "s" : ""} in real time.`}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add monitor
          </button>
        </div>

        {/* Stats row */}
        {monitors.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<Activity className="w-4 h-4 text-pulse-cyan" />}
              label="Total monitors"
              value={monitors.length.toString()}
            />
            <StatCard
              icon={<CheckCircle className="w-4 h-4 text-pulse-green" />}
              label="Operational"
              value={totalUp.toString()}
              valueClass="text-pulse-green"
            />
            <StatCard
              icon={<XCircle className="w-4 h-4 text-pulse-red" />}
              label="Down now"
              value={totalDown.toString()}
              valueClass={totalDown > 0 ? "text-pulse-red" : undefined}
            />
            <StatCard
              icon={<Clock className="w-4 h-4 text-pulse-amber" />}
              label="Avg 24h uptime"
              value={avgUptime !== null ? `${avgUptime.toFixed(1)}%` : "—"}
              valueClass={avgUptime !== null && avgUptime >= 99 ? "text-pulse-green" : "text-pulse-amber"}
            />
          </div>
        )}

        {/* Monitor list */}
        {loading ? (
          <LoadingSkeleton />
        ) : monitors.length === 0 ? (
          <EmptyState onAdd={() => setShowAdd(true)} />
        ) : (
          <div className="space-y-3">
            {monitors.map((monitor, i) => (
              <div key={monitor.id} className="animate-fadeInUp" style={{ animationDelay: `${i * 50}ms` }}>
                <MonitorCard monitor={monitor} index={i} />
              </div>
            ))}
          </div>
        )}

        {/* Last sync */}
        {lastSync && (
          <div className="mt-6 flex items-center justify-end gap-1.5 text-xs text-pulse-dim font-mono">
            <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: "3s" }} />
            Auto-refreshes every 30s · last sync {lastSync.toLocaleTimeString()}
          </div>
        )}
      </main>

      {showAdd && (
        <AddMonitorDialog
          onClose={() => setShowAdd(false)}
          onCreated={fetchMonitors}
        />
      )}
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
      <p className={`text-xl font-mono font-semibold ${valueClass ?? "text-pulse-text"}`}>
        {value}
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-5 h-24 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer"
          />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card p-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-pulse-cyan-dim border border-pulse-cyan border-opacity-20 flex items-center justify-center mx-auto mb-5">
        <Activity className="w-7 h-7 text-pulse-cyan" />
      </div>
      <h2 className="text-base font-semibold text-pulse-text mb-2">
        Nothing to watch yet
      </h2>
      <p className="text-sm text-pulse-muted2 mb-6 max-w-xs mx-auto">
        Add your first endpoint and ZeroPulse will start checking it immediately.
      </p>
      <button onClick={onAdd} className="btn-primary inline-flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Add your first monitor
      </button>
    </div>
  );
}
