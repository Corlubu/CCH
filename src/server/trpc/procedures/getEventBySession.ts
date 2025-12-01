import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const getEventBySession = baseProcedure
  .input(
    z.object({
      sessionCode: z.string(),
    })
  )
  .query(async ({ input }) => {
    const qrSession = await db.qRSession.findUnique({
      where: { sessionCode: input.sessionCode },
      include: {
        event: true,
      },
    });

    if (!qrSession) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invalid QR code session",
      });
    }

    // Check if session is expired
    if (new Date() > qrSession.expiresAt) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This QR code has expired",
      });
    }

    // Check if session is active
    if (!qrSession.isActive) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This QR code is no longer active",
      });
    }

    const event = qrSession.event;

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
    };
  });
