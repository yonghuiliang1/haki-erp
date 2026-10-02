/**
 * Register API Route Handler
 * App Router route handler for user registration
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";
import { scheduleInvalidateAuthCaches } from "@/lib/cache";
import { prisma } from "@/prisma/client";

/**
 * Pick a username that is not taken yet: base name first, then numbered suffixes.
 */
async function resolveUniqueUsername(base: string): Promise<string> {
  let username = base;
  let counter = 1;
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${base}${counter}`;
    counter++;
  }
  return username;
}

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Invalid registration data", {
        errors: validationResult.error.errors,
      });
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { name, email, password } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const baseUsername = email.split("@")[0] ?? "user";
    const username = await resolveUniqueUsername(baseUsername);

    // New signups get admin role for full manipulation power
    const createdUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        username,
        role: "admin",
        createdAt: new Date(),
      },
      select: { id: true, name: true, email: true },
    });

    await scheduleInvalidateAuthCaches();
    return NextResponse.json(
      {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Registration error:", error);

    const message =
      error instanceof Error ? error.message : "An unknown error occurred";

    return NextResponse.json(
      { error: `Registration failed: ${message}` },
      { status: 500 }
    );
  }
}