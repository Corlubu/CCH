// src/server/trpc/handler.ts
import { env } from "~/server/env"; // This may throw!

// ⚠️ Force env validation at module load (good for fail-fast)
console.log("Intialized env with BASE_URL:", env.BASE_URL);

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "~/server/trpc";

export default async (request: Request) => {
  try {
    return fetchRequestHandler({
      endpoint: "/trpc",
      router: appRouter,
      req: request,
      createContext: () => ({ env }), // Pass env safely
    });
  } catch (error) {
    console.error("💥 tRPC handler crashed:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
