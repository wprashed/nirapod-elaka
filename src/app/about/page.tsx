"use client";

import React from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Lock,
  PhoneCall,
  EyeOff,
  Users,
  Compass,
  FileCheck,
} from "lucide-react";

export default function AboutPage() {
  const { locale, t } = useI18n();

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-4">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-md">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          {locale === "bn" ? "নিরাপদ এলাকা সম্পর্কে" : "About NirapodElaka"}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
          {locale === "bn"
            ? "নাগরিকদের দৈনন্দিন চলাচল নিরাপদ ও বিঘ্নহীন করার জন্য একটি অলাভজনক ও উন্মুক্ত কমিউনিটি প্ল্যাটফর্ম।"
            : "A mobile-first, community-powered platform helping residents in Bangladesh report and verify neighborhood disruptions."}
        </p>
      </div>

      {/* Emergency Disclaimer Banner */}
      <div className="bg-amber-500/15 border-2 border-amber-500 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-amber-950 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-bold text-gray-950 text-base">
            {locale === "bn" ? "জরুরি সেবার বিকল্প নয় (Emergency Disclaimer)" : "Not an Emergency Service"}
          </h2>
          <p className="text-xs sm:text-sm text-gray-800 leading-relaxed">
            {locale === "bn"
              ? "নিরাপদ এলাকা কোনো সরকারি জরুরি সাড়াদানকারী সংস্থা নয়। আগুন লাগা, অপরাধ, মারাত্মক দুর্ঘটনা বা জীবন-হুমকিকর জরুরি অবস্থায় তাৎক্ষণিকভাবে বাংলাদেশ জাতীয় জরুরি হেল্পলাইন ৯৯৯ (999) এ ফোন করুন।"
              : "NirapodElaka is a civic utility tool, not an official emergency dispatch service. For life-threatening emergencies, medical distress, or fire, call 999 immediately."}
          </p>
        </div>
      </div>

      {/* How it works */}
      <section id="how-it-works" className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-teal-700">
          <Users className="w-6 h-6" />
          <h2 className="font-black text-xl text-gray-900">
            {locale === "bn" ? "কীভাবে কাজ করে?" : "How NirapodElaka Works"}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 text-xs sm:text-sm text-gray-600">
          <div className="space-y-2">
            <span className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center">১</span>
            <h3 className="font-bold text-gray-900 text-sm">{locale === "bn" ? "রিপোর্ট করুন" : "Report"}</h3>
            <p className="leading-relaxed">
              {locale === "bn"
                ? "রাস্তায় জলাবদ্ধতা, ভাঙা রাস্তা বা যানজট দেখলে মানচিত্রে পিন ফেলে বিবরণ দিন। কোনো রেজিস্ট্রেশন বাধ্যতামূলক নয়।"
                : "Spot flooding, blocked routes, or broken roads? Drop a pin on the map and share a concise description."}
            </p>
          </div>
          <div className="space-y-2">
            <span className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center">২</span>
            <h3 className="font-bold text-gray-900 text-sm">{locale === "bn" ? "কমিউনিটি যাচাই" : "Verify"}</h3>
            <p className="leading-relaxed">
              {locale === "bn"
                ? "অন্যান্য স্থানীয় নাগরিকরা রিপোর্টটি প্রত্যক্ষ করে 'এখনও চলছে' বা 'সমাধান হয়েছে' চিহ্নিত করেন।"
                : "Fellow commuters who cross the area confirm whether the condition is active or cleared."}
            </p>
          </div>
          <div className="space-y-2">
            <span className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center">৩</span>
            <h3 className="font-bold text-gray-900 text-sm">{locale === "bn" ? "সঠিক সিদ্ধান্ত নিন" : "Navigate Safely"}</h3>
            <p className="leading-relaxed">
              {locale === "bn"
                ? "তাজা তথ্যের ভিত্তিতে নিজের ও পরিবারের জন্য বিকল্প নিরাপদ চলাচলের পথ নির্বাচন করুন।"
                : "Make informed route decisions based on fresh, community-validated neighborhood data."}
            </p>
          </div>
        </div>
      </section>

      {/* Verification & Lifecycle */}
      <section id="verification" className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-teal-700">
          <FileCheck className="w-6 h-6" />
          <h2 className="font-black text-xl text-gray-900">
            {locale === "bn" ? "যাচাইকরণ ও লাইফসাইকেল" : "Verification & Report Lifecycle"}
          </h2>
        </div>
        <div className="space-y-3 text-xs sm:text-sm text-gray-600 leading-relaxed">
          <p>
            {locale === "bn"
              ? "একটি রিপোর্ট সিস্টেমে আসার পর নিচের ধাপগুলো অতিক্রম করে:"
              : "Every report enters an explicit lifecycle designed to avoid misinformation:"}
          </p>
          <ul className="space-y-2 pl-4 border-l-2 border-teal-500">
            <li><strong>Submitted (জমা দেওয়া হয়েছে):</strong> প্রাথমিক যাচাই ও অ্যান্টি-স্প্যাম চেকের অপেক্ষায়।</li>
            <li><strong>Under Review (পর্যালোচনাধীন):</strong> বিরোধপূর্ণ তথ্য বা মডারেশন পর্যালোচনার মুখে।</li>
            <li><strong>Community Confirmed (সম্প্রদায় নিশ্চিত):</strong> একাধিক স্থানীয় প্রত্যক্ষদর্শী কর্তৃক নিশ্চিতকৃত।</li>
            <li><strong>Disputed (বিতর্কিত):</strong> তথ্যের অসঙ্গতি নির্দেশিত হয়েছে।</li>
            <li><strong>Resolved (সমাধান হয়েছে):</strong> সমস্যা দূরীভূত বা রাস্তা মুক্ত করা হয়েছে।</li>
            <li><strong>Archived (সংরক্ষিত):</strong> পুরোনো রেকর্ড যা ঐতিহাসিক তথ্যের জন্য সংরক্ষিত।</li>
          </ul>
        </div>
      </section>

      {/* Privacy Guarantee */}
      <section id="privacy" className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-teal-700">
          <Lock className="w-6 h-6" />
          <h2 className="font-black text-xl text-gray-900">
            {locale === "bn" ? "গোপনীয়তা ও ব্যক্তিগত তথ্যের সুরক্ষা" : "Privacy & Anonymity Standards"}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-gray-600">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1.5">
            <h3 className="font-bold text-gray-900">{locale === "bn" ? "বাসার ঠিকানা গোপন রাখা" : "No Exact Home Addresses"}</h3>
            <p>{locale === "bn" ? "আমরা কখনো কোনো নাগরিকের বাসার সঠিক নম্বর বা ব্যক্তিগত ফ্ল্যাটের তথ্য প্রকাশ করি না।" : "Reports are pegged to public intersections and street landmarks."}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1.5">
            <h3 className="font-bold text-gray-900">{locale === "bn" ? "ফেস রিকগনিশন ও ট্র্যাকিং নিষিদ্ধ" : "No Facial Recognition"}</h3>
            <p>{locale === "bn" ? "মানুষের মুখমণ্ডল বা ব্যক্তিগত পরিচয় প্রদর্শনকারী ছবি কঠোরভাবে নিষিদ্ধ ও ফিল্টার করা হয়।" : "Photos showing faces or identity documents are flagged and removed."}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
