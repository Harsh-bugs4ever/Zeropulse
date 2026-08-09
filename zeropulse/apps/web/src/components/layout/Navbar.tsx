"use client";

import Link from "next/link";
import { Activity, Github, Zap } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-pulse-border bg-pulse-bg/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="w-7 h-7 rounded-lg bg-pulse-cyan flex items-center justify-center shadow-cyan-glow">
              <Activity className="w-4 h-4 text-pulse-bg" strokeWidth={2.5} />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-pulse-green animate-pulse" />
          </div>
          <span className="font-mono font-semibold text-pulse-text tracking-tight text-lg">
            Zero<span className="text-pulse-cyan">Pulse</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden sm:flex items-center gap-1">
          <Link
            href="/"
            className="px-3 py-1.5 text-sm text-pulse-muted2 hover:text-pulse-text rounded-md hover:bg-pulse-muted transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/status"
            className="px-3 py-1.5 text-sm text-pulse-muted2 hover:text-pulse-text rounded-md hover:bg-pulse-muted transition-colors"
          >
            Status
          </Link>
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          <a
            href="https://zerops.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-pulse-muted2 hover:text-pulse-cyan transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            Powered by Zerops
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-pulse-muted2 hover:text-pulse-text transition-colors rounded-md hover:bg-pulse-muted"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
