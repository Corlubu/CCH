import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";

export const updateEventStatus = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      eventId: z.number(),
      status: z.enum(["ACTIVE", "INACTIVE", "COMPLETED"]),
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
        message: "Only administrators can update event status",
      });
    }

    // Check if event exists
    const event = await db.event.findUnique({
      where: { id: input.eventId },
    });

    if (!event) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Event not found",
      });
    }

    // Update event status
    const updatedEvent = await db.event.update({
      where: { id: input.eventId },
      data: { status: input.status },
    });

    return {
      success: true,
      event: {
        id: updatedEvent.id,
        name: updatedEvent.name,
        status: updatedEvent.status,
      },
    };
  });
