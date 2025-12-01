import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";

export const getDashboardStats = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
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
        message: "Only administrators and staff can view dashboard statistics",
      });
    }

    // Get total counts
    const [totalEvents, totalRegistrations, totalUsers] = await Promise.all([
      db.event.count(),
      db.registration.count(),
      db.user.count(),
    ]);

    // Get event counts by status
    const eventsByStatus = await db.event.groupBy({
      by: ["status"],
      _count: true,
    });

    const activeEvents = eventsByStatus.find((e) => e.status === "ACTIVE")?._count ?? 0;
    const inactiveEvents = eventsByStatus.find((e) => e.status === "INACTIVE")?._count ?? 0;
    const completedEvents = eventsByStatus.find((e) => e.status === "COMPLETED")?._count ?? 0;

    // Get check-in statistics
    const checkedInCount = await db.registration.count({
      where: { checkedIn: true },
    });

    const checkInRate = totalRegistrations > 0 
      ? Math.round((checkedInCount / totalRegistrations) * 100) 
      : 0;

    // Calculate average capacity utilization
    const events = await db.event.findMany({
      select: {
        availableBags: true,
        registeredCount: true,
      },
    });

    let totalCapacityUsed = 0;
    let totalCapacityAvailable = 0;

    for (const event of events) {
      totalCapacityUsed += event.registeredCount;
      totalCapacityAvailable += event.availableBags;
    }

    const avgCapacity = totalCapacityAvailable > 0
      ? Math.round((totalCapacityUsed / totalCapacityAvailable) * 100)
      : 0;

    // Get registrations from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRegistrations = await db.registration.count({
      where: {
        registrationDate: {
          gte: thirtyDaysAgo,
        },
      },
    });

    return {
      totalEvents,
      totalRegistrations,
      totalUsers,
      activeEvents,
      inactiveEvents,
      completedEvents,
      checkedInCount,
      checkInRate,
      avgCapacity,
      recentRegistrations,
    };
  });
