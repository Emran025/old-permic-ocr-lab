import { createHash } from "node:crypto";
import { z } from "zod";
import {
  getLatestTrainingRelease,
  getTrainingSyncState,
  upsertTrainingRelease,
  upsertTrainingSyncState,
} from "./db";

export const GITHUB_RELEASE_SYNC = {
  stateKey: "github-public-release-sync",
  repository: "Emran025/old-permic-ocr-lab",
  branch: "colab-results",
  pointerPath: "artifacts/published/latest.json",
} as const;

const HEX64 = /^[a-f0-9]{64}$/i;
const SAFE_RELATIVE_PATH = /^(?!.*(?:^|\/)\.\.(?:\/|$))[a-zA-Z0-9][a-zA-Z0-9._/-]{0,480}$/;

const releaseAssetSchema = z.object({
  path: z.string().regex(SAFE_RELATIVE_PATH),
  kind: z.string().min(1).max(80),
  sha256: z.string().regex(HEX64),
  bytes: z.number().int().nonnegative(),
});

const releaseSchema = z.object({
  schema_version: z.literal(1),
  release_id: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,179}$/),
  created_at_utc: z.string().datetime({ offset: true }),
  publication_status: z.literal("published"),
  source_commit: z.string().regex(/^[a-f0-9]{7,64}$/i),
  model_scope: z.literal("synthetic-old-permic-character-baseline"),
  real_manuscript_ocr_validated: z.literal(false),
  metrics_file: z.literal("metrics.json"),
  data_contract_file: z.literal("data_contract.json"),
  class_map_file: z.literal("class_map.json"),
  assets: z.array(releaseAssetSchema).min(3),
  web_weight: releaseAssetSchema.nullable(),
  required_before_web_inference: z.array(z.string()).min(1),
});

const pointerSchema = z.object({
  schema_version: z.literal(1),
  release_id: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,179}$/),
  release_path: z.string().regex(SAFE_RELATIVE_PATH),
  release_sha256: z.string().regex(HEX64),
});

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
type ReleasePayload = z.infer<typeof releaseSchema>;

function rawGithubUrl(path: string): string {
  return `https://raw.githubusercontent.com/${GITHUB_RELEASE_SYNC.repository}/${GITHUB_RELEASE_SYNC.branch}/${path}`;
}

