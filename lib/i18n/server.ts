/**
 * Server-side locale resolution for SSR.
 * Signed-in users follow their profile preference; everyone else follows the
 * cookie; first-time visitors get the default (Chinese).
 */

import { cookies } from "next/headers";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/prisma/client";
import { LOCALE_COOKIE, normalizeLocale, type Locale } from "./config";

export async function resolveLocale(): Promise<Locale> {
  const session = await getSession();
  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { locale: true },
    });
    if (user?.locale) {
      return normalizeLocale(user.locale);
    }
  }

  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
}