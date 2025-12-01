import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";

export const exportCitizenProfilesToCSV = baseProcedure
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
        message: "Only administrators and staff can export citizen profiles",
      });
    }

    // Fetch all citizen profiles with their registrations
    const citizenProfiles = await db.citizenProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            isActive: true,
          },
        },
        registrations: {
          include: {
            event: {
              select: {
                name: true,
                startDatetime: true,
                endDatetime: true,
                status: true,
              },
            },
          },
          orderBy: {
            registrationDate: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert to CSV format
    const csvHeaders = [
      "Profile ID",
      "Phone Number",
      "First Name",
      "Middle Name",
      "Last Name",
      "Email",
      "Is Homeless",
      "Address",
      "Apartment/Suite",
      "City/Town",
      "State/Province",
      "Zip/Postal Code",
      "Country",
      "County",
      "Has User Account",
      "Username",
      "Account Active",
      "Total Registrations",
      "Profile Created Date",
      "Profile Updated Date",
      "Registration Order Number",
      "Event Name",
      "Event Start Date",
      "Event End Date",
      "Event Status",
      "Registration Date",
      "Checked In",
      "Checked In Date",
      "Household Size",
      "Alternate Pickup Person",
      "Income Eligibility",
      "SNAP",
      "TANF",
      "SSI",
      "Medicaid",
      "Income/Salary",
      "Digital Signature",
    ];

    const csvRows: string[] = [];
    csvRows.push(csvHeaders.join(","));

    // Process each citizen profile and their registrations
    for (const profile of citizenProfiles) {
      if (profile.registrations.length === 0) {
        // Include profiles with no registrations
        const row = [
          profile.id.toString(),
          escapeCSV(profile.phoneNumber),
          escapeCSV(profile.firstName),
          escapeCSV(profile.middleName || ""),
          escapeCSV(profile.lastName),
          escapeCSV(profile.email || ""),
          profile.isHomeless ? "Yes" : "No",
          escapeCSV(profile.address || ""),
          escapeCSV(profile.apartmentSuite || ""),
          escapeCSV(profile.cityTown || ""),
          escapeCSV(profile.stateProvince || ""),
          escapeCSV(profile.zipPostalCode || ""),
          escapeCSV(profile.country || ""),
          escapeCSV(profile.county || ""),
          profile.user ? "Yes" : "No",
          escapeCSV(profile.user?.username || ""),
          profile.user ? (profile.user.isActive ? "Yes" : "No") : "",
          profile.registrations.length.toString(),
          profile.createdAt.toISOString(),
          profile.updatedAt.toISOString(),
          "", // No registration data
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ];
        csvRows.push(row.join(","));
      } else {
        // Include a row for each registration
        for (const registration of profile.registrations) {
          const row = [
            profile.id.toString(),
            escapeCSV(profile.phoneNumber),
            escapeCSV(profile.firstName),
            escapeCSV(profile.middleName || ""),
            escapeCSV(profile.lastName),
            escapeCSV(profile.email || ""),
            profile.isHomeless ? "Yes" : "No",
            escapeCSV(profile.address || ""),
            escapeCSV(profile.apartmentSuite || ""),
            escapeCSV(profile.cityTown || ""),
            escapeCSV(profile.stateProvince || ""),
            escapeCSV(profile.zipPostalCode || ""),
            escapeCSV(profile.country || ""),
            escapeCSV(profile.county || ""),
            profile.user ? "Yes" : "No",
            escapeCSV(profile.user?.username || ""),
            profile.user ? (profile.user.isActive ? "Yes" : "No") : "",
            profile.registrations.length.toString(),
            profile.createdAt.toISOString(),
            profile.updatedAt.toISOString(),
            escapeCSV(registration.orderNumber),
            escapeCSV(registration.event.name),
            registration.event.startDatetime.toISOString(),
            registration.event.endDatetime.toISOString(),
            registration.event.status,
            registration.registrationDate.toISOString(),
            registration.checkedIn ? "Yes" : "No",
            registration.checkedInAt?.toISOString() || "",
            registration.totalIndividuals.toString(),
            escapeCSV(registration.alternatePickupPerson || ""),
            registration.incomeEligibility ? "Yes" : "No",
            registration.snap ? "Yes" : "No",
            registration.tanf ? "Yes" : "No",
            registration.ssi ? "Yes" : "No",
            registration.medicaid ? "Yes" : "No",
            registration.incomeSalary?.toString() || "",
            escapeCSV(registration.digitalSignature || ""),
          ];
          csvRows.push(row.join(","));
        }
      }
    }

    const csvContent = csvRows.join("\n");

    return {
      csv: csvContent,
      filename: `citizen-profiles-export-${new Date().toISOString().split("T")[0]}.csv`,
      rowCount: csvRows.length - 1, // Exclude header row
    };
  });

// Helper function to escape CSV values
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
