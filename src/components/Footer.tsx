"use client";

import React from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Shield, Heart, AlertTriangle } from "lucide-react";

export function Footer() {
  const { locale, t } = useI18n();

  return (
    <footer className="bg-white border-t border-gray-200 mt-16 text-gray-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-bold text-gray-900 text-lg">
                {locale === "bn" ? "নিরাপদ এলাকা" : "NirapodElaka"}
              </span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed max-w-md">
              {locale === "bn"
                ? "বাংলাদেশের নাগরিকদের দৈনন্দিন চলাচলের নিরাপত্তা ও সুবিধার জন্য উন্মুক্ত কমিউনিটি হ্যাজার্ড রিপোর্টিং প্ল্যাটফর্ম। জলাবদ্ধতা, ভাঙা রাস্তা, যানজট ও বিঘ্ন চিহ্নিত করে সতর্ক থাকুন।"
                : "A community-powered platform for reporting and verifying local hazards, waterlogging, road closures, and disruptions across neighborhoods in Bangladesh."}
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
              <span>
                {locale === "bn"
                  ? "জরুরি প্রাণঘাতী পরিস্থিতিতে সর্বদা ৯৯৯ (বাংলাদেশ জাতীয় জরুরি সেবা) এ ফোন করুন।"
                  : "In life-threatening situations, always call 999 (National Emergency Helpline)."}
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 text-sm tracking-wider uppercase">
              {locale === "bn" ? "দ্রুত লিংক" : "Quick Links"}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-teal-600 transition">
                  {locale === "bn" ? "মানচিত্র ও হ্যাজার্ড" : "Live Map & Reports"}
                </Link>
              </li>
              <li>
                <Link href="/report/new" className="hover:text-teal-600 transition">
                  {locale === "bn" ? "হ্যাজার্ড রিপোর্ট করুন" : "Report a Hazard"}
                </Link>
              </li>
              <li>
                <Link href="/browse" className="hover:text-teal-600 transition">
                  {locale === "bn" ? "সব রিপোর্ট ব্রাউজ" : "Browse All Reports"}
                </Link>
              </li>
              <li>
                <Link href="/moderation" className="hover:text-teal-600 transition">
                  {locale === "bn" ? "মডারেশন প্যানেল" : "Moderation Desk"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Civic Tech & Guidelines */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 text-sm tracking-wider uppercase">
              {locale === "bn" ? "নীতি ও নির্দেশিকা" : "Civic Principles"}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about#verification" className="hover:text-teal-600 transition">
                  {locale === "bn" ? "যাচাইকরণ প্রক্রিয়া" : "Verification Process"}
                </Link>
              </li>
              <li>
                <Link href="/about#privacy" className="hover:text-teal-600 transition">
                  {locale === "bn" ? "গোপনীয়তা ও ডেটা নীতি" : "Privacy & Anonymity"}
                </Link>
              </li>
              <li>
                <Link href="/about#guidelines" className="hover:text-teal-600 transition">
                  {locale === "bn" ? "কমিউনিটি নিয়মাবলী" : "Community Rules"}
                </Link>
              </li>
              <li>
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 mt-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {locale === "bn" ? "উন্মুক্ত নাগরিক সেবা" : "Non-commercial Civic Tech"}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>
            © {new Date().getFullYear()} NirapodElaka. {locale === "bn" ? "জনস্বার্থে নির্মিত।" : "Built in public interest for Bangladesh."}
          </p>
          <p className="flex items-center gap-1">
            <span>{locale === "bn" ? "ঢাকা সহ সারা বাংলাদেশের জন্য" : "Serving Dhaka & beyond with"}</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
}
