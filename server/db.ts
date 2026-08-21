import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  analyses,
  annotationImages,
  annotationProjects,
  AnnotationImage,
  InsertAnnotationImage,
  InsertAnalysis,
  InsertTrainingRelease,
  InsertTrainingSyncState,
  InsertUser,
  trainingReleases,
  trainingSyncStates,
  users,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createAnalysis(analysis: InsertAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة.");

  const result = await db.insert(analyses).values(analysis);
  const analysisId = Number(result[0]?.insertId);
  const created = await db.select().from(analyses).where(eq(analyses.id, analysisId)).limit(1);
  return created[0];
}

export async function getAnalysisForUser(analysisId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة.");

  const rows = await db
    .select()
    .from(analyses)
    .where(and(eq(analyses.id, analysisId), eq(analyses.userId, userId)))
    .limit(1);
  return rows[0];
}

export async function listAnalysesForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة.");

  return db.select().from(analyses).where(eq(analyses.userId, userId)).orderBy(desc(analyses.createdAt));
}

export async function updateAnalysisModelStatus(analysisId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة.");

  await db
    .update(analyses)
    .set({ status: "model_not_configured", completedAt: new Date(), extractedText: "", detections: [] })
    .where(and(eq(analyses.id, analysisId), eq(analyses.userId, userId)));
  return getAnalysisForUser(analysisId, userId);
}

export async function getLatestTrainingRelease() {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة.");
  const rows = await db.select().from(trainingReleases).orderBy(desc(trainingReleases.syncedAt)).limit(1);
  return rows[0];
}

export async function upsertTrainingRelease(release: InsertTrainingRelease) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة.");
  await db.insert(trainingReleases).values(release).onDuplicateKeyUpdate({
    set: {
      sourceCommit: release.sourceCommit,
      modelScope: release.modelScope,
      publicationStatus: release.publicationStatus,
      realManuscriptOcrValidated: release.realManuscriptOcrValidated,
      releaseUrl: release.releaseUrl,
      releaseSha256: release.releaseSha256,
      metrics: release.metrics,
      dataContract: release.dataContract,
      assets: release.assets,
      syncedAt: new Date(),
    },
  });
  const rows = await db.select().from(trainingReleases).where(eq(trainingReleases.releaseId, release.releaseId)).limit(1);
  return rows[0];
}

export async function getTrainingSyncState(stateKey: string) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة.");
  const rows = await db.select().from(trainingSyncStates).where(eq(trainingSyncStates.stateKey, stateKey)).limit(1);
  return rows[0];
}

export async function getTrainingSyncStateByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة.");
  const rows = await db.select().from(trainingSyncStates).where(eq(trainingSyncStates.scheduleCronTaskUid, taskUid)).limit(1);
  return rows[0];
}

export async function upsertTrainingSyncState(state: InsertTrainingSyncState) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة.");
  await db.insert(trainingSyncStates).values(state).onDuplicateKeyUpdate({
    set: {
      repository: state.repository,
      branch: state.branch,
      pointerPath: state.pointerPath,
      scheduleCronTaskUid: state.scheduleCronTaskUid,
      lastPointerSha256: state.lastPointerSha256,
      lastReleaseId: state.lastReleaseId,
      lastCheckedAt: state.lastCheckedAt,
      lastSuccessAt: state.lastSuccessAt,
      lastError: state.lastError,
    },
  });
  return getTrainingSyncState(state.stateKey);
}

export async function getOrCreateAnnotationProject(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة.");
  const existing = await db.select().from(annotationProjects).where(eq(annotationProjects.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  const result = await db.insert(annotationProjects).values({
    userId,
    title: "مجموعة وسوم البرمية القديمة",
    description: "صور حقيقية للمراجعة اليدوية قبل أي تصدير أو تدريب.",
  });
  const projectId = Number(result[0]?.insertId);
  const created = await db.select().from(annotationProjects).where(eq(annotationProjects.id, projectId)).limit(1);
  return created[0];
}

export async function listAnnotationImagesForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة.");
  return db.select().from(annotationImages).where(eq(annotationImages.userId, userId)).orderBy(desc(annotationImages.updatedAt));
}

export async function getAnnotationImageForUser(imageId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة.");
  const rows = await db.select().from(annotationImages).where(and(eq(annotationImages.id, imageId), eq(annotationImages.userId, userId))).limit(1);
  return rows[0];
}

export async function getAnnotationImageBySourceLibraryId(userId: number, sourceLibraryId: string) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة.");
  const rows = await db
    .select()
    .from(annotationImages)
    .where(and(eq(annotationImages.userId, userId), eq(annotationImages.sourceLibraryId, sourceLibraryId)))
    .limit(1);
  return rows[0];
}

export async function createAnnotationImage(image: InsertAnnotationImage) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة.");
  const result = await db.insert(annotationImages).values(image);
  const imageId = Number(result[0]?.insertId);
  const created = await db.select().from(annotationImages).where(eq(annotationImages.id, imageId)).limit(1);
  return created[0];
}

export async function updateAnnotationImageForUser(
  imageId: number,
  userId: number,
  changes: Partial<Pick<AnnotationImage, "boxes" | "annotationStatus" | "split" | "notes" | "sourceTitle" | "repositoryId" | "folioOrPage" | "sourceUrl" | "rightsBasis" | "oldPermicVisible" | "imageWidth" | "imageHeight" | "reviewedAt">>,
) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة.");
  await db.update(annotationImages).set({ ...changes, updatedAt: new Date() }).where(and(eq(annotationImages.id, imageId), eq(annotationImages.userId, userId)));
  return getAnnotationImageForUser(imageId, userId);
}

// TODO: add feature queries here as your schema grows.
