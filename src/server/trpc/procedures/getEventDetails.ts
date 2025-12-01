import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";

export const getEventDetails = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      eventId: z.number(),
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
        message: "Only administrators can view event details",
      });
    }

    // Fetch event with registrations
    const event = await db.event.findUnique({
      where: { id: input.eventId },
      include: {
        registrations: {
          orderBy: {
            registrationDate: "desc",
          },
        },
      },
    });

    if (!event) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Event not found",
      });
    }

    return {
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
      registrations: event.registrations.map((reg) => ({
        id: reg.id,
        orderNumber: reg.orderNumber,
        fullName: reg.fullName,
        phoneNumber: reg.phoneNumber,
        email: reg.email,
        registrationDate: reg.registrationDate.toISOString(),
        checkedIn: reg.checkedIn,
        checkedInAt: reg.checkedInAt?.toISOString() ?? null,
        registeredBy: reg.registeredBy,
      })),
    };
  });
