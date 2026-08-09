"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import type { CheckPoint } from "@/types";

interface Props {
  checks: CheckPoint[];
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  return (
    <div className="card px-3 py-2 shadow-xl text-xs font-mono">
      <p className="text-pulse-muted2 mb-1">
        {label ? format(new Date(label), "MMM d, HH:mm:ss") : ""}
      </p>
      {data?.isUp ? (
        <>
          <p className="text-pulse-green">
            ● {payload[0]?.value ?? "—"}ms
          </p>
          {data?.statusCode && (
            <p className="text-pulse-dim">HTTP {data.statusCode}</p>
          )}
        </>
      ) : (
        <p className="text-pulse-red">● DOWN</p>
      )}
    </div>
  );
}

export function ResponseTimeChart({ checks }: Props) {
  const data = checks.map((c) => ({
    time:           c.checkedAt,
    responseTime:   c.isUp ? (c.responseTimeMs ?? null) : null,
    isUp:           c.isUp,
    statusCode:     c.statusCode,
  }));

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-pulse-dim text-sm font-mono">
        No data yet — checks will appear here shortly
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.responseTime ?? 0));
  const avgVal = Math.round(
    data.reduce((s, d) => s + (d.responseTime ?? 0), 0) /
      data.filter((d) => d.responseTime !== null).length
  );

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="4 4"
            stroke="rgba(26,34,53,0.8)"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tickFormatter={(v) => format(new Date(v), "HH:mm")}
            tick={{ fill: "#5A6A84", fontSize: 10, fontFamily: "Geist Mono" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "#5A6A84", fontSize: 10, fontFamily: "Geist Mono" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}ms`}
            domain={[0, Math.ceil(maxVal * 1.2)]}
          />
          <Tooltip content={<CustomTooltip />} />
          {avgVal > 0 && (
            <ReferenceLine
              y={avgVal}
              stroke="rgba(0,212,255,0.25)"
              strokeDasharray="4 4"
              label={{
                value: `avg ${avgVal}ms`,
                fill: "#00D4FF",
                fontSize: 9,
                fontFamily: "Geist Mono",
                position: "insideTopRight",
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="responseTime"
            stroke="#00FF88"
            strokeWidth={1.5}
            dot={(props) => {
              const { cx, cy, payload } = props;
              if (!payload.isUp) {
                return (
                  <circle
                    key={`dot-${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={3}
                    fill="#FF4466"
                    stroke="none"
                  />
                );
              }
              return <circle key={`dot-${cx}-${cy}`} r={0} />;
            }}
            activeDot={{ r: 4, fill: "#00FF88", stroke: "#080C14", strokeWidth: 2 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
