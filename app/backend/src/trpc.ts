import { initTRPC } from "@trpc/server";
import { z } from "zod";

import type { Db } from "./db/index.js";
import { getHistory, getLatest } from "./db/queries.js";

export interface TrpcContext {
  db: Db;
}

const t = initTRPC.context<TrpcContext>().create();

export const appRouter = t.router({
  metrics: t.router({
    current: t.procedure.query(({ ctx }) => {
      return getLatest(ctx.db);
    }),
    history: t.procedure
      .input(z.object({ range: z.enum(["1h", "6h", "24h"]) }))
      .query(({ ctx, input }) => {
        return getHistory(ctx.db, input.range);
      }),
  }),
});

export type AppRouter = typeof appRouter;
