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
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(2000).default(50),
    }),
  )
  .query(async ({ input }) => {
    requireAdmin(input.authToken);

    const where: Prisma.RegistrationWhereInput = {};
    if (input.eventId) where.eventId = input.eventId;
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

    const [registrations, totalCount] = await Promise.all([
      db.registration.findMany({
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
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      db.registration.count({ where }),
    ]);

    return {
      registrations,
      totalCount,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: Math.max(1, Math.ceil(totalCount / input.pageSize)),
    };
  });
