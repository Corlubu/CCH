import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";

export const getAllEvents = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      status: z.enum(["ACTIVE", "INACTIVE", "COMPLETED"]).optional(),
    })
  )
  .query(async ({ input }) => {
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
        message: "Only administrators can view all events",
      });
    }

    const events = await db.event.findMany({
      where: input.status ? { status: input.status } : undefined,
      orderBy: {
        startDatetime: "desc",
      },
    });

    return events.map((event) => ({
      id: event.id,
      name: event.name,
      description: event.description,
      availableBags: event.availableBags,
      registeredCount: event.registeredCount,
      remainingBags: event.availableBags - event.registeredCount,
      startDatetime: event.startDatetime.toISOString(),
      endDatetime: event.endDatetime.toISOString(),
      status: event.status,
      createdAt: event.createdAt.toISOString(),
    }));
  });
