import { describe, expect, it } from "vitest";
import { isApiRequest } from "./_core/vite";

describe("API fallback guard", () => {
  it("identifies API paths even when the request has query parameters", () => {
    expect(isApiRequest("/api/trpc/auth.me?batch=1")).toBe(true);
    expect(isApiRequest("/api/scheduled/github-release-sync")).toBe(true);
    expect(isApiRequest("/api")).toBe(true);
  });

  it("leaves application routes available for the HTML SPA fallback", () => {
    expect(isApiRequest("/?from_webdev=1")).toBe(false);
    expect(isApiRequest("/labeler")).toBe(false);
  });
});
