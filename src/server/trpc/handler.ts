// src/server/trpc/handler.ts
import { defineEventHandler, toWebRequest } from "@tanstack/react-start/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./root";
import { env } from "~/server/env"; // 👈 Import env (will validate at module load)

// 🔍 Optional: Log env status at cold start (visible in Vercel logs)
console.log("✅ tRPC handler loaded. BASE_URL:", env.BASE_URL);

export default defineEventHandler((event) => {
  try {
    const request = toWebRequest(event);
    if (!request) {
      return new Response("Invalid request", { status: 400 });
    }

    return fetchRequestHandler({
      endpoint: "/trpc",
      req: request,
      router: appRouter,
      createContext: () => {
        // ✅ Pass env and other context safely to resolvers
        return { env };
      },
      onError({ error, path }) {
        console.error(`🧨 tRPC error on '${path}':`, error);
      },
    });
  } catch (error) {
    // 💥 Catch ANY error during handler setup (e.g., env crash, fetchHandler init)
    console.error("💥 tRPC handler crashed during execution:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to handle tRPC request",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
});
