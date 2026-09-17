// src/server/trpc/procedures/reports.ts
import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure, requireAdmin } from "~/server/trpc/main";
import type { Prisma } from "@prisma/client";

export const getRegistrationsReport = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      eventId: z.number().optional(),
      phoneNumber: z.string().optional(),
      name: z.string().optional(),
    }),
  )
  .query(async ({ input }) => {
    requireAdmin(input.authToken);

    const where: Prisma.RegistrationWhereInput = {};

    if (input.eventId) {
      where.eventId = input.eventId;
    }

    if (input.phoneNumber) {
      const digits = input.phoneNumber.replace(/\D/g, "");
      if (digits) where.phoneNumber = { contains: digits };
    }

    if (input.name) {
      where.OR = [
        { firstName: { contains: input.name, mode: "insensitive" } },
        { lastName: { contains: input.name, mode: "insensitive" } },
      ];
    }

    return db.registration.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDatetime: true,
            endDatetime: true,
          },
        },
      },
      orderBy: { registrationDate: "desc" },
      take: 500, // límite de seguridad — ver nota al final sobre volumen
    });
  });

// Solo si NO tienes ya un procedimiento que liste eventos en otro lado.
// Si ya existe (por ejemplo el que usa el formulario de registro), reutilízalo
// en vez de duplicar este.
export const listEventsForReport = baseProcedure
  .input(z.object({ authToken: z.string() }))
  .query(async ({ input }) => {
    requireAdmin(input.authToken);
    return db.event.findMany({
      select: { id: true, name: true, startDatetime: true },
      orderBy: { startDatetime: "desc" },
    });
  });
