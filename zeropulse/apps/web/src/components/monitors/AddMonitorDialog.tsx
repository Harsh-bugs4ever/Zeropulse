"use client";

import { useState } from "react";
import { X, Plus, Globe, Clock, Mail, Loader2 } from "lucide-react";
import type { CreateMonitorPayload } from "@/types";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const INTERVALS = [
  { value: 1,  label: "Every 1 minute" },
  { value: 5,  label: "Every 5 minutes" },
  { value: 10, label: "Every 10 minutes" },
  { value: 30, label: "Every 30 minutes" },
];

export function AddMonitorDialog({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<CreateMonitorPayload>({
    name:       "",
    url:        "https://",
    interval:   5,
    alertEmail: "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit() {
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!form.url.trim())  { setError("URL is required");  return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/monitors", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create monitor");
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md card p-6 animate-fadeInUp">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-pulse-text">
              Add monitor
            </h2>
            <p className="text-xs text-pulse-muted2 mt-0.5">
              Start tracking uptime in seconds
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-pulse-dim hover:text-pulse-text rounded-md hover:bg-pulse-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="stat-label mb-1.5 block">Monitor name</label>
            <input
              className="input"
              placeholder="Production API"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              autoFocus
            />
          </div>

          {/* URL */}
          <div>
            <label className="stat-label mb-1.5 block">
              <Globe className="inline w-3 h-3 mr-1" />
              URL to monitor
            </label>
            <input
              className="input"
              placeholder="https://api.example.com/health"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            />
          </div>

          {/* Interval */}
          <div>
            <label className="stat-label mb-1.5 block">
              <Clock className="inline w-3 h-3 mr-1" />
              Check interval
            </label>
            <select
              className="input appearance-none cursor-pointer"
              value={form.interval}
              onChange={(e) =>
                setForm((f) => ({ ...f, interval: parseInt(e.target.value) }))
              }
            >
              {INTERVALS.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>

          {/* Alert Email */}
          <div>
            <label className="stat-label mb-1.5 block">
              <Mail className="inline w-3 h-3 mr-1" />
              Alert email{" "}
              <span className="text-pulse-dim normal-case tracking-normal">
                (optional)
              </span>
            </label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={form.alertEmail}
              onChange={(e) =>
                setForm((f) => ({ ...f, alertEmail: e.target.value }))
              }
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-pulse-red bg-pulse-red-dim border border-pulse-red border-opacity-20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {loading ? "Creating…" : "Create monitor"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
