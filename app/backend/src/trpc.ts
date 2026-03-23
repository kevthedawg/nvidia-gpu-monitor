import { initTRPC } from "@trpc/server";
import { z } from "zod";

import type { Db } from "./db/index.js";
import { getHistory, getProcessHistory } from "./db/queries.js";

export interface TrpcContext {
  db: Db;
}

const t = initTRPC.context<TrpcContext>().create();

const timeRangeInput = z.object({
  start: z.number().int(),
  end: z.number().int(),
});

export const appRouter = t.router({
  metrics: t.router({
    history: t.procedure.input(timeRangeInput).query(({ ctx, input }) => {
      return getHistory(ctx.db, input.start, input.end);
    }),
    processHistory: t.procedure
      .input(timeRangeInput)
      .query(({ ctx, input }) => {
        return getProcessHistory(ctx.db, input.start, input.end);
      }),
  }),
});

export type AppRouter = typeof appRouter;
