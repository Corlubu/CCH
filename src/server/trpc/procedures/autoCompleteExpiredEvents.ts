import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";

export const autoCompleteExpiredEvents = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    // Verify authentication token
    let decoded;
    try {
      decoded = jwt.verify(input.authToken, env.JWT_SECRET) as {
        userId: number;
        role: string;
      };
    } catch (error) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }

    // Check if user is admin
    if (decoded.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only administrators can trigger event auto-completion",
      });
    }

    const now = new Date();

    // Find all events that have ended but are still marked as ACTIVE or INACTIVE
    const expiredEvents = await db.event.findMany({
      where: {
        status: {
          in: ["ACTIVE", "INACTIVE"],
        },
        endDatetime: {
          lt: now,
        },
      },
    });

    if (expiredEvents.length > 0) {
      // Update all expired events to COMPLETED status
      await db.event.updateMany({
        where: {
          id: {
            in: expiredEvents.map((e) => e.id),
          },
        },
        data: {
          status: "COMPLETED",
        },
      });
    }

    return {
      success: true,
      completedCount: expiredEvents.length,
      message: `Marked ${expiredEvents.length} expired event(s) as COMPLETED`,
    };
  });
