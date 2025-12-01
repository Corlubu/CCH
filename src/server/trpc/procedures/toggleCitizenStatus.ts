import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";

export const toggleCitizenStatus = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      citizenId: z.number(),
      isActive: z.boolean(),
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
        message: "Only administrators and staff can change citizen status",
      });
    }

    // Get the citizen
    const citizen = await db.user.findUnique({
      where: { id: input.citizenId },
    });

    if (!citizen) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Citizen not found",
      });
    }

    // Ensure the user is a citizen
    if (citizen.role !== "CITIZEN") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Can only change status of citizen accounts",
      });
    }

    // Update citizen status
    const updatedCitizen = await db.user.update({
      where: { id: input.citizenId },
      data: { isActive: input.isActive },
    });

    return {
      success: true,
      citizen: {
        id: updatedCitizen.id,
        username: updatedCitizen.username,
        fullName: updatedCitizen.fullName,
        isActive: updatedCitizen.isActive,
      },
    };
  });
