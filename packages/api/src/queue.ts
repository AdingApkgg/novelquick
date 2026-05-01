import { Queue } from "bullmq";
import IORedis from "ioredis";

export const QUEUE_TRANSCODE = "transcode";

let connection: IORedis | null = null;
function getConnection() {
  if (!connection) {
    const url = process.env.REDIS_URL ?? "redis://localhost:6379";
    connection = new IORedis(url, { maxRetriesPerRequest: null });
  }
  return connection;
}

export type TranscodePayload = {
  jobId: string;
  episodeId: string;
  inputKey: string;
  outputDir: string;
};

let _queue: Queue<TranscodePayload> | null = null;

export function makeTranscodeQueue() {
  if (!_queue) {
    _queue = new Queue<TranscodePayload>(QUEUE_TRANSCODE, { connection: getConnection() });
  }
  return _queue;
}

export const transcodeQueue = {
  enqueue(payload: TranscodePayload) {
    return makeTranscodeQueue().add("hls", payload, {
      removeOnComplete: 100,
      removeOnFail: 100,
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    });
  },
};
