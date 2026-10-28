"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import {
  AlertTriangle,
  Shield,
  MapPin,
  PlusCircle,
  Menu,
  X,
  Globe,
  ShieldAlert,
  ListFilter,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  User,
  Crown,
} from "lucide-react";

export function Header() {
  const { locale, setLocale, t } = useI18n();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    setLocale(locale === "bn" ? "en" : "bn");
  };

  const navLinks = [
    { href: "/", label: t("nav.home", "মানচিত্র ও রিপোর্ট"), icon: MapPin },
    { href: "/browse", label: t("nav.browse", "রিপোর্ট দেখুন"), icon: ListFilter },
    { href: "/about", label: t("nav.about", "সম্পর্কে"), icon: Info },
  ];

  // Dynamic role-based navigation links
  if (user?.role === "moderator" || user?.role === "admin") {
    navLinks.push({
      href: "/moderation",
      label: locale === "bn" ? "মডারেশন" : "Moderation",
      icon: ShieldAlert,
    });
  }

  if (user?.role === "admin") {
    navLinks.push({
      href: "/admin",
      label: locale === "bn" ? "অ্যাডমিন ডেস্ক" : "Admin Desk",
      icon: Crown,
    });
  }

  if (user) {
    navLinks.push({
      href: "/dashboard",
      label: t("nav.dashboard", "ড্যাশবোর্ড"),
      icon: LayoutDashboard,
    });
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
      {/* Critical Public Safety Disclaimer Bar */}
      <div className="bg-amber-500 text-amber-950 px-3 py-1.5 text-xs sm:text-sm font-medium flex items-center justify-between shadow-inner">
        <div className="flex items-center gap-1.5 max-w-7xl mx-auto w-full">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-950" aria-hidden="true" />
          <span>
            {locale === "bn"
              ? "জরুরি পরিস্থিতির জন্য ৯৯৯ কল করুন। নিরাপদ এলাকা একটি কমিউনিটি প্ল্যাটফর্ম, কোনো সরকারি জরুরি সেবা নয়।"
              : "Call 999 for emergencies. NirapodElaka is a community platform, not an official emergency service."}
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg p-1"
            aria-label="NirapodElaka Home"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl text-gray-900 tracking-tight block leading-tight">
                {locale === "bn" ? "নিরাপদ এলাকা" : "NirapodElaka"}
              </span>
              <span className="text-[10px] text-teal-700 font-medium tracking-wide uppercase block">
                {locale === "bn" ? "ঢাকা কমিউনিটি প্ল্যাটফর্ম" : "Dhaka Community"}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-teal-50 text-teal-700 font-semibold"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Auth, Language, Report CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-label="Switch Language / ভাষা পরিবর্তন"
            >
              <Globe className="w-3.5 h-3.5 text-gray-500" />
              <span>{locale === "bn" ? "English" : "বাংলা"}</span>
            </button>

            {/* Auth State Button */}
            {user ? (
              <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-1 pl-2.5">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-bold text-gray-800 truncate max-w-[110px]">{user.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold uppercase ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : user.role === "moderator"
                        ? "bg-teal-100 text-teal-800"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-lg transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{locale === "bn" ? "সাইন ইন" : "Sign In"}</span>
              </Link>
            )}

            {/* Report CTA */}
            <Link
              href="/report/new"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden xs:inline">{t("report.newTitle", "হ্যাজার্ড রিপোর্ট")}</span>
              <span className="xs:hidden">{locale === "bn" ? "রিপোর্ট" : "Report"}</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg">
          {user && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between mb-2">
              <div>
                <span className="font-bold text-sm text-gray-900 block">{user.name}</span>
                <span className="text-xs text-gray-500">{user.email} · <strong className="uppercase text-teal-700">{user.role}</strong></span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg"
              >
                Sign Out
              </button>
            </div>
          )}

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive
                    ? "bg-teal-50 text-teal-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5 text-gray-500" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          {!user && (
            <div className="pt-2 border-t border-gray-100 flex gap-2">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center text-xs font-bold text-gray-700 bg-gray-100 rounded-xl"
              >
                {locale === "bn" ? "সাইন ইন" : "Sign In"}
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center text-xs font-bold text-white bg-teal-600 rounded-xl"
              >
                {locale === "bn" ? "নিবন্ধন" : "Register"}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
