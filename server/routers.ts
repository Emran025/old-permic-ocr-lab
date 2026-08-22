import { COOKIE_NAME } from "@shared/const";
import { MODEL_STATUS } from "@shared/oldPermicOcr";
import { nanoid } from "nanoid";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createAnalysis,
  createAnnotationImage,
  deleteAnnotationImageForUser,
  getAnalysisForUser,
  getAnnotationImageBySourceLibraryId,
  getAnnotationImageForUser,
  getOrCreateAnnotationProject,
  listAnalysesForUser,
  listAnnotationImagesForUser,
  updateAnalysisModelStatus,
  updateAnnotationImageForUser,
} from "./db";
import { parseImageDataUrl, safeFileName } from "./oldPermicOcr";
import { storagePut } from "./storage";
import { getTrainingReleaseOverview, syncPublishedTrainingRelease } from "./trainingReleaseSync";

const annotationBoxInput = z.object({
  id: z.string().min(1).max(96),
  classId: z.number().int().min(0).max(37),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().positive().max(100),
  height: z.number().positive().max(100),
}).refine((box) => box.x + box.width <= 100.000001 && box.y + box.height <= 100.000001, {
  message: "حدود صندوق الوسم يجب أن تبقى داخل الصورة.",
});

const annotationStatusInput = z.enum(["in_progress", "needs_review", "reviewed", "approved", "excluded"]);
const annotationSplitInput = z.enum(["unassigned", "train", "val", "test"]);
const annotationRotationInput = z.enum(["0", "90", "180", "270"]);

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  ocr: router({
    modelStatus: protectedProcedure.query(() => MODEL_STATUS),
    upload: protectedProcedure
      .input(
        z.object({
          filename: z.string().min(1).max(255),
          dataUrl: z.string().min(32).max(7_000_000),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { buffer, mimeType } = parseImageDataUrl(input.dataUrl);
        const key = `old-permic-ocr/${ctx.user.id}/${Date.now()}-${nanoid(10)}-${safeFileName(input.filename)}`;
        const stored = await storagePut(key, buffer, mimeType);
        const analysis = await createAnalysis({
          userId: ctx.user.id,
          originalFilename: input.filename,
          imageKey: stored.key,
          imageUrl: stored.url,
          mimeType,
          status: "pending",
          detections: [],
        });
        return analysis;
      }),
    run: protectedProcedure.input(z.object({ analysisId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const analysis = await getAnalysisForUser(input.analysisId, ctx.user.id);
      if (!analysis) return null;
      return updateAnalysisModelStatus(input.analysisId, ctx.user.id);
    }),
    list: protectedProcedure.query(({ ctx }) => listAnalysesForUser(ctx.user.id)),
  }),

  trainingRelease: router({
    status: publicProcedure.query(() => getTrainingReleaseOverview()),
    syncNow: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "هذه العملية مخصصة لمالك المشروع." });
      return syncPublishedTrainingRelease();
    }),
  }),

  annotation: router({
    workspace: protectedProcedure.query(async ({ ctx }) => {
      const project = await getOrCreateAnnotationProject(ctx.user.id);
      const images = await listAnnotationImagesForUser(ctx.user.id);
      return { project, images };
    }),
    importSource: protectedProcedure
      .input(z.object({
        sourceLibraryId: z.string().min(1).max(180),
        sourceTitle: z.string().min(1).max(255),
        imageUrl: z.string().min(1).max(2048),
        sourceUrl: z.string().min(1).max(2048),
        repositoryId: z.string().min(1).max(255),
        folioOrPage: z.string().min(1).max(255),
        rightsBasis: z.string().min(1).max(5000),
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getAnnotationImageBySourceLibraryId(ctx.user.id, input.sourceLibraryId);
        if (existing) return existing;
        const project = await getOrCreateAnnotationProject(ctx.user.id);
        return createAnnotationImage({
          projectId: project!.id,
          userId: ctx.user.id,
          origin: "source_library",
          sourceLibraryId: input.sourceLibraryId,
          originalFilename: `${safeFileName(input.sourceLibraryId)}.jpg`,
          imageUrl: input.imageUrl,
          mimeType: "image/jpeg",
          sourceTitle: input.sourceTitle,
          repositoryId: input.repositoryId,
          folioOrPage: input.folioOrPage,
          sourceUrl: input.sourceUrl,
          rightsBasis: input.rightsBasis,
          oldPermicVisible: true,
          split: "unassigned",
          annotationStatus: "in_progress",
          boxes: [],
        });
      }),
    upload: protectedProcedure
      .input(z.object({
        filename: z.string().min(1).max(255),
        dataUrl: z.string().min(32).max(7_000_000),
        sourceTitle: z.string().min(1).max(255).default("صورة أضافها الباحث"),
        repositoryId: z.string().min(1).max(255).default("غير موثق بعد"),
        folioOrPage: z.string().min(1).max(255).default("غير محدد"),
        sourceUrl: z.string().min(1).max(2048).default("local-upload"),
        rightsBasis: z.string().min(1).max(5000).default("يحتاج الباحث إلى توثيق أساس الاستخدام قبل الاعتماد للتدريب."),
      }))
      .mutation(async ({ ctx, input }) => {
        const { buffer, mimeType } = parseImageDataUrl(input.dataUrl);
        const key = `old-permic-annotations/${ctx.user.id}/${Date.now()}-${nanoid(10)}-${safeFileName(input.filename)}`;
        const stored = await storagePut(key, buffer, mimeType);
        const project = await getOrCreateAnnotationProject(ctx.user.id);
        return createAnnotationImage({
          projectId: project!.id,
          userId: ctx.user.id,
          origin: "upload",
          originalFilename: input.filename,
          imageKey: stored.key,
          imageUrl: stored.url,
          mimeType,
          sourceTitle: input.sourceTitle,
          repositoryId: input.repositoryId,
          folioOrPage: input.folioOrPage,
          sourceUrl: input.sourceUrl,
          rightsBasis: input.rightsBasis,
          oldPermicVisible: true,
          split: "unassigned",
          annotationStatus: "in_progress",
          boxes: [],
        });
      }),
    save: protectedProcedure
      .input(z.object({
        imageId: z.number().int().positive(),
        boxes: z.array(annotationBoxInput),
        annotationStatus: annotationStatusInput,
        split: annotationSplitInput,
        notes: z.string().max(5000).nullable(),
        sourceTitle: z.string().min(1).max(255),
        repositoryId: z.string().min(1).max(255),
        folioOrPage: z.string().min(1).max(255),
        sourceUrl: z.string().min(1).max(2048),
        rightsBasis: z.string().min(1).max(5000),
        oldPermicVisible: z.boolean(),
        imageWidth: z.number().int().positive().nullable(),
        imageHeight: z.number().int().positive().nullable(),
        rotationDegrees: annotationRotationInput,
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getAnnotationImageForUser(input.imageId, ctx.user.id);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "لم تُعثر الصورة داخل مشروع الوسم." });
        if (["reviewed", "approved"].includes(input.annotationStatus) && (!input.boxes.length || input.split === "unassigned")) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "لا تُعلّم الصورة مراجعة أو معتمدة قبل وجود صناديق وتقسيم تدريب واضح." });
        }
        return updateAnnotationImageForUser(input.imageId, ctx.user.id, {
          boxes: input.boxes,
          annotationStatus: input.annotationStatus,
          split: input.split,
          notes: input.notes,
          sourceTitle: input.sourceTitle,
          repositoryId: input.repositoryId,
          folioOrPage: input.folioOrPage,
          sourceUrl: input.sourceUrl,
          rightsBasis: input.rightsBasis,
          oldPermicVisible: input.oldPermicVisible,
          imageWidth: input.imageWidth,
          imageHeight: input.imageHeight,
          rotationDegrees: input.rotationDegrees,
          reviewedAt: ["reviewed", "approved"].includes(input.annotationStatus) ? new Date() : null,
        });
      }),
    delete: protectedProcedure
      .input(z.object({ imageId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const deleted = await deleteAnnotationImageForUser(input.imageId, ctx.user.id);
        if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "لم تُعثر الصورة داخل مشروع الوسم." });
        return {
          id: deleted.id,
          originalFilename: deleted.originalFilename,
          removedBoxCount: Array.isArray(deleted.boxes) ? deleted.boxes.length : 0,
        };
      }),
    exportReviewReady: protectedProcedure.query(async ({ ctx }) => {
      const images = await listAnnotationImagesForUser(ctx.user.id);
      const acceptedStatuses = new Set(["reviewed", "approved"]);
      const reviewReady = images.filter((image) => {
        const boxes = Array.isArray(image.boxes) ? image.boxes : [];
        return acceptedStatuses.has(image.annotationStatus) && image.oldPermicVisible && image.split !== "unassigned" && boxes.length > 0;
      });
      const splitCounts = { train: 0, val: 0, test: 0 };
      const pageSplits = new Map<string, Set<string>>();
      reviewReady.forEach((image) => {
        if (image.split !== "unassigned") splitCounts[image.split] += 1;
        const sourcePage = `${image.repositoryId}::${image.folioOrPage}`;
        const splits = pageSplits.get(sourcePage) ?? new Set<string>();
        splits.add(image.split);
        pageSplits.set(sourcePage, splits);
      });
      const leakage = Array.from(pageSplits.entries()).filter(([, splits]) => splits.size > 1).map(([sourcePage]) => sourcePage);
      const blockers = [
        ...(splitCounts.train ? [] : ["لا توجد صورة مراجعة في تقسيم train."]),
        ...(splitCounts.val ? [] : ["لا توجد صورة مراجعة في تقسيم val."]),
        ...(splitCounts.test ? [] : ["لا توجد صورة مراجعة في تقسيم test."]),
        ...leakage.map((sourcePage) => `تظهر الصفحة نفسها في أكثر من تقسيم: ${sourcePage}.`),
      ];
      return {
        reviewReady,
        splitCounts,
        totalImages: images.length,
        readyImageCount: reviewReady.length,
        readyBoxCount: reviewReady.reduce((count, image) => count + (Array.isArray(image.boxes) ? image.boxes.length : 0), 0),
        blockers,
        canExport: blockers.length === 0,
      };
    }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
