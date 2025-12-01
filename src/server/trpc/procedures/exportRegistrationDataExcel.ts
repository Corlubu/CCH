import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";
import * as XLSX from "xlsx";

export const exportRegistrationDataExcel = baseProcedure
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
        message: "Only administrators and staff can export registration data",
      });
    }

    // Fetch all citizen profiles with their registrations
    const citizenProfiles = await db.citizenProfile.findMany({
      include: {
        user: {
          select: {
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

    // Prepare data for Excel
    const rows: any[] = [];

    // Process each citizen profile and their registrations
    for (const profile of citizenProfiles) {
      if (profile.registrations.length === 0) {
        // Include profiles with no registrations
        rows.push({
          "Profile ID": profile.id,
          "Phone Number": profile.phoneNumber,
          "First Name": profile.firstName,
          "Middle Name": profile.middleName || "",
          "Last Name": profile.lastName,
          "Full Name": `${profile.firstName}${profile.middleName ? " " + profile.middleName : ""} ${profile.lastName}`.trim(),
          "Email": profile.email || "",
          "Is Homeless": profile.isHomeless ? "Yes" : "No",
          "Address": profile.address || "",
          "Apartment/Suite": profile.apartmentSuite || "",
          "City/Town": profile.cityTown || "",
          "State/Province": profile.stateProvince || "",
          "Zip/Postal Code": profile.zipPostalCode || "",
          "Country": profile.country || "",
          "County": profile.county || "",
          "Has User Account": profile.user ? "Yes" : "No",
          "Username": profile.user?.username || "",
          "Account Active": profile.user ? (profile.user.isActive ? "Yes" : "No") : "",
          "Profile Created Date": profile.createdAt.toISOString(),
          "Profile Updated Date": profile.updatedAt.toISOString(),
          "Registration Order Number": "",
          "Event Name": "",
          "Event Start Date": "",
          "Event End Date": "",
          "Event Status": "",
          "Registration Date": "",
          "Checked In": "",
          "Checked In Date": "",
          "Household Size": "",
          "Alternate Pickup Person": "",
          "Income Eligibility": "",
          "SNAP": "",
          "TANF": "",
          "SSI": "",
          "Medicaid": "",
          "Income/Salary": "",
          "Digital Signature": "",
        });
      } else {
        // Include a row for each registration
        for (const registration of profile.registrations) {
          rows.push({
            "Profile ID": profile.id,
            "Phone Number": profile.phoneNumber,
            "First Name": profile.firstName,
            "Middle Name": profile.middleName || "",
            "Last Name": profile.lastName,
            "Full Name": `${profile.firstName}${profile.middleName ? " " + profile.middleName : ""} ${profile.lastName}`.trim(),
            "Email": profile.email || "",
            "Is Homeless": profile.isHomeless ? "Yes" : "No",
            "Address": profile.address || "",
            "Apartment/Suite": profile.apartmentSuite || "",
            "City/Town": profile.cityTown || "",
            "State/Province": profile.stateProvince || "",
            "Zip/Postal Code": profile.zipPostalCode || "",
            "Country": profile.country || "",
            "County": profile.county || "",
            "Has User Account": profile.user ? "Yes" : "No",
            "Username": profile.user?.username || "",
            "Account Active": profile.user ? (profile.user.isActive ? "Yes" : "No") : "",
            "Profile Created Date": profile.createdAt.toISOString(),
            "Profile Updated Date": profile.updatedAt.toISOString(),
            "Registration Order Number": registration.orderNumber,
            "Event Name": registration.event.name,
            "Event Start Date": registration.event.startDatetime.toISOString(),
            "Event End Date": registration.event.endDatetime.toISOString(),
            "Event Status": registration.event.status,
            "Registration Date": registration.registrationDate.toISOString(),
            "Checked In": registration.checkedIn ? "Yes" : "No",
            "Checked In Date": registration.checkedInAt?.toISOString() || "",
            "Household Size": registration.totalIndividuals,
            "Alternate Pickup Person": registration.alternatePickupPerson || "",
            "Income Eligibility": registration.incomeEligibility ? "Yes" : "No",
            "SNAP": registration.snap ? "Yes" : "No",
            "TANF": registration.tanf ? "Yes" : "No",
            "SSI": registration.ssi ? "Yes" : "No",
            "Medicaid": registration.medicaid ? "Yes" : "No",
            "Income/Salary": registration.incomeSalary?.toString() || "",
            "Digital Signature": registration.digitalSignature || "",
          });
        }
      }
    }

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registration Data");

    // Auto-size columns for better readability
    const maxWidth = 50;
    const colWidths = Object.keys(rows[0] || {}).map(key => {
      const maxLength = Math.max(
        key.length,
        ...rows.map(row => String(row[key] || "").length)
      );
      return { wch: Math.min(maxLength + 2, maxWidth) };
    });
    worksheet["!cols"] = colWidths;

    // Generate Excel file as buffer
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    
    // Convert to base64 for transmission
    const base64Excel = excelBuffer.toString("base64");

    return {
      data: base64Excel,
      filename: `registration-data-export-${new Date().toISOString().split("T")[0]}.xlsx`,
      rowCount: rows.length,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  });
