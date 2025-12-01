import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";

export const getRecentRegistrations = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      limit: z.number().min(1).max(100).default(10),
      cursor: z.number().optional(),
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
        message: "Only administrators can view registrations",
      });
    }

    const registrations = await db.registration.findMany({
      take: input.limit + 1,
      ...(input.cursor && {
        cursor: {
          id: input.cursor,
        },
        skip: 1,
      }),
      orderBy: {
        registrationDate: "desc",
      },
      include: {
        event: {
          select: {
            name: true,
          },
        },
      },
    });

    let nextCursor: number | undefined = undefined;
    if (registrations.length > input.limit) {
      const nextItem = registrations.pop();
      nextCursor = nextItem?.id;
    }

    return {
      registrations: registrations.map((reg) => ({
        id: reg.id,
        orderNumber: reg.orderNumber,
        fullName: reg.fullName,
        phoneNumber: reg.phoneNumber,
        email: reg.email,
        eventName: reg.event.name,
        registrationDate: reg.registrationDate.toISOString(),
        checkedIn: reg.checkedIn,
        checkedInAt: reg.checkedInAt?.toISOString() ?? null,
      })),
      nextCursor,
    };
  });
