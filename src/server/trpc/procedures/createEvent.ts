import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";

export const createEvent = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      name: z.string().min(1, "Event name is required"),
      description: z.string().optional(),
      availableBags: z.number().min(1, "Must have at least 1 bag available"),
      startDatetime: z.string().datetime(),
      endDatetime: z.string().datetime(),
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
        message: "Only administrators can create events",
      });
    }

    // Validate dates
    const start = new Date(input.startDatetime);
    const end = new Date(input.endDatetime);

    if (end <= start) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "End datetime must be after start datetime",
      });
    }

    // Create event
    const event = await db.event.create({
      data: {
        name: input.name,
        description: input.description,
        availableBags: input.availableBags,
        startDatetime: start,
        endDatetime: end,
        status: "ACTIVE",
      },
    });

    return {
      success: true,
      event: {
        id: event.id,
        name: event.name,
        description: event.description,
        availableBags: event.availableBags,
        registeredCount: event.registeredCount,
        startDatetime: event.startDatetime.toISOString(),
        endDatetime: event.endDatetime.toISOString(),
        status: event.status,
      },
    };
  });
