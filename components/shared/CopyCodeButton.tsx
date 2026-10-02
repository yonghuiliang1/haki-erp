"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/lib/i18n/locale-context";

export interface CopyCodeButtonProps {
  /** Text to copy to clipboard */
  text: string;
  /** Optional label for screen readers */
  ariaLabel?: string;
  /** Optional class for the button */
  className?: string;
}

/**
 * Button that copies the given text to clipboard and shows a toast.
 * Uses shadcn Button and toast for consistent UX.
 */
export function CopyCodeButton({
  text,
  ariaLabel,
  className,
}: CopyCodeButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const t = useT();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: t("Copied!"),
        description: t("Code copied to clipboard."),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: t("Copy failed"),
        description: t("Could not copy to clipboard."),
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={className}
      aria-label={ariaLabel ?? t("Copy to clipboard")}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      <span className="sr-only">{copied ? t("Copied") : t("Copy")}</span>
    </Button>
  );
}
