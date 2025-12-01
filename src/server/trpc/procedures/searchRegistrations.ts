import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";

export const searchRegistrations = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      searchQuery: z.string().min(1, "Search query is required"),
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

    // Check if user is admin or staff
    if (decoded.role !== "ADMIN" && decoded.role !== "STAFF") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only administrators and staff can search registrations",
      });
    }

    // Search for registrations by phone number or order number
    const registrations = await db.registration.findMany({
      where: {
        OR: [
          {
            phoneNumber: {
              contains: input.searchQuery,
            },
          },
          {
            orderNumber: {
              contains: input.searchQuery,
              mode: "insensitive",
            },
          },
          {
            firstName: {
              contains: input.searchQuery,
              mode: "insensitive",
            },
          },
          {
            lastName: {
              contains: input.searchQuery,
              mode: "insensitive",
            },
          },
        ],
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDatetime: true,
            endDatetime: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        registrationDate: "desc",
      },
      take: 50, // Limit results to 50
    });

    return {
      registrations: registrations.map((reg) => ({
        id: reg.id,
        orderNumber: reg.orderNumber,
        firstName: reg.firstName,
        middleName: reg.middleName,
        lastName: reg.lastName,
        fullName: `${reg.firstName} ${reg.middleName ? reg.middleName + " " : ""}${reg.lastName}`.trim(),
        phoneNumber: reg.phoneNumber,
        email: reg.email,
        address: reg.address,
        cityTown: reg.cityTown,
        stateProvince: reg.stateProvince,
        zipPostalCode: reg.zipPostalCode,
        isHomeless: reg.isHomeless,
        totalIndividuals: reg.totalIndividuals,
        registrationDate: reg.registrationDate.toISOString(),
        checkedIn: reg.checkedIn,
        checkedInAt: reg.checkedInAt?.toISOString() || null,
        eventId: reg.eventId,
        eventName: reg.event.name,
        eventStartDatetime: reg.event.startDatetime.toISOString(),
        eventEndDatetime: reg.event.endDatetime.toISOString(),
        eventStatus: reg.event.status,
        userId: reg.userId,
        user: reg.user ? {
          id: reg.user.id,
          username: reg.user.username,
          fullName: reg.user.fullName,
        } : null,
      })),
    };
  });
