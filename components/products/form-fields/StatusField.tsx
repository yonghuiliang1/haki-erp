"use client";

import { Dispatch, SetStateAction } from "react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaCheck } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { LuGitPullRequestDraft } from "react-icons/lu";
import { Product } from "@/types"; // Import shared interfaces
import { useT } from "@/lib/i18n/locale-context";

const statuses = [
  { value: "Available", label: "Available", icon: <FaCheck /> },
  { value: "Stock Out", label: "Stock Out", icon: <IoClose /> },
  { value: "Stock Low", label: "Stock Low", icon: <LuGitPullRequestDraft /> },
];

export default function Status({
  selectedTab,
  setSelectedTab,
}: {
  selectedTab: string;
  setSelectedTab: Dispatch<SetStateAction<Product["status"]>>;
}) {
  const t = useT();
  const getStatusClass = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-600";
      case "Stock Out":
        return "bg-red-100 text-red-600";
      case "Stock Low":
        return "bg-orange-100 text-orange-600";
      default:
        return "";
    }
  };

  return (
    <div>
      <Label className="text-slate-600">{t("Status")}</Label>
      <Tabs
        value={selectedTab}
        onValueChange={(value: string) =>
          setSelectedTab(value as Product["status"])
        }
        className="mt-1"
      >
        <TabsList className="h-11 px-2">
          {statuses.map((status) => (
            <TabsTrigger
              key={status.value}
              className={`h-8 ${getStatusClass(status.value)} ${
                selectedTab === status.value ? "font-medium" : ""
              }`}
              value={status.value}
            >
              {status.icon}
              {t(status.label)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
