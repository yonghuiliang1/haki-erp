/**
 * User Locale API Route Handler
 * PATCH /api/user/locale — persist the signed-in user's UI language so the
 * preference follows the account across devices.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/prisma/client";

const localeBodySchema = z.object({
  locale: z.enum(["zh", "en"]),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = localeBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: session.id },
      data: { locale: parsed.data.locale, updatedAt: new Date() },
    });

    return NextResponse.json({ locale: parsed.data.locale });
  } catch (error) {
    logger.error("Error updating locale:", error);
    return NextResponse.json(
      { error: "Failed to update locale" },
      { status: 500 },
    );
  }
}