import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const getActiveEvents = baseProcedure.query(async () => {
  const now = new Date();

  const events = await db.event.findMany({
    where: {
      status: "ACTIVE",
      startDatetime: {
        lte: now,
      },
      endDatetime: {
        gte: now,
      },
    },
    orderBy: {
      startDatetime: "asc",
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
  }));
});
