import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";

export const getAllUsers = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      role: z.enum(["ADMIN", "STAFF", "CITIZEN"]).optional(),
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
        message: "Only administrators and staff can view all users",
      });
    }

    const users = await db.user.findMany({
      where: input.role ? { role: input.role } : undefined,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        username: true,
        role: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      registrationCount: user._count.registrations,
    }));
  });
