import { createTRPCReact, httpBatchLink } from "@trpc/react-query";

import type { AppRouter } from "@backend/trpc";

export const trpc: ReturnType<typeof createTRPCReact<AppRouter>> =
  createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/trpc",
    }),
  ],
});
