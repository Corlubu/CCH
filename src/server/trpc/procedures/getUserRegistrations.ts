import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";
import { getBaseUrl } from "~/server/utils/base-url";

export const getUserRegistrations = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      limit: z.number().min(1).max(100).default(20),
      cursor: z.number().optional(),
    })
  )
  .query(async ({ input }) => {
    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(input.authToken, env.JWT_SECRET) as {
        userId: number;
        role: string;
        username: string;
      };
    } catch (error) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }

    // Fetch user's registrations with pagination
    const registrations = await db.registration.findMany({
      where: {
        userId: decoded.userId,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            description: true,
            startDatetime: true,
            endDatetime: true,
            status: true,
          },
        },
      },
      orderBy: {
        registrationDate: "desc",
      },
      take: input.limit + 1,
      cursor: input.cursor ? { id: input.cursor } : undefined,
    });

    let nextCursor: number | undefined = undefined;
    if (registrations.length > input.limit) {
      const nextItem = registrations.pop();
      nextCursor = nextItem?.id;
    }

    return {
      registrations: registrations.map((reg) => {
        const baseUrl = getBaseUrl();
        const searchUrl = `${baseUrl}/citizen-search?orderNumber=${reg.orderNumber}`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(searchUrl)}`;
        
        return {
          id: reg.id,
          orderNumber: reg.orderNumber,
          fullName: reg.fullName,
          phoneNumber: reg.phoneNumber,
          email: reg.email,
          registrationDate: reg.registrationDate,
          checkedIn: reg.checkedIn,
          checkedInAt: reg.checkedInAt,
          qrCodeUrl,
          searchUrl,
          event: {
            id: reg.event.id,
            name: reg.event.name,
            description: reg.event.description,
            startDatetime: reg.event.startDatetime,
            endDatetime: reg.event.endDatetime,
            status: reg.event.status,
          },
        };
      }),
      nextCursor,
    };
  });
