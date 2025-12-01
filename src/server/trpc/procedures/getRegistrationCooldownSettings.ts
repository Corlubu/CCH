import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";

export const getRegistrationCooldownSettings = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
    })
  )
  .query(async ({ input }) => {
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

    // Check if user is admin
    if (decoded.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    // Fetch or create admin settings (singleton pattern with id=1)
    let settings = await db.adminSettings.findUnique({
      where: { id: 1 },
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await db.adminSettings.create({
        data: {
          id: 1,
          registrationCooldownEnabled: true,
          registrationCooldownDays: 14,
        },
      });
    }

    return {
      registrationCooldownEnabled: settings.registrationCooldownEnabled,
      registrationCooldownDays: settings.registrationCooldownDays,
    };
  });
