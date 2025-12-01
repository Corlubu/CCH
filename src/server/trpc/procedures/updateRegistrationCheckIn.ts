import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";

export const updateRegistrationCheckIn = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      registrationId: z.number(),
      checkedIn: z.boolean(),
    })
  )
  .mutation(async ({ input }) => {
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
        message: "Only administrators and staff can update check-in status",
      });
    }

    // Check if registration exists
    const registration = await db.registration.findUnique({
      where: { id: input.registrationId },
    });

    if (!registration) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Registration not found",
      });
    }

    // Update check-in status
    const updatedRegistration = await db.registration.update({
      where: { id: input.registrationId },
      data: {
        checkedIn: input.checkedIn,
        checkedInAt: input.checkedIn ? new Date() : null,
      },
    });

    return {
      success: true,
      registration: {
        id: updatedRegistration.id,
        orderNumber: updatedRegistration.orderNumber,
        checkedIn: updatedRegistration.checkedIn,
        checkedInAt: updatedRegistration.checkedInAt?.toISOString() ?? null,
      },
    };
  });
