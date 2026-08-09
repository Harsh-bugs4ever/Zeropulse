import { Queue } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Singleton connection
const globalForRedis = globalThis as unknown as { redis: IORedis | undefined };

export const redis =
  globalForRedis.redis ??
  new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

// Singleton queue
const globalForQueue = globalThis as unknown as {
  monitorQueue: Queue | undefined;
};

export const monitorQueue =
  globalForQueue.monitorQueue ??
  new Queue("monitor-checks", {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  });

if (process.env.NODE_ENV !== "production")
  globalForQueue.monitorQueue = monitorQueue;

export async function scheduleMonitor(
  monitorId: string,
  intervalMinutes: number
) {
  const jobId = `monitor-${monitorId}`;

  // Remove existing repeatable job if any
  await monitorQueue.removeRepeatableByKey(
    `monitor-checks:${jobId}:::${intervalMinutes * 60 * 1000}`
  );

  // Add new repeatable job
  await monitorQueue.add(
    "check",
    { monitorId },
    {
      jobId,
      repeat: {
        every: intervalMinutes * 60 * 1000,
        immediately: true,
      },
    }
  );
}

export async function removeMonitorSchedule(monitorId: string) {
  const repeatableJobs = await monitorQueue.getRepeatableJobs();
  const job = repeatableJobs.find((j) => j.key.includes(monitorId));
  if (job) {
    await monitorQueue.removeRepeatableByKey(job.key);
  }
}
