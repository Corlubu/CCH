import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";

export const updateRegistrationCooldownSettings = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      registrationCooldownEnabled: z.boolean().optional(),
      registrationCooldownDays: z.number().min(1).max(365).optional(),
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

    // Check if user is admin
    if (decoded.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    // Prepare update data
    const updateData: {
      registrationCooldownEnabled?: boolean;
      registrationCooldownDays?: number;
    } = {};

    if (input.registrationCooldownEnabled !== undefined) {
      updateData.registrationCooldownEnabled = input.registrationCooldownEnabled;
    }
    if (input.registrationCooldownDays !== undefined) {
      updateData.registrationCooldownDays = input.registrationCooldownDays;
    }

    // Upsert settings (singleton pattern with id=1)
    const settings = await db.adminSettings.upsert({
      where: { id: 1 },
      update: updateData,
      create: {
        id: 1,
        registrationCooldownEnabled: input.registrationCooldownEnabled ?? true,
        registrationCooldownDays: input.registrationCooldownDays ?? 14,
      },
    });

    return {
      success: true,
      settings: {
        registrationCooldownEnabled: settings.registrationCooldownEnabled,
        registrationCooldownDays: settings.registrationCooldownDays,
      },
    };
  });
