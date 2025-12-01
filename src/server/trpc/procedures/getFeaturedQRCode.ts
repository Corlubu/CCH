import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const getFeaturedQRCode = baseProcedure.query(async () => {
  const now = new Date();

  // Find the most recent active QR session that hasn't expired
  const qrSession = await db.qRSession.findFirst({
    where: {
      isActive: true,
      expiresAt: {
        gte: now,
      },
      event: {
        status: "ACTIVE",
        startDatetime: {
          lte: now,
        },
        endDatetime: {
          gte: now,
        },
      },
    },
    include: {
      event: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!qrSession) {
    return null;
  }

  const event = qrSession.event;
  const baseUrl = env.BASE_URL || "http://localhost:3000";
  const registrationUrl = `${baseUrl}/register?session=${qrSession.sessionCode}`;

  return {
    sessionCode: qrSession.sessionCode,
    registrationUrl,
    expiresAt: qrSession.expiresAt.toISOString(),
    event: {
      id: event.id,
      name: event.name,
      description: event.description,
      availableBags: event.availableBags,
      registeredCount: event.registeredCount,
      remainingBags: event.availableBags - event.registeredCount,
      startDatetime: event.startDatetime.toISOString(),
      endDatetime: event.endDatetime.toISOString(),
      status: event.status,
    },
  };
});
