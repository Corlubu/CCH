import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";

export const updateStaff = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      staffId: z.number(),
      fullName: z.string().min(2, "Full name must be at least 2 characters"),
      email: z.string().email("Invalid email address").optional().or(z.literal("")),
      phoneNumber: z.string().min(10, "Phone number must be at least 10 characters").optional().or(z.literal("")),
      newPassword: z.string().min(6, "Password must be at least 6 characters").optional(),
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

    // Check if user is admin (only admins can update staff)
    if (decoded.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only administrators can update staff users",
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

    // Prepare update data
    const updateData: {
      fullName: string;
      email: string | null;
      phoneNumber: string | null;
      passwordHash?: string;
    } = {
      fullName: input.fullName,
      email: input.email || null,
      phoneNumber: input.phoneNumber || null,
    };

    // Hash new password if provided
    if (input.newPassword) {
      updateData.passwordHash = await bcryptjs.hash(input.newPassword, env.BCRYPT_ROUNDS);
    }

    // Update staff user
    const staff = await db.user.update({
      where: { id: input.staffId },
      data: updateData,
    });

    return {
      success: true,
      staff: {
        id: staff.id,
        username: staff.username,
        fullName: staff.fullName,
        email: staff.email,
        phoneNumber: staff.phoneNumber,
        isActive: staff.isActive,
      },
    };
  });
