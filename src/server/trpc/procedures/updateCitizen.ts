import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";

export const updateCitizen = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      citizenId: z.number(),
      fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
      email: z.string().email("Invalid email address").or(z.literal("")).optional(),
      phoneNumber: z.string().min(10, "Phone number must be at least 10 characters").or(z.literal("")).optional(),
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

    // Check if user is admin or staff
    if (decoded.role !== "ADMIN" && decoded.role !== "STAFF") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only administrators and staff can update citizens",
      });
    }

    // Get the citizen to update
    const citizen = await db.user.findUnique({
      where: { id: input.citizenId },
    });

    if (!citizen) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Citizen not found",
      });
    }

    // Ensure the user being updated is a citizen
    if (citizen.role !== "CITIZEN") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Can only update citizen accounts",
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
      updateData.passwordHash = await bcryptjs.hash(input.newPassword, env.BCRYPT_ROUNDS);
    }

    // Update citizen
    const updatedCitizen = await db.user.update({
      where: { id: input.citizenId },
      data: updateData,
    });

    return {
      success: true,
      citizen: {
        id: updatedCitizen.id,
        username: updatedCitizen.username,
        fullName: updatedCitizen.fullName,
        email: updatedCitizen.email,
        phoneNumber: updatedCitizen.phoneNumber,
        isActive: updatedCitizen.isActive,
      },
    };
  });
