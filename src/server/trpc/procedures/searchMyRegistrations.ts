import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { getBaseUrl } from "~/server/utils/base-url";

export const searchMyRegistrations = baseProcedure
  .input(
    z.object({
      phoneNumber: z.string().min(10, "Valid phone number is required").optional(),
      orderNumber: z.string().optional(),
    }).refine(
      (data) => data.phoneNumber || data.orderNumber,
      {
        message: "Either phone number or order number is required",
      }
    )
  )
  .query(async ({ input }) => {
    let registrations;

    if (input.orderNumber) {
      // Search by order number (exact match)
      const registration = await db.registration.findUnique({
        where: {
          orderNumber: input.orderNumber,
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              description: true,
              startDatetime: true,
              endDatetime: true,
              status: true,
            },
          },
        },
      });

      registrations = registration ? [registration] : [];
    } else if (input.phoneNumber) {
      // Normalize phone number for searching (remove non-digits)
      const normalizedPhone = input.phoneNumber.replace(/\D/g, "");

      // Search for registrations by phone number (partial match)
      registrations = await db.registration.findMany({
        where: {
          phoneNumber: {
            contains: normalizedPhone,
          },
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              description: true,
              startDatetime: true,
              endDatetime: true,
              status: true,
            },
          },
        },
        orderBy: {
          registrationDate: "desc",
        },
      });
    } else {
      registrations = [];
    }

    return {
      registrations: registrations.map((reg) => {
        const baseUrl = getBaseUrl();
        const searchUrl = `${baseUrl}/citizen-search?orderNumber=${reg.orderNumber}`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(searchUrl)}`;
        
        return {
          id: reg.id,
          orderNumber: reg.orderNumber,
          firstName: reg.firstName,
          middleName: reg.middleName,
          lastName: reg.lastName,
          fullName: `${reg.firstName} ${reg.middleName ? reg.middleName + " " : ""}${reg.lastName}`.trim(),
          phoneNumber: reg.phoneNumber,
          email: reg.email,
          totalIndividuals: reg.totalIndividuals,
          registrationDate: reg.registrationDate.toISOString(),
          checkedIn: reg.checkedIn,
          checkedInAt: reg.checkedInAt?.toISOString() || null,
          eventId: reg.eventId,
          eventName: reg.event.name,
          eventDescription: reg.event.description,
          eventStartDatetime: reg.event.startDatetime.toISOString(),
          eventEndDatetime: reg.event.endDatetime.toISOString(),
          eventStatus: reg.event.status,
          qrCodeUrl,
          searchUrl,
        };
      }),
    };
  });
