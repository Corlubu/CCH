import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import twilio from "twilio";
import { getBaseUrl } from "~/server/utils/base-url";

// Helper function to normalize phone number to E.164 format
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // If it starts with 1 and has 11 digits, it's already in E.164 format
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // If it has 10 digits, assume US number and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If it already starts with +, return as is
  if (phone.startsWith("+")) {
    return phone;
  }

  // Otherwise, add + prefix
  return `+${digits}`;
}

// Helper function to generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CCH-${timestamp}-${random}`;
}

// Helper function to send SMS (if Twilio is configured)
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
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(input.phoneNumber);

    // Check if event exists and is active
    const event = await db.event.findUnique({
      where: { id: input.eventId },
    });

    if (!event) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Event not found",
      });
    }

    // Check if event is active
    if (event.status !== "ACTIVE") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This event is no longer active",
      });
    }

    // Check if event is within time window
    const now = new Date();
    if (now < event.startDatetime || now > event.endDatetime) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This event is not currently accepting registrations",
      });
    }

    // Check capacity
    if (event.registeredCount >= event.availableBags) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This event has reached maximum capacity",
      });
    }

    // Fetch admin settings for registration cooldown
    let adminSettings = await db.adminSettings.findUnique({
      where: { id: 1 },
    });

    // Create default settings if they don't exist
    if (!adminSettings) {
      adminSettings = await db.adminSettings.create({
        data: {
          id: 1,
          registrationCooldownEnabled: true,
          registrationCooldownDays: 14,
        },
      });
    }

    // Check registration cooldown if enabled
    if (adminSettings.registrationCooldownEnabled) {
      const cooldownDate = new Date();
      cooldownDate.setDate(
        cooldownDate.getDate() - adminSettings.registrationCooldownDays,
      );

      const recentRegistration = await db.registration.findFirst({
        where: {
          phoneNumber: normalizedPhone,
          registrationDate: {
            gte: cooldownDate,
          },
        },
      });

      if (recentRegistration) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `You have already registered within the last ${adminSettings.registrationCooldownDays} days. Please wait before registering again.`,
        });
      }
    }

    // Generate unique order number
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

    // Create or update citizen profile and registration in a transaction
    const registration = await db.$transaction(async (tx) => {
      // Find or create citizen profile
      let citizenProfile = await tx.citizenProfile.findUnique({
        where: { phoneNumber: normalizedPhone },
      });

      if (citizenProfile) {
        // Update existing profile with latest information
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
        // Create new citizen profile
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

      // Create registration linked to citizen profile
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
        data: {
          registeredCount: {
            increment: 1,
          },
        },
      });

      return newRegistration;
    });

    // Generate QR code for order number
    const baseUrl = getBaseUrl();
    const searchUrl = `${baseUrl}/citizen-search?orderNumber=${orderNumber}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(searchUrl)}`;

    // Send SMS confirmation with QR code link
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
