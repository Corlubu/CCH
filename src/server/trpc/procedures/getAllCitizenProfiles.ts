import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";

export const getAllCitizenProfiles = baseProcedure
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
        message: "Only administrators and staff can view citizen profiles",
      });
    }

    const citizenProfiles = await db.citizenProfile.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    return citizenProfiles.map((profile) => ({
      id: profile.id,
      phoneNumber: profile.phoneNumber,
      firstName: profile.firstName,
      middleName: profile.middleName,
      lastName: profile.lastName,
      fullName: `${profile.firstName}${profile.middleName ? " " + profile.middleName : ""} ${profile.lastName}`.trim(),
      email: profile.email,
      isHomeless: profile.isHomeless,
      address: profile.address,
      apartmentSuite: profile.apartmentSuite,
      cityTown: profile.cityTown,
      stateProvince: profile.stateProvince,
      zipPostalCode: profile.zipPostalCode,
      country: profile.country,
      county: profile.county,
      hasUserAccount: !!profile.user,
      username: profile.user?.username,
      isActive: profile.user?.isActive ?? true,
      registrationCount: profile._count.registrations,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    }));
  });
