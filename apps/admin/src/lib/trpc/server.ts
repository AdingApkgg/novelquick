import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { createTRPCContext, createCallerFactory, appRouter } from "@nq/api";

const createContext = cache(async () => {
  const h = await headers();
  return createTRPCContext({ headers: h });
});

const createCaller = createCallerFactory(appRouter);
export const trpcServer = async () => createCaller(await createContext());
