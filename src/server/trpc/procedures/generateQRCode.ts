import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";
import crypto from "crypto";

function generateSessionCode(): string {
  return crypto.randomBytes(16).toString("hex");
}

export const generateQRCode = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      eventId: z.number(),
      expirationHours: z.number().min(1).max(168).default(24), // Max 1 week
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

    // Check if user is admin
    if (decoded.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only administrators can generate QR codes",
      });
    }

    // Verify event exists
    const event = await db.event.findUnique({
      where: { id: input.eventId },
    });

    if (!event) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Event not found",
      });
    }

    // Generate unique session code
    let sessionCode = generateSessionCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await db.qRSession.findUnique({
        where: { sessionCode },
      });
      if (!existing) break;
      sessionCode = generateSessionCode();
      attempts++;
    }

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + input.expirationHours);

    // Create QR session
    const qrSession = await db.qRSession.create({
      data: {
        sessionCode,
        eventId: input.eventId,
        expiresAt,
        isActive: true,
      },
    });

    // Generate registration URL
    const baseUrl = env.BASE_URL || "http://localhost:3000";
    const registrationUrl = `${baseUrl}/register?session=${sessionCode}`;

    return {
      success: true,
      sessionCode: qrSession.sessionCode,
      registrationUrl,
      expiresAt: qrSession.expiresAt.toISOString(),
      qrData: registrationUrl, // This will be used to generate the actual QR code on the frontend
    };
  });
