// src/server/trpc/procedures/announcements.ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure, requireAdmin } from "~/server/trpc/main";

const announcementTypeEnum = z.enum(["info", "warning", "danger", "success"]);

export const createAnnouncement = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      title: z.string().optional(),
      message: z.string().min(1, "Message is required"),
      type: announcementTypeEnum.default("warning"),
      eventId: z.number().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      isActive: z.boolean().default(true),
    }),
  )
  .mutation(async ({ input }) => {
    requireAdmin(input.authToken);
    const { authToken, ...data } = input;
    return db.announcementMessage.create({ data });
  });

export const updateAnnouncement = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      id: z.number(),
      title: z.string().optional(),
      message: z.string().min(1).optional(),
      type: announcementTypeEnum.optional(),
      eventId: z.number().nullable().optional(),
      startDate: z.date().nullable().optional(),
      endDate: z.date().nullable().optional(),
      isActive: z.boolean().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    requireAdmin(input.authToken);
    const { authToken, id, ...data } = input;
    const existing = await db.announcementMessage.findUnique({ where: { id } });
    if (!existing)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Announcement not found",
      });
    return db.announcementMessage.update({ where: { id }, data });
  });

export const deleteAnnouncement = baseProcedure
  .input(z.object({ authToken: z.string(), id: z.number() }))
  .mutation(async ({ input }) => {
    requireAdmin(input.authToken);
    await db.announcementMessage.delete({ where: { id: input.id } });
    return { success: true };
  });

export const toggleAnnouncement = baseProcedure
  .input(z.object({ authToken: z.string(), id: z.number() }))
  .mutation(async ({ input }) => {
    requireAdmin(input.authToken);
    const existing = await db.announcementMessage.findUnique({
      where: { id: input.id },
    });
    if (!existing)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Announcement not found",
      });
    return db.announcementMessage.update({
      where: { id: input.id },
      data: { isActive: !existing.isActive },
    });
  });

export const listAnnouncements = baseProcedure
  .input(z.object({ authToken: z.string() }))
  .query(async ({ input }) => {
    requireAdmin(input.authToken);
    return db.announcementMessage.findMany({
      orderBy: { createdAt: "desc" },
      include: { event: { select: { id: true, name: true } } },
    });
  });

// Público — sin authToken, lo consume la pantalla de registro sin login
export const getActiveAnnouncements = baseProcedure
  .input(z.object({ eventId: z.number().optional() }).optional())
  .query(async ({ input }) => {
    const now = new Date();
    return db.announcementMessage.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
          {
            OR: [
              { eventId: null },
              ...(input?.eventId ? [{ eventId: input.eventId }] : []),
            ],
          },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
  });
