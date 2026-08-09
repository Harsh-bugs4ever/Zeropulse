import { Navbar } from "@/components/layout/Navbar";

export default function MonitorDetailLoading() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        {/* Back button skeleton */}
        <div className="h-4 w-24 bg-pulse-muted rounded animate-pulse" />

        {/* Header card skeleton */}
        <div className="card p-6">
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-pulse-muted animate-pulse mt-1.5" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-48 bg-pulse-muted rounded animate-pulse" />
              <div className="h-4 w-64 bg-pulse-muted/60 rounded animate-pulse" />
              <div className="flex gap-2 mt-2">
                <div className="h-5 w-24 bg-pulse-muted/40 rounded-full animate-pulse" />
                <div className="h-5 w-20 bg-pulse-muted/40 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card px-4 py-3.5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-pulse-muted rounded animate-pulse" />
                <div className="h-3 w-16 bg-pulse-muted/60 rounded animate-pulse" />
              </div>
              <div className="h-6 w-20 bg-pulse-muted rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Chart skeleton */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-28 bg-pulse-muted rounded animate-pulse" />
            <div className="h-3 w-20 bg-pulse-muted/60 rounded animate-pulse" />
          </div>
          <div className="h-52 relative overflow-hidden rounded-lg">
            <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />
          </div>
        </div>

        {/* Table skeleton */}
        <div className="card p-6">
          <div className="h-4 w-32 bg-pulse-muted rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-pulse-muted rounded-full animate-pulse" />
                  <div className="h-3 w-8 bg-pulse-muted/60 rounded animate-pulse" />
                </div>
                <div className="flex gap-4">
                  <div className="h-3 w-12 bg-pulse-muted/40 rounded animate-pulse" />
                  <div className="h-3 w-10 bg-pulse-muted/40 rounded animate-pulse" />
                  <div className="h-3 w-8 bg-pulse-muted/40 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
