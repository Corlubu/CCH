import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";

export const updateUserProfile = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
      email: z.string().email("Invalid email address").or(z.literal("")).optional(),
      phoneNumber: z.string().min(10, "Phone number must be at least 10 characters").optional(),
      currentPassword: z.string().optional(),
      newPassword: z.string().min(6, "Password must be at least 6 characters").optional(),
    })
  )
  .mutation(async ({ input }) => {
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

    // Get current user
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Prepare update data
    const updateData: {
      fullName?: string;
      email?: string | null;
      phoneNumber?: string | null;
      passwordHash?: string;
    } = {};

    if (input.fullName !== undefined) {
      updateData.fullName = input.fullName;
    }

    if (input.email !== undefined) {
      updateData.email = input.email === "" ? null : input.email;
    }

    if (input.phoneNumber !== undefined) {
      updateData.phoneNumber = input.phoneNumber === "" ? null : input.phoneNumber;
    }

    // Handle password change
    if (input.newPassword) {
      if (!input.currentPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Current password is required to change password",
        });
      }

      // Verify current password
      const isValidPassword = await bcryptjs.compare(
        input.currentPassword,
        user.passwordHash
      );

      if (!isValidPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      // Hash new password
      updateData.passwordHash = await bcryptjs.hash(input.newPassword, 10);
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: decoded.userId },
      data: updateData,
    });

    return {
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        role: updatedUser.role,
      },
    };
  });
