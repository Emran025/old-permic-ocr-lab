import type { Request, Response } from "express";
import { getTrainingSyncStateByTaskUid } from "./db";
import { sdk } from "./_core/sdk";
import { syncPublishedTrainingRelease } from "./trainingReleaseSync";

export async function handleGithubReleaseSyncCron(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req as unknown as Request);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const state = await getTrainingSyncStateByTaskUid(user.taskUid);
    if (!state) {
      return res.json({ ok: true, skipped: "orphan" });
    }
    const result = await syncPublishedTrainingRelease();
    return res.json({ ok: true, result: result.kind, releaseId: result.kind === "synced" ? result.release?.releaseId : null });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: detail,
      stack: error instanceof Error ? error.stack : undefined,
      context: { route: "/api/scheduled/github-release-sync", taskUid: req.headers["x-manus-task-uid"] ?? null },
      timestamp: new Date().toISOString(),
    });
  }
}
