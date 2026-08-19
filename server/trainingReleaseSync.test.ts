import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { fetchPublishedTrainingRelease } from "./trainingReleaseSync";

const sha256 = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");

describe("public training release sync", () => {
  it("accepts only a release whose pointer and declared metadata hashes match", async () => {
    const metricsText = JSON.stringify({ test_metrics: { map50_95: 0.5 }, interpretation: "synthetic baseline only" });
    const contractText = JSON.stringify({ class_map_sha256: "a".repeat(64), real_manuscripts_included: false });
    const classMapText = JSON.stringify({ classes: [{ id: 0, label: "𐍐" }] });
    const release = {
      schema_version: 1,
      release_id: "old_permic_s0_baseline_v1-20260819T000000Z",
      created_at_utc: "2026-08-19T00:00:00.000Z",
      publication_status: "published",
      source_commit: "43345fb1",
      model_scope: "synthetic-old-permic-character-baseline",
      real_manuscript_ocr_validated: false,
      metrics_file: "metrics.json",
      data_contract_file: "data_contract.json",
      class_map_file: "class_map.json",
      assets: [
        { path: "metrics.json", kind: "metrics", sha256: sha256(metricsText), bytes: metricsText.length },
        { path: "data_contract.json", kind: "data_contract", sha256: sha256(contractText), bytes: contractText.length },
        { path: "class_map.json", kind: "class_map", sha256: sha256(classMapText), bytes: classMapText.length },
      ],
      web_weight: null,
      required_before_web_inference: ["matching_class_map", "server-side_weight_loading", "integration_test"],
    };
    const releaseText = JSON.stringify(release);
    const pointerText = JSON.stringify({
      schema_version: 1,
      release_id: release.release_id,
      release_path: `artifacts/published/${release.release_id}/release.json`,
      release_sha256: sha256(releaseText),
    });

    const fetcher = async (input: string) => {
      if (input.endsWith("latest.json")) return new Response(pointerText, { status: 200 });
      if (input.endsWith("release.json")) return new Response(releaseText, { status: 200 });
      if (input.endsWith("metrics.json")) return new Response(metricsText, { status: 200 });
      if (input.endsWith("data_contract.json")) return new Response(contractText, { status: 200 });
      if (input.endsWith("class_map.json")) return new Response(classMapText, { status: 200 });
      return new Response("not found", { status: 404 });
    };

    const result = await fetchPublishedTrainingRelease(fetcher);

    expect(result.release.release_id).toBe(release.release_id);
    expect(result.metrics).toEqual(JSON.parse(metricsText));
    expect(result.dataContract).toEqual(JSON.parse(contractText));
    expect(result.classMap).toEqual(JSON.parse(classMapText));
  });

  it("rejects a release when latest.json does not match the release body", async () => {
    const pointerText = JSON.stringify({
      schema_version: 1,
      release_id: "old_permic_s0_baseline_v1-20260819T000000Z",
      release_path: "artifacts/published/old_permic_s0_baseline_v1-20260819T000000Z/release.json",
      release_sha256: "a".repeat(64),
    });
    const releaseText = JSON.stringify({ invalid: true });
    const fetcher = async (input: string) => new Response(input.endsWith("latest.json") ? pointerText : releaseText, { status: 200 });

    await expect(fetchPublishedTrainingRelease(fetcher)).rejects.toThrow("بصمة release.json لا تطابق latest.json");
  });

  it("reports that no published release exists when latest.json is absent", async () => {
    const fetcher = async () => new Response("not found", { status: 404 });

    await expect(fetchPublishedTrainingRelease(fetcher)).rejects.toThrow("NO_PUBLISHED_RELEASE");
  });

  it("rejects metadata that omits the declared class-map asset", async () => {
    const metricsText = JSON.stringify({ test_metrics: {} });
    const contractText = JSON.stringify({ class_map_sha256: "a".repeat(64) });
    const release = {
      schema_version: 1,
      release_id: "old_permic_s0_baseline_v1-20260819T000000Z",
      created_at_utc: "2026-08-19T00:00:00.000Z",
      publication_status: "published",
      source_commit: "43345fb1",
      model_scope: "synthetic-old-permic-character-baseline",
      real_manuscript_ocr_validated: false,
      metrics_file: "metrics.json",
      data_contract_file: "data_contract.json",
      class_map_file: "class_map.json",
      assets: [
        { path: "metrics.json", kind: "metrics", sha256: sha256(metricsText), bytes: metricsText.length },
        { path: "data_contract.json", kind: "data_contract", sha256: sha256(contractText), bytes: contractText.length },
        { path: "weights/best.pt", kind: "pytorch_weight", sha256: "b".repeat(64), bytes: 42 },
      ],
      web_weight: null,
      required_before_web_inference: ["matching_class_map"],
    };
    const releaseText = JSON.stringify(release);
    const pointerText = JSON.stringify({
      schema_version: 1,
      release_id: release.release_id,
      release_path: `artifacts/published/${release.release_id}/release.json`,
      release_sha256: sha256(releaseText),
    });
    const fetcher = async (input: string) => {
      if (input.endsWith("latest.json")) return new Response(pointerText, { status: 200 });
      if (input.endsWith("release.json")) return new Response(releaseText, { status: 200 });
      if (input.endsWith("metrics.json")) return new Response(metricsText, { status: 200 });
      return new Response(contractText, { status: 200 });
    };

    await expect(fetchPublishedTrainingRelease(fetcher)).rejects.toThrow("الإصدار لا يعلن الأصل المطلوب: class_map.json");
  });

  it("rejects an announced web weight when it is absent from the published assets", async () => {
    const metricsText = JSON.stringify({ test_metrics: {} });
    const contractText = JSON.stringify({ class_map_sha256: "a".repeat(64) });
    const classMapText = JSON.stringify({ classes: [] });
    const missingWeight = { path: "weights/best.pt", kind: "pytorch_weight", sha256: "c".repeat(64), bytes: 99 };
    const release = {
      schema_version: 1,
      release_id: "old_permic_s0_baseline_v1-20260819T000000Z",
      created_at_utc: "2026-08-19T00:00:00.000Z",
      publication_status: "published",
      source_commit: "43345fb1",
      model_scope: "synthetic-old-permic-character-baseline",
      real_manuscript_ocr_validated: false,
      metrics_file: "metrics.json",
      data_contract_file: "data_contract.json",
      class_map_file: "class_map.json",
      assets: [
        { path: "metrics.json", kind: "metrics", sha256: sha256(metricsText), bytes: metricsText.length },
        { path: "data_contract.json", kind: "data_contract", sha256: sha256(contractText), bytes: contractText.length },
        { path: "class_map.json", kind: "class_map", sha256: sha256(classMapText), bytes: classMapText.length },
      ],
      web_weight: missingWeight,
      required_before_web_inference: ["matching_class_map"],
    };
    const releaseText = JSON.stringify(release);
    const pointerText = JSON.stringify({ schema_version: 1, release_id: release.release_id, release_path: `artifacts/published/${release.release_id}/release.json`, release_sha256: sha256(releaseText) });
    const fetcher = async (input: string) => {
      if (input.endsWith("latest.json")) return new Response(pointerText, { status: 200 });
      if (input.endsWith("release.json")) return new Response(releaseText, { status: 200 });
      if (input.endsWith("metrics.json")) return new Response(metricsText, { status: 200 });
      if (input.endsWith("data_contract.json")) return new Response(contractText, { status: 200 });
      return new Response(classMapText, { status: 200 });
    };

    await expect(fetchPublishedTrainingRelease(fetcher)).rejects.toThrow("الإصدار لا يعلن الأصل المطلوب: weights/best.pt");
  });
});
