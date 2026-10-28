"use client";

import React from "react";
import { ReportCategory } from "@/lib/types";
import { CATEGORY_META } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

interface CategoryBadgeProps {
  category: ReportCategory;
  showIcon?: boolean;
  className?: string;
}

export function CategoryBadge({ category, showIcon = true, className = "" }: CategoryBadgeProps) {
  const { locale } = useI18n();
  const meta = CATEGORY_META[category] || CATEGORY_META.other;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color} border border-black/5 shadow-xs ${className}`}
      role="status"
    >
      {showIcon && <span aria-hidden="true">{meta.icon}</span>}
      <span>{locale === "bn" ? meta.labelBn : meta.labelEn}</span>
    </span>
  );
}
