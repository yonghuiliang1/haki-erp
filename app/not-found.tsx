/**
 * Global 404 for unknown routes — Chinese by default, English once the
 * visitor switches languages (same resolution as the rest of the shell).
 */
import Link from "next/link";
import { createTranslator } from "@/lib/i18n/translate";
import { resolveLocale } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = createTranslator(await resolveLocale());

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-[28px] border border-white/20 bg-white/60 p-8 text-center backdrop-blur-md dark:border-white/10 dark:bg-white/5">
        <p className="text-5xl font-semibold text-gray-700 dark:text-white">
          404
        </p>
        <h1 className="mt-4 text-xl font-medium text-gray-800 dark:text-white">
          {t("Page not found")}
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-white/80">
          {t("The page you are looking for does not exist or has been moved.")}
        </p>
        <Link
          href="/"
          prefetch
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-sky-500/90 px-6 text-sm text-white transition-colors hover:bg-sky-500"
        >
          {t("Back to home")}
        </Link>
      </div>
    </main>
  );
}