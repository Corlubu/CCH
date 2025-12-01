import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";

export const updateUserPreferences = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      emailNotifications: z.boolean().optional(),
      smsNotifications: z.boolean().optional(),
      eventReminders: z.boolean().optional(),
      theme: z.enum(["light", "dark"]).optional(),
      language: z.string().optional(),
      timezone: z.string().optional(),
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

    // Prepare update data
    const updateData: {
      emailNotifications?: boolean;
      smsNotifications?: boolean;
      eventReminders?: boolean;
      theme?: string;
      language?: string;
      timezone?: string;
    } = {};

    if (input.emailNotifications !== undefined) {
      updateData.emailNotifications = input.emailNotifications;
    }
    if (input.smsNotifications !== undefined) {
      updateData.smsNotifications = input.smsNotifications;
    }
    if (input.eventReminders !== undefined) {
      updateData.eventReminders = input.eventReminders;
    }
    if (input.theme !== undefined) {
      updateData.theme = input.theme;
    }
    if (input.language !== undefined) {
      updateData.language = input.language;
    }
    if (input.timezone !== undefined) {
      updateData.timezone = input.timezone;
    }

    // Upsert preferences (create if doesn't exist, update if exists)
    const preferences = await db.userPreferences.upsert({
      where: { userId: decoded.userId },
      update: updateData,
      create: {
        userId: decoded.userId,
        emailNotifications: input.emailNotifications ?? true,
        smsNotifications: input.smsNotifications ?? true,
        eventReminders: input.eventReminders ?? true,
        theme: input.theme ?? "light",
        language: input.language ?? "en",
        timezone: input.timezone ?? "America/New_York",
      },
    });

    return {
      success: true,
      preferences,
    };
  });
