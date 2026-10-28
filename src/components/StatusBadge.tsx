"use client";

import React from "react";
import { ReportStatus } from "@/lib/types";
import { STATUS_META } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { CheckCircle2, Clock, AlertCircle, HelpCircle, CheckCheck, Archive } from "lucide-react";

interface StatusBadgeProps {
  status: ReportStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const { locale } = useI18n();
  const meta = STATUS_META[status] || STATUS_META.submitted;

  const getIcon = () => {
    switch (status) {
      case "submitted":
        return <Clock className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />;
      case "under_review":
        return <HelpCircle className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />;
      case "community_confirmed":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />;
      case "disputed":
        return <AlertCircle className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />;
      case "resolved":
        return <CheckCheck className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />;
      case "archived":
        return <Archive className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border border-gray-200 ${meta.color} ${className}`}
      title={meta.description}
      role="status"
    >
      {getIcon()}
      <span>{locale === "bn" ? meta.labelBn : meta.labelEn}</span>
    </span>
  );
}
