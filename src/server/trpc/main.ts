// src/server/trpc/main.ts — agrega esto al archivo que ya tienes
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

const t = initTRPC.create({
  transformer: superjson,
  sse: {
    enabled: true,
    client: { reconnectAfterInactivityMs: 5000 },
    ping: { enabled: true, intervalMs: 2500 },
  },
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;
export const baseProcedure = t.procedure;

// NUEVO: helper compartido, mismo patrón que ya usa createEvent.ts
interface DecodedToken {
  userId: number;
  role: string;
  username?: string;
}

export function requireAdmin(authToken: string): DecodedToken {
  let decoded: DecodedToken;
  try {
    decoded = jwt.verify(authToken, env.JWT_SECRET) as DecodedToken;
  } catch {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired token",
    });
  }

  if (decoded.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only administrators can perform this action",
    });
  }

  return decoded;
}