function sha256Text(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

async function fetchText(fetcher: FetchLike, url: string, missingError: string): Promise<string> {
  const response = await fetcher(url, { headers: { accept: "application/json" } });
  if (response.status === 404) throw new Error(missingError);
  if (!response.ok) throw new Error(`GitHub release fetch failed (${response.status}).`);
  return response.text();
}

function parseJson(label: string, source: string): unknown {
  try {
    return JSON.parse(source);
  } catch {
    throw new Error(`${label} ليس JSON صالحًا.`);
  }
}

function assetFor(release: ReleasePayload, path: string) {
  const asset = release.assets.find((item) => item.path === path);
  if (!asset) throw new Error(`الإصدار لا يعلن الأصل المطلوب: ${path}`);
  return asset;
}

export async function fetchPublishedTrainingRelease(fetcher: FetchLike = fetch) {
  const pointerUrl = rawGithubUrl(GITHUB_RELEASE_SYNC.pointerPath);
  const pointerText = await fetchText(fetcher, pointerUrl, "NO_PUBLISHED_RELEASE");
  const pointer = pointerSchema.parse(parseJson("latest.json", pointerText));
  const releaseText = await fetchText(fetcher, rawGithubUrl(pointer.release_path), "PUBLISHED_RELEASE_MISSING");
  if (sha256Text(releaseText) !== pointer.release_sha256) {
    throw new Error("بصمة release.json لا تطابق latest.json.");
  }
  const release = releaseSchema.parse(parseJson("release.json", releaseText));
  if (release.release_id !== pointer.release_id) throw new Error("معرّف الإصدار لا يطابق latest.json.");

  const releaseBasePath = pointer.release_path.split("/").slice(0, -1).join("/");
  const metricsAsset = assetFor(release, release.metrics_file);
  const contractAsset = assetFor(release, release.data_contract_file);
  const classMapAsset = assetFor(release, release.class_map_file);
  if (release.web_weight) {
    const declaredWeight = assetFor(release, release.web_weight.path);
    if (declaredWeight.sha256 !== release.web_weight.sha256 || declaredWeight.bytes !== release.web_weight.bytes) {
      throw new Error("الوزن المعلن لا يطابق الأصل المدرج في الإصدار.");
    }
  }
  const metricsText = await fetchText(fetcher, rawGithubUrl(`${releaseBasePath}/${release.metrics_file}`), "PUBLISHED_ASSET_MISSING");
  const contractText = await fetchText(fetcher, rawGithubUrl(`${releaseBasePath}/${release.data_contract_file}`), "PUBLISHED_ASSET_MISSING");
  const classMapText = await fetchText(fetcher, rawGithubUrl(`${releaseBasePath}/${release.class_map_file}`), "PUBLISHED_ASSET_MISSING");
  if (sha256Text(metricsText) !== metricsAsset.sha256) throw new Error("بصمة metrics.json غير مطابقة.");
  if (sha256Text(contractText) !== contractAsset.sha256) throw new Error("بصمة data_contract.json غير مطابقة.");
  if (sha256Text(classMapText) !== classMapAsset.sha256) throw new Error("بصمة class_map.json غير مطابقة.");

  return {
    pointer,
    pointerUrl,
    release,
    releaseUrl: rawGithubUrl(pointer.release_path),
    metrics: parseJson("metrics.json", metricsText),
    dataContract: parseJson("data_contract.json", contractText),
    classMap: parseJson("class_map.json", classMapText),
    releaseSha256: sha256Text(releaseText),
  };
}

export async function syncPublishedTrainingRelease() {
  const now = new Date();
  try {
    const remote = await fetchPublishedTrainingRelease();
    const release = await upsertTrainingRelease({
      releaseId: remote.release.release_id,
      sourceCommit: remote.release.source_commit,
      modelScope: remote.release.model_scope,
      publicationStatus: remote.release.publication_status,
      realManuscriptOcrValidated: remote.release.real_manuscript_ocr_validated,
      releaseUrl: remote.releaseUrl,
      releaseSha256: remote.releaseSha256,
      metrics: remote.metrics,
      dataContract: remote.dataContract,
      assets: remote.release.assets,
      syncedAt: now,
    });
    await upsertTrainingSyncState({
      stateKey: GITHUB_RELEASE_SYNC.stateKey,
      repository: GITHUB_RELEASE_SYNC.repository,
      branch: GITHUB_RELEASE_SYNC.branch,
      pointerPath: GITHUB_RELEASE_SYNC.pointerPath,
      lastPointerSha256: remote.pointer.release_sha256,
      lastReleaseId: remote.release.release_id,
      lastCheckedAt: now,
      lastSuccessAt: now,
      lastError: null,
    });
    return { kind: "synced" as const, release };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const previous = await getTrainingSyncState(GITHUB_RELEASE_SYNC.stateKey).catch(() => undefined);
    await upsertTrainingSyncState({
      stateKey: GITHUB_RELEASE_SYNC.stateKey,
      repository: GITHUB_RELEASE_SYNC.repository,
      branch: GITHUB_RELEASE_SYNC.branch,
      pointerPath: GITHUB_RELEASE_SYNC.pointerPath,
      scheduleCronTaskUid: previous?.scheduleCronTaskUid ?? null,
      lastPointerSha256: previous?.lastPointerSha256 ?? null,
      lastReleaseId: previous?.lastReleaseId ?? null,
      lastCheckedAt: now,
      lastSuccessAt: previous?.lastSuccessAt ?? null,
      lastError: message === "NO_PUBLISHED_RELEASE" ? null : message.slice(0, 2000),
    });
    if (message === "NO_PUBLISHED_RELEASE") return { kind: "no_release" as const };
    throw error;
  }
}

export async function getTrainingReleaseOverview() {
  const [release, sync] = await Promise.all([
    getLatestTrainingRelease(),
    getTrainingSyncState(GITHUB_RELEASE_SYNC.stateKey),
  ]);
  return {
    repository: GITHUB_RELEASE_SYNC.repository,
    branch: GITHUB_RELEASE_SYNC.branch,
    pointerPath: GITHUB_RELEASE_SYNC.pointerPath,
    release,
    sync,
  };
}
