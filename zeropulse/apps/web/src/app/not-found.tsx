import Link from "next/link";
import { Activity, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen grid-bg flex flex-col">
      <header className="border-b border-pulse-border bg-pulse-bg/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-pulse-cyan flex items-center justify-center shadow-cyan-glow">
              <Activity className="w-4 h-4 text-pulse-bg" strokeWidth={2.5} />
            </div>
            <span className="font-mono font-semibold text-pulse-text tracking-tight text-lg">
              Zero<span className="text-pulse-cyan">Pulse</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-pulse-surface border border-pulse-border flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8 text-pulse-dim" />
          </div>

          <h1 className="text-6xl font-mono font-bold text-pulse-cyan mb-3">
            404
          </h1>
          <h2 className="text-lg font-semibold text-pulse-text mb-2">
            Page not found
          </h2>
          <p className="text-sm text-pulse-muted2 mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          <Link
            href="/"
            className="btn-primary inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
