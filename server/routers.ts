import { COOKIE_NAME } from "@shared/const";
import { MODEL_STATUS } from "@shared/oldPermicOcr";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createAnalysis, getAnalysisForUser, listAnalysesForUser, updateAnalysisModelStatus } from "./db";
import { parseImageDataUrl, safeFileName } from "./oldPermicOcr";
import { storagePut } from "./storage";

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

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
