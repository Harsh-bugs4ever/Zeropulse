import { Worker, Queue } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "@zeropulse/db";
import { Resend } from "resend";

const REDIS_URL  = process.env.REDIS_URL  || "redis://localhost:6379";
const RESEND_KEY = process.env.RESEND_API_KEY || "";
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const TIMEOUT_MS = 10_000; // 10 second timeout per check

const redis  = new IORedis(REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: false });
const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null;

const queue = new Queue("monitor-checks", { connection: redis });

// ─── Core check function ──────────────────────────────────────────────────────

async function checkMonitor(monitorId: string): Promise<void> {
  const monitor = await prisma.monitor.findUnique({ where: { id: monitorId } });
  if (!monitor || !monitor.isActive) return;

  const start      = Date.now();
  let isUp         = false;
  let statusCode: number | null = null;
  let responseTimeMs: number | null = null;
  let errorMessage: string | null = null;

  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(monitor.url, {
      method:  "GET",
      signal:  controller.signal,
      headers: { "User-Agent": "ZeroPulse-Monitor/1.0" },
    });

    clearTimeout(timeout);
    responseTimeMs = Date.now() - start;
    statusCode     = res.status;
    isUp           = res.status >= 200 && res.status < 400;
  } catch (err: any) {
    responseTimeMs = Date.now() - start;
    errorMessage   = err?.message?.slice(0, 200) ?? "Unknown error";
    isUp           = false;
  }

  // Save check result
  await prisma.check.create({
    data: {
      monitorId,
      statusCode,
      responseTimeMs,
      isUp,
      errorMessage,
    },
  });

  // ── Incident management ──
  const ongoingIncident = await prisma.incident.findFirst({
    where: { monitorId, isOngoing: true },
  });

  if (!isUp && !ongoingIncident) {
    // Start new incident
    const incident = await prisma.incident.create({
      data: {
        monitorId,
        isOngoing:   true,
        errorReason: errorMessage ?? `HTTP ${statusCode}`,
      },
    });

    // Send alert email
    if (monitor.alertEmail && resend) {
      await sendDownAlert(monitor, statusCode, errorMessage);
    }

    console.log(`🔴 [${monitor.name}] DOWN — incident ${incident.id} started`);
  } else if (isUp && ongoingIncident) {
    // Resolve incident
    await prisma.incident.update({
      where: { id: ongoingIncident.id },
      data:  { resolvedAt: new Date(), isOngoing: false },
    });

    // Send recovery email
    if (monitor.alertEmail && resend) {
      await sendRecoveryAlert(monitor);
    }

    console.log(`🟢 [${monitor.name}] RECOVERED — incident resolved`);
  } else {
    const symbol = isUp ? "✅" : "⚠️";
    console.log(
      `${symbol} [${monitor.name}] ${isUp ? "UP" : "DOWN"} — ${responseTimeMs}ms${
        statusCode ? ` HTTP ${statusCode}` : ""
      }`
    );
  }
}

// ─── Email alerts ─────────────────────────────────────────────────────────────

async function sendDownAlert(
  monitor: { name: string; url: string; slug: string; alertEmail: string | null },
  statusCode: number | null,
  errorMessage: string | null
) {
  try {
    await resend!.emails.send({
      from:    "ZeroPulse <alerts@zeropulse.dev>",
      to:      monitor.alertEmail!,
      subject: `🔴 [DOWN] ${monitor.name} is not responding`,
      html: `
        <div style="font-family:monospace;background:#080C14;color:#E2E8F4;padding:32px;border-radius:12px;max-width:480px">
          <h2 style="color:#FF4466;margin:0 0 16px">🔴 Service Down</h2>
          <p style="margin:0 0 8px"><strong>Monitor:</strong> ${monitor.name}</p>
          <p style="margin:0 0 8px"><strong>URL:</strong> <a href="${monitor.url}" style="color:#00D4FF">${monitor.url}</a></p>
          ${statusCode ? `<p style="margin:0 0 8px"><strong>Status:</strong> HTTP ${statusCode}</p>` : ""}
          ${errorMessage ? `<p style="margin:0 0 8px"><strong>Error:</strong> ${errorMessage}</p>` : ""}
          <p style="margin:0 0 16px"><strong>Time:</strong> ${new Date().toUTCString()}</p>
          <a href="${APP_URL}/status/${monitor.slug}"
             style="display:inline-block;background:#00D4FF;color:#080C14;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">
            View status page
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send down alert:", err);
  }
}

async function sendRecoveryAlert(monitor: {
  name: string;
  url: string;
  slug: string;
  alertEmail: string | null;
}) {
  try {
    await resend!.emails.send({
      from:    "ZeroPulse <alerts@zeropulse.dev>",
      to:      monitor.alertEmail!,
      subject: `✅ [RECOVERED] ${monitor.name} is back online`,
      html: `
        <div style="font-family:monospace;background:#080C14;color:#E2E8F4;padding:32px;border-radius:12px;max-width:480px">
          <h2 style="color:#00FF88;margin:0 0 16px">✅ Service Recovered</h2>
          <p style="margin:0 0 8px"><strong>Monitor:</strong> ${monitor.name}</p>
          <p style="margin:0 0 8px"><strong>URL:</strong> <a href="${monitor.url}" style="color:#00D4FF">${monitor.url}</a></p>
          <p style="margin:0 0 16px"><strong>Recovered at:</strong> ${new Date().toUTCString()}</p>
          <a href="${APP_URL}/status/${monitor.slug}"
             style="display:inline-block;background:#00D4FF;color:#080C14;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">
            View status page
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send recovery alert:", err);
  }
}

// ─── Bootstrap existing monitors on startup ───────────────────────────────────

async function bootstrapMonitors() {
  const monitors = await prisma.monitor.findMany({ where: { isActive: true } });
  console.log(`🚀 Bootstrapping ${monitors.length} monitor(s)...`);

  for (const monitor of monitors) {
    const jobKey = `monitor-${monitor.id}`;
    const existingJobs = await queue.getRepeatableJobs();
    const exists = existingJobs.some((j) => j.key.includes(monitor.id));

    if (!exists) {
      await queue.add(
        "check",
        { monitorId: monitor.id },
        {
          jobId:  jobKey,
          repeat: { every: monitor.interval * 60 * 1000, immediately: true },
        }
      );
      console.log(`  ✓ Scheduled [${monitor.name}] every ${monitor.interval}m`);
    } else {
      console.log(`  - [${monitor.name}] already scheduled`);
    }
  }
}

// ─── Worker ──────────────────────────────────────────────────────────────────

const worker = new Worker(
  "monitor-checks",
  async (job) => {
    const { monitorId } = job.data;
    if (!monitorId) {
      console.warn("Job missing monitorId", job.id);
      return;
    }
    await checkMonitor(monitorId);
  },
  {
    connection:  redis,
    concurrency: 10,
  }
);

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("Worker error:", err);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────

async function shutdown() {
  console.log("\nShutting down gracefully...");
  await worker.close();
  await redis.quit();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT",  shutdown);

// ─── Start ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("⚡ ZeroPulse Worker starting...");
  await bootstrapMonitors();
  console.log("✅ Worker ready and processing jobs");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
