import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";

export const createStaff = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      username: z.string().min(3, "Username must be at least 3 characters"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      fullName: z.string().min(2, "Full name must be at least 2 characters"),
      email: z.string().email("Invalid email address").optional().or(z.literal("")),
      phoneNumber: z.string().min(10, "Phone number must be at least 10 characters").optional().or(z.literal("")),
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

    // Check if user is admin (only admins can create staff)
    if (decoded.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only administrators can create staff users",
      });
    }

    // Check if username already exists
    const existingUser = await db.user.findUnique({
      where: { username: input.username },
    });

    if (existingUser) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Username already exists",
      });
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(input.password, env.BCRYPT_ROUNDS);

    // Create staff user
    const staff = await db.user.create({
      data: {
        username: input.username,
        passwordHash,
        role: "STAFF",
        fullName: input.fullName,
        email: input.email || null,
        phoneNumber: input.phoneNumber || null,
        isActive: true,
      },
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
        createdAt: staff.createdAt.toISOString(),
      },
    };
  });
