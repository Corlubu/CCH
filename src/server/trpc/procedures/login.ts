import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

export const login = baseProcedure
  .input(
    z.object({
      username: z.string().min(1, "Username is required"),
      password: z.string().min(1, "Password is required"),
    })
  )
  .mutation(async ({ input }) => {
    // Find user by username
    const user = await db.user.findUnique({
      where: { username: input.username },
    });

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid username or password",
      });
    }

    // Verify password
    const isValidPassword = await bcryptjs.compare(
      input.password,
      user.passwordHash
    );

    if (!isValidPassword) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid username or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        username: user.username,
      },
      env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
      },
    };
  });
