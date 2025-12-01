import { db } from "~/server/db";
import { env } from "~/server/env";
import bcryptjs from "bcryptjs";

async function setup() {
  // Seed initial admin user or update password if changed
  const existingAdmin = await db.user.findFirst({
    where: { role: "ADMIN" },
  });

  const hashedPassword = await bcryptjs.hash(env.ADMIN_PASSWORD, env.BCRYPT_ROUNDS);

  if (!existingAdmin) {
    await db.user.create({
      data: {
        username: "admin",
        passwordHash: hashedPassword,
        role: "ADMIN",
        fullName: "System Administrator",
        email: "admin@foodbank.church",
      },
    });
    console.log("✓ Admin user created with username: admin");
  } else {
    // Check if password needs to be updated
    const passwordMatches = await bcryptjs.compare(
      env.ADMIN_PASSWORD,
      existingAdmin.passwordHash
    );

    if (!passwordMatches) {
      await db.user.update({
        where: { id: existingAdmin.id },
        data: { passwordHash: hashedPassword },
      });
      console.log("✓ Admin password updated to match ADMIN_PASSWORD environment variable");
    } else {
      console.log("✓ Admin user already exists with current password");
    }
  }

  // Seed initial staff user or update password if changed
  const existingStaff = await db.user.findFirst({
    where: { role: "STAFF", username: "staff" },
  });

  if (!existingStaff) {
    await db.user.create({
      data: {
        username: "staff",
        passwordHash: hashedPassword, // Use same password as admin for demo
        role: "STAFF",
        fullName: "Staff User",
        email: "staff@foodbank.church",
      },
    });
    console.log("✓ Staff user created with username: staff");
  } else {
    // Check if password needs to be updated
    const passwordMatches = await bcryptjs.compare(
      env.ADMIN_PASSWORD,
      existingStaff.passwordHash
    );

    if (!passwordMatches) {
      await db.user.update({
        where: { id: existingStaff.id },
        data: { passwordHash: hashedPassword },
      });
      console.log("✓ Staff password updated to match ADMIN_PASSWORD environment variable");
    } else {
      console.log("✓ Staff user already exists with current password");
    }
  }

  // Initialize admin settings if they don't exist
  const existingSettings = await db.adminSettings.findUnique({
    where: { id: 1 },
  });

  if (!existingSettings) {
    await db.adminSettings.create({
      data: {
        id: 1,
        registrationCooldownEnabled: true,
        registrationCooldownDays: 14,
      },
    });
    console.log("✓ Admin settings initialized with default values");
  } else {
    console.log("✓ Admin settings already exist");
  }

  // Auto-complete events that have ended
  const now = new Date();
  const expiredEvents = await db.event.findMany({
    where: {
      status: {
        in: ["ACTIVE", "INACTIVE"],
      },
      endDatetime: {
        lt: now,
      },
    },
  });

  if (expiredEvents.length > 0) {
    await db.event.updateMany({
      where: {
        id: {
          in: expiredEvents.map((e) => e.id),
        },
      },
      data: {
        status: "COMPLETED",
      },
    });
    console.log(`✓ Marked ${expiredEvents.length} expired event(s) as COMPLETED`);
  } else {
    console.log("✓ No expired events to mark as completed");
  }
}

setup()
  .then(() => {
    console.log("setup.ts complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
