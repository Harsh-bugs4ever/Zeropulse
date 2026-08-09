"use client";

import Link from "next/link";
import { ExternalLink, Clock, ArrowRight } from "lucide-react";
import { formatResponseTime, formatUptime, getUptimeColor, timeAgo } from "@/lib/utils";
import type { MonitorWithStats } from "@/types";

interface Props {
  monitor: MonitorWithStats;
  index: number;
}

export function MonitorCard({ monitor, index }: Props) {
  const isUp      = monitor.status === "up";
  const isDown    = monitor.status === "down";
  const isUnknown = monitor.status === "unknown";

  return (
    <Link
      href={`/monitor/${monitor.id}`}
      className="card group block p-5 hover:border-pulse-cyan/40 hover:shadow-cyan-glow transition-all duration-200"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: status + info */}
        <div className="flex items-start gap-3 min-w-0">
          {/* Pulse dot */}
          <div className="mt-0.5 flex-shrink-0">
            <div
              className={`pulse-dot ${
                isUp ? "up" : isDown ? "down" : "unknown"
              }`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-pulse-text text-sm truncate">
                {monitor.name}
              </h3>
              {monitor.isOngoingIncident && (
                <span className="badge-down text-[10px]">incident</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-0.5">
              <a
                href={monitor.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-pulse-muted2 hover:text-pulse-cyan transition-colors truncate max-w-[220px] flex items-center gap-1"
              >
                {monitor.url}
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>

            {/* Last checked */}
            {monitor.lastCheckedAt && (
              <p className="flex items-center gap-1 text-[11px] text-pulse-dim mt-1">
                <Clock className="w-3 h-3" />
                checked {timeAgo(monitor.lastCheckedAt)}
              </p>
            )}
          </div>
        </div>

        {/* Right: stats */}
        <div className="flex items-center gap-6 flex-shrink-0">
          {/* Status badge */}
          <div>
            {isUp      && <span className="badge-up">UP</span>}
            {isDown    && <span className="badge-down">DOWN</span>}
            {isUnknown && <span className="badge-unknown">PENDING</span>}
          </div>

          {/* Uptime */}
          <div className="hidden sm:block text-right">
            <p className="stat-label">24h uptime</p>
            <p className={`font-mono text-sm font-semibold ${getUptimeColor(monitor.uptimeDay)}`}>
              {formatUptime(monitor.uptimeDay)}
            </p>
          </div>

          {/* Response time */}
          <div className="hidden md:block text-right">
            <p className="stat-label">avg resp</p>
            <p className="font-mono text-sm font-semibold text-pulse-text">
              {formatResponseTime(monitor.avgResponseTime)}
            </p>
          </div>

          {/* Arrow */}
          <ArrowRight className="w-4 h-4 text-pulse-dim group-hover:text-pulse-cyan transition-colors" />
        </div>
      </div>

      {/* Mini uptime bar — last 24h visualized as colored segments */}
      {monitor.uptimeDay !== null && (
        <div className="mt-4 pt-4 border-t border-pulse-border">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono text-pulse-dim">
              Last 24 hours
            </span>
            <span className={`text-[10px] font-mono ${getUptimeColor(monitor.uptimeDay)}`}>
              {formatUptime(monitor.uptimeDay)} uptime
            </span>
          </div>
          <UptimeMiniBar uptime={monitor.uptimeDay ?? 100} />
        </div>
      )}
    </Link>
  );
}

function UptimeMiniBar({ uptime }: { uptime: number }) {
  const TOTAL = 48; // represent 24h as 48 half-hour blocks
  const downCount = Math.round(((100 - uptime) / 100) * TOTAL);

  // Distribute down blocks somewhat randomly for visual realism
  const segments = Array.from({ length: TOTAL }, (_, i) => {
    const isDown = i >= TOTAL - downCount;
    return isDown;
  });

  return (
    <div className="flex gap-0.5 h-5">
      {segments.map((isDown, i) => (
        <div
          key={i}
          className={`uptime-bar-segment rounded-sm transition-colors ${
            isDown
              ? "bg-pulse-red/40"
              : "bg-pulse-green/30 hover:bg-pulse-green/50"
          }`}
        />
      ))}
    </div>
  );
}
