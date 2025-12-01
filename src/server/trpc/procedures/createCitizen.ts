import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";

export const createCitizen = baseProcedure
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

    // Check if user is admin or staff
    if (decoded.role !== "ADMIN" && decoded.role !== "STAFF") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only administrators and staff can create citizens",
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

    // Create citizen user and profile in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create citizen user
      const citizen = await tx.user.create({
        data: {
          username: input.username,
          passwordHash,
          role: "CITIZEN",
          fullName: input.fullName,
          email: input.email || null,
          phoneNumber: input.phoneNumber || null,
          isActive: true,
        },
      });

      // Create or link citizen profile if phone number is provided
      let citizenProfile = null;
      if (input.phoneNumber) {
        // Check if profile already exists for this phone number
        citizenProfile = await tx.citizenProfile.findUnique({
          where: { phoneNumber: input.phoneNumber },
        });

        if (citizenProfile) {
          // Link existing profile to user
          citizenProfile = await tx.citizenProfile.update({
            where: { id: citizenProfile.id },
            data: {
              userId: citizen.id,
              // Update with latest user data
              firstName: input.fullName.split(" ")[0] || input.fullName,
              lastName: input.fullName.split(" ").slice(1).join(" ") || "",
              email: input.email || citizenProfile.email,
            },
          });
        } else {
          // Create new profile
          citizenProfile = await tx.citizenProfile.create({
            data: {
              phoneNumber: input.phoneNumber,
              firstName: input.fullName.split(" ")[0] || input.fullName,
              lastName: input.fullName.split(" ").slice(1).join(" ") || "",
              email: input.email || null,
              userId: citizen.id,
            },
          });
        }
      }

      return { citizen, citizenProfile };
    });

    return {
      success: true,
      citizen: {
        id: result.citizen.id,
        username: result.citizen.username,
        fullName: result.citizen.fullName,
        email: result.citizen.email,
        phoneNumber: result.citizen.phoneNumber,
        isActive: result.citizen.isActive,
        createdAt: result.citizen.createdAt.toISOString(),
      },
    };
  });
