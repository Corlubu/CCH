import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import twilio from "twilio";
import { getBaseUrl } from "~/server/utils/base-url";

// Helper function to normalize phone number to E.164 format
function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (phone.startsWith("+")) {
    return phone;
  }
  return `+${digits}`;
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CCH-${timestamp}-${random}`;
}

async function sendSMS(phoneNumber: string, message: string): Promise<boolean> {
  if (
    !env.TWILIO_ACCOUNT_SID ||
    !env.TWILIO_AUTH_TOKEN ||
    !env.TWILIO_PHONE_NUMBER
  ) {
    console.log("Twilio not configured, skipping SMS");
    return false;
  }
  try {
    const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: message,
      from: env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
    console.log(`SMS sent successfully to ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error("Error sending SMS:", error);
    return false;
  }
}

export const registerCitizen = baseProcedure
  .input(
    z.object({
      eventId: z.number(),
      firstName: z.string().min(1, "First name is required"),
      middleName: z.string().optional(),
      lastName: z.string().min(1, "Last name is required"),
      isHomeless: z.boolean().default(false),
      totalIndividuals: z
        .number()
        .min(1, "Total individuals must be at least 1")
        .default(1),
      address: z.string().optional(),
      apartmentSuite: z.string().optional(),
      cityTown: z.string().optional(),
      stateProvince: z.string().optional(),
      zipPostalCode: z.string().optional(),
      country: z.string().optional(),
      county: z.string().optional(),
      digitalSignature: z.string().optional(),
      alternatePickupPerson: z.string().optional(),
      phoneNumber: z.string().min(10, "Valid phone number is required"),
      email: z.string().email().optional().or(z.literal("")),
      incomeEligibility: z.boolean().default(false),
      snap: z.boolean().default(false),
      tanf: z.boolean().default(false),
      ssi: z.boolean().default(false),
      medicaid: z.boolean().default(false),
      incomeSalary: z.number().min(0).optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const normalizedPhone = normalizePhoneNumber(input.phoneNumber);

    const event = await db.event.findUnique({
      where: { id: input.eventId },
    });

    if (!event) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
    }

    if (event.status !== "ACTIVE") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This event is no longer active",
      });
    }

    const now = new Date();
    if (now < event.startDatetime || now > event.endDatetime) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This event is not currently accepting registrations",
      });
    }

    if (event.registeredCount >= event.availableBags) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Food bags are currently unavailable. Please check back for the next distribution (No hay disponibilidad de bolsas de comida. Por favor, esté pendiente del próximo registro.)",
      });
    }

    // 🔒 NUEVO: un mismo teléfono no puede registrarse dos veces para el
    // MISMO evento (independiente de si el cooldown general está activado).
    // Esto evita que un mismo número genere dos órdenes/QR para un mismo evento.
    const existingEventRegistration = await db.registration.findFirst({
      where: {
        eventId: input.eventId,
        phoneNumber: normalizedPhone,
      },
      select: { orderNumber: true },
    });

    if (existingEventRegistration) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `This phone number has already registered for this event (Order #: ${existingEventRegistration.orderNumber}). Each phone number may only register once per event. (Este número de teléfono ya está registrado para este evento con la orden #${existingEventRegistration.orderNumber}. Cada número de teléfono solo puede registrarse una vez por evento.)`,
      });
    }

    // Fetch admin settings for registration cooldown
    let adminSettings = await db.adminSettings.findUnique({ where: { id: 1 } });
    if (!adminSettings) {
      adminSettings = await db.adminSettings.create({
        data: {
          id: 1,
          registrationCooldownEnabled: true,
          registrationCooldownDays: 14,
        },
      });
    }

    if (adminSettings.registrationCooldownEnabled) {
      const cooldownDate = new Date();
      cooldownDate.setDate(
        cooldownDate.getDate() - adminSettings.registrationCooldownDays,
      );

      const recentRegistration = await db.registration.findFirst({
        where: {
          phoneNumber: normalizedPhone,
          registrationDate: { gte: cooldownDate },
        },
      });

      if (recentRegistration) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `You have already registered within the last ${adminSettings.registrationCooldownDays} days. Please wait before registering again.`,
        });
      }
    }

    let orderNumber = generateOrderNumber();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await db.registration.findUnique({
        where: { orderNumber },
      });
      if (!existing) break;
      orderNumber = generateOrderNumber();
      attempts++;
    }

    let registration;
    try {
      registration = await db.$transaction(async (tx) => {
        let citizenProfile = await tx.citizenProfile.findUnique({
          where: { phoneNumber: normalizedPhone },
        });

        if (citizenProfile) {
          citizenProfile = await tx.citizenProfile.update({
            where: { id: citizenProfile.id },
            data: {
              firstName: input.firstName,
              middleName: input.middleName || null,
              lastName: input.lastName,
              email: input.email || null,
              isHomeless: input.isHomeless,
              address: input.address || null,
              apartmentSuite: input.apartmentSuite || null,
              cityTown: input.cityTown || null,
              stateProvince: input.stateProvince || null,
              zipPostalCode: input.zipPostalCode || null,
              country: input.country || null,
              county: input.county || null,
            },
          });
        } else {
          citizenProfile = await tx.citizenProfile.create({
            data: {
              phoneNumber: normalizedPhone,
              firstName: input.firstName,
              middleName: input.middleName || null,
              lastName: input.lastName,
              email: input.email || null,
              isHomeless: input.isHomeless,
              address: input.address || null,
              apartmentSuite: input.apartmentSuite || null,
              cityTown: input.cityTown || null,
              stateProvince: input.stateProvince || null,
              zipPostalCode: input.zipPostalCode || null,
              country: input.country || null,
              county: input.county || null,
            },
          });
        }

        const newRegistration = await tx.registration.create({
          data: {
            orderNumber,
            firstName: input.firstName,
            middleName: input.middleName || null,
            lastName: input.lastName,
            isHomeless: input.isHomeless,
            totalIndividuals: input.totalIndividuals,
            address: input.address || null,
            apartmentSuite: input.apartmentSuite || null,
            cityTown: input.cityTown || null,
            stateProvince: input.stateProvince || null,
            zipPostalCode: input.zipPostalCode || null,
            country: input.country || null,
            county: input.county || null,
            digitalSignature: input.digitalSignature || null,
            alternatePickupPerson: input.alternatePickupPerson || null,
            phoneNumber: normalizedPhone,
            email: input.email || null,
            incomeEligibility: input.incomeEligibility,
            snap: input.snap,
            tanf: input.tanf,
            ssi: input.ssi,
            medicaid: input.medicaid,
            incomeSalary: input.incomeSalary || null,
            eventId: input.eventId,
            registeredBy: "self",
            citizenProfileId: citizenProfile.id,
          },
        });

        await tx.event.update({
          where: { id: input.eventId },
          data: { registeredCount: { increment: 1 } },
        });

        return newRegistration;
      });
    } catch (error) {
      // Red de seguridad: si dos solicitudes para el mismo teléfono+evento
      // llegan casi al mismo tiempo y ambas pasan la validación de arriba,
      // la restricción única de la base de datos (ver punto 2) rechazará
      // la segunda con el código P2002. La convertimos en un mensaje claro.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "This phone number has already registered for this event. Each phone number may only register once per event. (Este número de teléfono ya está registrado para este evento. Cada número de teléfono solo puede registrarse una vez por evento.)",
        });
      }
      throw error;
    }

    const baseUrl = getBaseUrl();
    const searchUrl = `${baseUrl}/citizen-search?orderNumber=${orderNumber}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(searchUrl)}`;

    const smsMessage = `Thank you for registering for ${event.name}! Your order number is: ${orderNumber}. View your registration: ${searchUrl}`;
    await sendSMS(normalizedPhone, smsMessage);

    return {
      success: true,
      orderNumber: registration.orderNumber,
      qrCodeUrl,
      searchUrl,
      message:
        "Registration successful! You will receive an SMS confirmation shortly.",
    };
  });
