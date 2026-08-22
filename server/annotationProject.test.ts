import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const image = {
  id: 7,
  projectId: 3,
  userId: 1,
  origin: "source_library" as const,
  sourceLibraryId: "volok-11-f268-figure-12",
  originalFilename: "volok-11-f268-figure-12.jpg",
  imageKey: null,
  imageUrl: "/manus-storage/example.jpg",
  mimeType: "image/jpeg",
  sourceTitle: "Volok. 11",
  repositoryId: "RSL / Volok. 11",
  folioOrPage: "f. 268",
  sourceUrl: "https://example.org/source",
  rightsBasis: "مراجعة حقوق مطلوبة",
  oldPermicVisible: true,
  split: "unassigned" as const,
  annotationStatus: "in_progress" as const,
  boxes: [],
  notes: null,
  imageWidth: null,
  imageHeight: null,
  reviewedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

vi.mock("./db", () => ({
  createAnalysis: vi.fn(),
  createAnnotationImage: vi.fn(),
  deleteAnnotationImageForUser: vi.fn(async () => image),
  getAnalysisForUser: vi.fn(),
  getAnnotationImageBySourceLibraryId: vi.fn(async () => image),
  getAnnotationImageForUser: vi.fn(async () => image),
  getOrCreateAnnotationProject: vi.fn(async () => ({ id: 3, userId: 1, title: "مشروع", description: null, createdAt: new Date(), updatedAt: new Date() })),
  listAnalysesForUser: vi.fn(),
  listAnnotationImagesForUser: vi.fn(async () => [image]),
  updateAnalysisModelStatus: vi.fn(),
  updateAnnotationImageForUser: vi.fn(async () => image),
}));

vi.mock("./trainingReleaseSync", () => ({ getTrainingReleaseOverview: vi.fn(), syncPublishedTrainingRelease: vi.fn() }));

const { appRouter } = await import("./routers");

function context(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "researcher-1",
      name: "Researcher",
      email: null,
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("annotation project router", () => {
  it("returns an existing source image without duplicating it in the workspace", async () => {
    const caller = appRouter.createCaller(context());
    const result = await caller.annotation.importSource({
      sourceLibraryId: "volok-11-f268-figure-12",
      sourceTitle: "Volok. 11",
      imageUrl: "/manus-storage/example.jpg",
      sourceUrl: "https://example.org/source",
      repositoryId: "RSL / Volok. 11",
      folioOrPage: "f. 268",
      rightsBasis: "مراجعة حقوق مطلوبة",
    });
    expect(result).toMatchObject({ id: 7, sourceLibraryId: "volok-11-f268-figure-12" });
  });

  it("blocks a reviewed or approved status until boxes and an explicit split exist", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.annotation.save({
      imageId: 7,
      boxes: [],
      annotationStatus: "approved",
      split: "unassigned",
      notes: null,
      sourceTitle: "Volok. 11",
      repositoryId: "RSL / Volok. 11",
      folioOrPage: "f. 268",
      sourceUrl: "https://example.org/source",
      rightsBasis: "مراجعة حقوق مطلوبة",
      oldPermicVisible: true,
      imageWidth: 1200,
      imageHeight: 800,
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("returns explicit export blockers until all three reviewed splits are represented", async () => {
    const caller = appRouter.createCaller(context());
    const result = await caller.annotation.exportReviewReady();
    expect(result.canExport).toBe(false);
    expect(result.blockers).toContain("لا توجد صورة مراجعة في تقسيم train.");
    expect(result.blockers).toContain("لا توجد صورة مراجعة في تقسيم val.");
    expect(result.blockers).toContain("لا توجد صورة مراجعة في تقسيم test.");
  });

  it("deletes only the caller's image record and its stored annotation boxes", async () => {
    const caller = appRouter.createCaller(context());
    const result = await caller.annotation.delete({ imageId: 7 });
    expect(result).toEqual({ id: 7, originalFilename: "volok-11-f268-figure-12.jpg", removedBoxCount: 0 });
  });
});
