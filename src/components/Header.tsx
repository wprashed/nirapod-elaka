"use client";

import React, { useState, useRef, useEffect } from "react";
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
  ChevronDown,
  Crown,
} from "lucide-react";

export function Header() {
  const { locale, setLocale, t } = useI18n();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleLanguage = () => {
    setLocale(locale === "bn" ? "en" : "bn");
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setUserDropdownOpen(false);
      }
    }
    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [userDropdownOpen]);

  // Close menus on route navigation
  useEffect(() => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  const publicNavLinks = [
    { href: "/", label: t("nav.home", "মানচিত্র ও রিপোর্ট"), icon: MapPin },
    { href: "/browse", label: t("nav.browse", "রিপোর্ট দেখুন"), icon: ListFilter },
    { href: "/about", label: t("nav.about", "সম্পর্কে"), icon: Info },
  ];

  const getRoleLabel = (role: string) => {
    if (role === "admin") return locale === "bn" ? "অ্যাডমিন" : "Admin";
    if (role === "moderator") return locale === "bn" ? "মডারেটর" : "Moderator";
    return locale === "bn" ? "নাগরিক" : "Citizen";
  };

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
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg p-1 shrink-0"
            aria-label="NirapodElaka Home"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="font-black text-base sm:text-xl text-gray-900 tracking-tight block leading-tight">
                {locale === "bn" ? "নিরাপদ এলাকা" : "NirapodElaka"}
              </span>
              <span className="text-[10px] text-teal-700 font-bold tracking-wide uppercase block">
                {locale === "bn" ? "ঢাকা লাইভ নেটওয়ার্ক" : "Dhaka Live Network"}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation (Strictly Public 3 Links - No Clutter) */}
          <nav className="hidden md:flex items-center gap-1">
            {publicNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-teal-50 text-teal-700 font-bold"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4 text-gray-500" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Language, User Profile Dropdown, Report CTA */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition shrink-0"
              aria-label="Switch Language / ভাষা পরিবর্তন"
            >
              <Globe className="w-3.5 h-3.5 text-gray-500" />
              <span>{locale === "bn" ? "English" : "বাংলা"}</span>
            </button>

            {/* User Profile Dropdown Menu */}
            {user ? (
              <div className="relative shrink-0" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    userDropdownOpen
                      ? "bg-teal-50 border-teal-300 ring-2 ring-teal-500/20"
                      : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800"
                  }`}
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                  aria-label="User Account Menu"
                >
                  {/* User Avatar */}
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>

                  {/* User Name & Civic Badge */}
                  <div className="hidden sm:flex flex-col items-start text-left leading-tight">
                    <span className="font-bold text-xs text-gray-900 max-w-[130px] truncate">
                      {user.name}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-900 flex items-center gap-0.5">
                      <span>⭐</span>
                      <span>{user.civicPoints ?? 0}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-teal-700 uppercase font-bold">{user.role}</span>
                    </span>
                  </div>

                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${
                      userDropdownOpen ? "rotate-180 text-teal-700" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Card */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Profile Header Card */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">
                          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>

                      {/* Civic Reputation Status Pill */}
                      <div className="mt-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            ⭐
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wide block">
                              {locale === "bn" ? "নাগরিক সুনাম" : "Civic Reputation"}
                            </span>
                            <span className="text-xs font-black text-amber-950">
                              {user.civicPoints ?? 0} {locale === "bn" ? "পয়েন্ট" : "pts"}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : user.role === "moderator"
                              ? "bg-teal-100 text-teal-800 border border-teal-200"
                              : "bg-gray-100 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="px-2 py-1.5 space-y-0.5">
                      <Link
                        href="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                          pathname === "/dashboard"
                            ? "bg-teal-50 text-teal-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <LayoutDashboard className="w-4 h-4 text-teal-600" />
                        <span>{locale === "bn" ? "আমার ড্যাশবোর্ড" : "My Dashboard"}</span>
                      </Link>

                      {(user.role === "moderator" || user.role === "admin") && (
                        <Link
                          href="/moderation"
                          onClick={() => setUserDropdownOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                            pathname === "/moderation"
                              ? "bg-teal-50 text-teal-700"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <ShieldAlert className="w-4 h-4 text-amber-600" />
                          <span>{locale === "bn" ? "মডারেশন ডেস্ক" : "Moderation Desk"}</span>
                        </Link>
                      )}

                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                            pathname === "/admin"
                              ? "bg-purple-50 text-purple-700"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <Crown className="w-4 h-4 text-purple-600" />
                          <span>{locale === "bn" ? "অ্যাডমিন ডেস্ক" : "Admin Desk"}</span>
                        </Link>
                      )}
                    </div>

                    {/* Divider & Sign Out */}
                    <div className="pt-1.5 mt-1 border-t border-gray-100 px-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setUserDropdownOpen(false);
                          await logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-700 hover:bg-rose-50 transition"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>{locale === "bn" ? "সাইন আউট" : "Sign Out"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition shadow-2xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{locale === "bn" ? "সাইন ইন" : "Sign In"}</span>
              </Link>
            )}

            {/* Primary Action: Report CTA */}
            <Link
              href="/report/new"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{t("report.newTitle", "হ্যাজার্ড রিপোর্ট")}</span>
              <span className="sm:hidden">{locale === "bn" ? "রিপোর্ট" : "Report"}</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
          {user ? (
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-gray-900 block leading-tight">{user.name}</span>
                    <span className="text-xs text-gray-500 block">{user.email}</span>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                    user.role === "admin"
                      ? "bg-purple-100 text-purple-800"
                      : user.role === "moderator"
                      ? "bg-teal-100 text-teal-800"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {getRoleLabel(user.role)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 text-xs">
                <span className="font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1">
                  ⭐ {user.civicPoints ?? 0} {locale === "bn" ? "পয়েন্ট" : "pts"}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await logout();
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition"
                >
                  {locale === "bn" ? "সাইন আউট" : "Sign Out"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 text-center text-xs font-bold text-gray-700 bg-gray-100 rounded-xl"
              >
                {locale === "bn" ? "সাইন ইন" : "Sign In"}
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 text-center text-xs font-bold text-white bg-teal-600 rounded-xl"
              >
                {locale === "bn" ? "নিবন্ধন" : "Register"}
              </Link>
            </div>
          )}

          {/* Public links */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 px-3 tracking-wider">
              {locale === "bn" ? "মেনু" : "Navigation"}
            </span>
            {publicNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold ${
                    isActive
                      ? "bg-teal-50 text-teal-700 font-bold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4 text-gray-500" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Management links if logged in */}
          {user && (
            <div className="space-y-1 pt-2 border-t border-gray-100">
              <span className="text-[10px] uppercase font-bold text-gray-400 px-3 tracking-wider">
                {locale === "bn" ? "নাগরিক ও ব্যবস্থাপনা" : "Account & Management"}
              </span>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold ${
                  pathname === "/dashboard"
                    ? "bg-teal-50 text-teal-700 font-bold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-teal-600" />
                <span>{locale === "bn" ? "আমার ড্যাশবোর্ড" : "My Dashboard"}</span>
              </Link>

              {(user.role === "moderator" || user.role === "admin") && (
                <Link
                  href="/moderation"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold ${
                    pathname === "/moderation"
                      ? "bg-teal-50 text-teal-700 font-bold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>{locale === "bn" ? "মডারেশন ডেস্ক" : "Moderation Desk"}</span>
                </Link>
              )}

              {user.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold ${
                    pathname === "/admin"
                      ? "bg-purple-50 text-purple-700 font-bold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Crown className="w-4 h-4 text-purple-600" />
                  <span>{locale === "bn" ? "অ্যাডমিন ডেস্ক" : "Admin Desk"}</span>
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
