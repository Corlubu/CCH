import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";

export const toggleStaffStatus = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      staffId: z.number(),
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

    // Check if user is admin (only admins can toggle staff status)
    if (decoded.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only administrators can modify staff status",
      });
    }

    // Check if staff user exists and has STAFF role
    const existingStaff = await db.user.findUnique({
      where: { id: input.staffId },
    });

    if (!existingStaff) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Staff user not found",
      });
    }

    if (existingStaff.role !== "STAFF") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User is not a staff member",
      });
    }

    // Update staff status
    await db.user.update({
      where: { id: input.staffId },
      data: { isActive: input.isActive },
    });

    return {
      success: true,
      message: `Staff user ${input.isActive ? "activated" : "deactivated"} successfully`,
    };
  });
