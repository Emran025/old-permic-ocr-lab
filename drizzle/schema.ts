import { boolean, index, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const analyses = mysqlTable("analyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  originalFilename: varchar("originalFilename", { length: 255 }).notNull(),
  imageKey: varchar("imageKey", { length: 512 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["pending", "model_not_configured", "completed", "failed"])
    .notNull()
    .default("pending"),
  extractedText: text("extractedText"),
  detections: json("detections").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

/** Public training releases published by the Colab notebook after test evaluation. */
export const trainingReleases = mysqlTable("training_releases", {
  id: int("id").autoincrement().primaryKey(),
  releaseId: varchar("releaseId", { length: 180 }).notNull().unique(),
  sourceCommit: varchar("sourceCommit", { length: 64 }).notNull(),
  modelScope: varchar("modelScope", { length: 180 }).notNull(),
  publicationStatus: varchar("publicationStatus", { length: 64 }).notNull(),
  realManuscriptOcrValidated: boolean("realManuscriptOcrValidated").notNull().default(false),
  releaseUrl: text("releaseUrl").notNull(),
  releaseSha256: varchar("releaseSha256", { length: 64 }).notNull(),
  metrics: json("metrics").notNull(),
  dataContract: json("dataContract").notNull(),
  assets: json("assets").notNull(),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Singleton configuration and health state for the project-level GitHub release check. */
export const trainingSyncStates = mysqlTable("training_sync_states", {
  id: int("id").autoincrement().primaryKey(),
  stateKey: varchar("stateKey", { length: 96 }).notNull().unique(),
  repository: varchar("repository", { length: 255 }).notNull(),
  branch: varchar("branch", { length: 128 }).notNull(),
  pointerPath: varchar("pointerPath", { length: 512 }).notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }).unique(),
  lastPointerSha256: varchar("lastPointerSha256", { length: 64 }),
  lastReleaseId: varchar("lastReleaseId", { length: 180 }),
  lastCheckedAt: timestamp("lastCheckedAt"),
  lastSuccessAt: timestamp("lastSuccessAt"),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** A user-owned workspace for manual review of real Old Permic manuscript images. */
export const annotationProjects = mysqlTable("annotation_projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("annotation_projects_user_idx").on(table.userId)]);

/**
 * Real manuscript/source image plus its researcher-reviewed annotation state.
 * A record becomes exportable only in application logic after source, rights,
 * split, boxes, and review conditions are all satisfied.
 */
export const annotationImages = mysqlTable("annotation_images", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  origin: mysqlEnum("origin", ["source_library", "upload"]).notNull(),
  sourceLibraryId: varchar("sourceLibraryId", { length: 180 }),
  originalFilename: varchar("originalFilename", { length: 255 }).notNull(),
  imageKey: varchar("imageKey", { length: 512 }),
  imageUrl: text("imageUrl").notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  sourceTitle: varchar("sourceTitle", { length: 255 }).notNull(),
  repositoryId: varchar("repositoryId", { length: 255 }).notNull(),
  folioOrPage: varchar("folioOrPage", { length: 255 }).notNull(),
  sourceUrl: text("sourceUrl").notNull(),
  rightsBasis: text("rightsBasis").notNull(),
  oldPermicVisible: boolean("oldPermicVisible").notNull().default(true),
  split: mysqlEnum("split", ["unassigned", "train", "val", "test"]).notNull().default("unassigned"),
  annotationStatus: mysqlEnum("annotationStatus", ["in_progress", "needs_review", "reviewed", "approved", "excluded"])
    .notNull()
    .default("in_progress"),
  boxes: json("boxes").notNull(),
  notes: text("notes"),
  imageWidth: int("imageWidth"),
  imageHeight: int("imageHeight"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("annotation_images_project_idx").on(table.projectId),
  index("annotation_images_user_idx").on(table.userId),
  index("annotation_images_project_status_idx").on(table.projectId, table.annotationStatus),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = typeof analyses.$inferInsert;
export type TrainingRelease = typeof trainingReleases.$inferSelect;
export type InsertTrainingRelease = typeof trainingReleases.$inferInsert;
export type TrainingSyncState = typeof trainingSyncStates.$inferSelect;
export type InsertTrainingSyncState = typeof trainingSyncStates.$inferInsert;
export type AnnotationProject = typeof annotationProjects.$inferSelect;
export type InsertAnnotationProject = typeof annotationProjects.$inferInsert;
export type AnnotationImage = typeof annotationImages.$inferSelect;
export type InsertAnnotationImage = typeof annotationImages.$inferInsert;

// TODO: Add your tables here
