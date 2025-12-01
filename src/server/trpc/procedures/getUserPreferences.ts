import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";

export const getUserPreferences = baseProcedure
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

    // Fetch or create user preferences
    let preferences = await db.userPreferences.findUnique({
      where: { userId: decoded.userId },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await db.userPreferences.create({
        data: {
          userId: decoded.userId,
          emailNotifications: true,
          smsNotifications: true,
          eventReminders: true,
          theme: "light",
          language: "en",
          timezone: "America/New_York",
        },
      });
    }

    return preferences;
  });
