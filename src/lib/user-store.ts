import crypto from "crypto";
import { hashPassword, verifyPassword } from "./security";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  role: "user" | "moderator" | "admin";
  status: "active" | "suspended";
  tokenVersion: number; // Item 2: Incremented on password change or suspension
  reportsSubmitted: number;
  verificationsCount: number;
  updatesCount?: number;
  civicPoints: number; // Gamification civic score
  badges: string[];
  streakDays: number;
  lastActiveDate?: string;
  createdAt: string;
  updatedAt: string;
  suspendedReason?: string;
  suspendedAt?: string;
  resetToken?: string;
  resetTokenExpires?: number;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetUserId?: string;
  targetUserEmail?: string;
  details: string;
  createdAt: string;
}

const adminCreds = hashPassword("Admin@123456");
const modCreds = hashPassword("Mod@123456");
const userCreds = hashPassword("User@123456");

const INITIAL_USERS: AppUser[] = [
  {
    id: "usr-admin-001",
    name: "Civic Administrator",
    email: "admin@nirapod.local",
    passwordHash: adminCreds.hash,
    passwordSalt: adminCreds.salt,
    role: "admin",
    status: "active",
    tokenVersion: 1,
    reportsSubmitted: 3,
    verificationsCount: 15,
    civicPoints: 320,
    badges: ["first_alert", "flood_scout", "route_guardian", "truth_sentinel", "dhaka_hero"],
    streakDays: 8,
    createdAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
  },
  {
    id: "usr-mod-002",
    name: "Dhaka Ward Moderator",
    email: "moderator@nirapod.local",
    passwordHash: modCreds.hash,
    passwordSalt: modCreds.salt,
    role: "moderator",
    status: "active",
    tokenVersion: 1,
    reportsSubmitted: 5,
    verificationsCount: 38,
    civicPoints: 195,
    badges: ["first_alert", "flood_scout", "truth_sentinel", "live_reporter", "dhaka_hero"],
    streakDays: 5,
    createdAt: new Date(Date.now() - 20 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 24 * 3600000).toISOString(),
  },
  {
    id: "usr-user-003",
    name: "Tanvir Ahmed",
    email: "user@nirapod.local",
    passwordHash: userCreds.hash,
    passwordSalt: userCreds.salt,
    role: "user",
    status: "active",
    tokenVersion: 1,
    reportsSubmitted: 2,
    verificationsCount: 6,
    civicPoints: 85,
    badges: ["first_alert", "flood_scout", "truth_sentinel"],
    streakDays: 3,
    createdAt: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
  },
];

const INITIAL_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: "alog-001",
    adminId: "usr-admin-001",
    adminEmail: "admin@nirapod.local",
    action: "system_init",
    details: "Platform initialized with Dhaka civic oversight policy and default role assignments.",
    createdAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
  },
];

class UserStore {
  private users: AppUser[] = [...INITIAL_USERS];
  private auditLogs: AdminAuditLog[] = [...INITIAL_AUDIT_LOGS];

  findUserByEmail(email: string): AppUser | null {
    const normalized = email.toLowerCase().trim();
    return this.users.find((u) => u.email.toLowerCase() === normalized) || null;
  }

  findUserById(id: string): AppUser | null {
    return this.users.find((u) => u.id === id) || null;
  }

  createUser(data: {
    name: string;
    email: string;
    password: string;
    role?: "user" | "moderator" | "admin";
  }): AppUser {
    const existing = this.findUserByEmail(data.email);
    if (existing) {
      throw new Error("An account with this email address already exists.");
    }

    const { hash, salt } = hashPassword(data.password);
    const now = new Date().toISOString();

    const newUser: AppUser = {
      id: `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      passwordHash: hash,
      passwordSalt: salt,
      role: data.role || "user",
      status: "active",
      tokenVersion: 1,
      reportsSubmitted: 0,
      verificationsCount: 0,
      civicPoints: 0,
      badges: [],
      streakDays: 1,
      createdAt: now,
      updatedAt: now,
    };

    this.users.unshift(newUser);
    return newUser;
  }

  listUsers(search?: string): Omit<AppUser, "passwordHash" | "passwordSalt">[] {
    let list = this.users;
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }

    return list.map(({ passwordHash, passwordSalt, ...safeUser }) => safeUser);
  }

  // Item 25: Guard against self-demotion
  updateUserRole(
    targetUserId: string,
    newRole: "user" | "moderator" | "admin",
    admin: { id: string; email: string },
    reason: string
  ): AppUser {
    if (targetUserId === admin.id && newRole !== "admin") {
      throw new Error("Security restriction: Administrators cannot demote their own account.");
    }

    const target = this.findUserById(targetUserId);
    if (!target) throw new Error("Target user not found.");

    const oldRole = target.role;
    target.role = newRole;
    target.tokenVersion += 1; // Invalidate sessions to refresh permissions
    target.updatedAt = new Date().toISOString();

    this.logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "role_change",
      targetUserId: target.id,
      targetUserEmail: target.email,
      details: `Changed role from '${oldRole}' to '${newRole}'. Rationale: ${reason}`,
    });

    return target;
  }

  // Item 2: Invalidate sessions upon suspension
  updateUserStatus(
    targetUserId: string,
    newStatus: "active" | "suspended",
    admin: { id: string; email: string },
    reason: string
  ): AppUser {
    if (targetUserId === admin.id) {
      throw new Error("Security restriction: Administrators cannot suspend their own account.");
    }

    const target = this.findUserById(targetUserId);
    if (!target) throw new Error("Target user not found.");

    const now = new Date().toISOString();
    target.status = newStatus;
    target.tokenVersion += 1; // Immediate session revocation
    target.updatedAt = now;

    if (newStatus === "suspended") {
      target.suspendedReason = reason;
      target.suspendedAt = now;
    } else {
      target.suspendedReason = undefined;
      target.suspendedAt = undefined;
    }

    this.logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: newStatus === "suspended" ? "user_suspended" : "user_reactivated",
      targetUserId: target.id,
      targetUserEmail: target.email,
      details: `Account ${newStatus}. Rationale: ${reason}`,
    });

    return target;
  }

  // Item 6: Password reset support
  generatePasswordResetToken(email: string): string | null {
    const user = this.findUserByEmail(email);
    if (!user) return null;

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpires = Date.now() + 3600000; // 1 hour expiration
    return token;
  }

  resetPasswordWithToken(token: string, newPass: string): boolean {
    const user = this.users.find(
      (u) => u.resetToken === token && u.resetTokenExpires && u.resetTokenExpires > Date.now()
    );
    if (!user) return false;

    const { hash, salt } = hashPassword(newPass);
    user.passwordHash = hash;
    user.passwordSalt = salt;
    user.tokenVersion += 1; // Revoke old sessions
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    user.updatedAt = new Date().toISOString();
    return true;
  }

  // Record daily streak logic
  private updateStreak(user: AppUser) {
    const today = new Date().toISOString().slice(0, 10);
    if (!user.lastActiveDate) {
      user.streakDays = 1;
      user.lastActiveDate = today;
      return;
    }

    if (user.lastActiveDate === today) {
      return; // already recorded today
    }

    const prev = new Date(user.lastActiveDate);
    const curr = new Date(today);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 1) {
      user.streakDays = (user.streakDays || 0) + 1;
    } else {
      user.streakDays = 1;
    }
    user.lastActiveDate = today;
  }

  // Dynamic badge evaluation engine
  private evaluateBadges(user: AppUser, context?: { category?: string }) {
    if (!user.badges) user.badges = [];

    // First alert badge
    if (user.reportsSubmitted >= 1 && !user.badges.includes("first_alert")) {
      user.badges.push("first_alert");
    }

    // Truth sentinel badge (3+ verifications)
    if (user.verificationsCount >= 3 && !user.badges.includes("truth_sentinel")) {
      user.badges.push("truth_sentinel");
    }

    // Category specific badges
    if (context?.category) {
      if (
        context.category === "waterlogging" &&
        !user.badges.includes("flood_scout")
      ) {
        user.badges.push("flood_scout");
      }
      if (
        (context.category === "damaged_road" ||
          context.category === "blocked_road" ||
          context.category === "traffic_disruption" ||
          context.category === "fallen_tree") &&
        !user.badges.includes("route_guardian")
      ) {
        user.badges.push("route_guardian");
      }
    }

    // Live reporter badge (2+ updates)
    if ((user.updatesCount || 0) >= 2 && !user.badges.includes("live_reporter")) {
      user.badges.push("live_reporter");
    }

    // Dhaka Hero (150+ points)
    if (user.civicPoints >= 150 && !user.badges.includes("dhaka_hero")) {
      user.badges.push("dhaka_hero");
    }
  }

  revokeUserSession(userId: string) {
    const user = this.findUserById(userId);
    if (user) {
      user.tokenVersion += 1;
      user.updatedAt = new Date().toISOString();
    }
  }

  deductCivicPoints(userId: string, points: number, reason?: string) {
    const user = this.findUserById(userId);
    if (user) {
      user.civicPoints = Math.max(0, (user.civicPoints || 0) - points);
      // Remove Dhaka hero badge if dropped below 150
      if (user.civicPoints < 150 && user.badges.includes("dhaka_hero")) {
        user.badges = user.badges.filter((b) => b !== "dhaka_hero");
      }
      user.updatedAt = new Date().toISOString();
    }
  }

  incrementUserReportCount(userId: string) {
    const user = this.findUserById(userId);
    if (user) {
      user.reportsSubmitted += 1;
      this.updateStreak(user);
      this.evaluateBadges(user);
      user.updatedAt = new Date().toISOString();
    }
  }

  incrementUserVerifyCount(userId: string) {
    const user = this.findUserById(userId);
    if (user) {
      user.verificationsCount += 1;
      user.civicPoints = (user.civicPoints || 0) + 10;
      this.updateStreak(user);
      this.evaluateBadges(user);
      user.updatedAt = new Date().toISOString();
    }
  }

  incrementReports(userId: string, pointsBonus = 25, category?: string) {
    const user = this.findUserById(userId);
    if (user) {
      user.reportsSubmitted += 1;
      user.civicPoints = (user.civicPoints || 0) + pointsBonus;
      this.updateStreak(user);
      this.evaluateBadges(user, { category });
      user.updatedAt = new Date().toISOString();
    }
  }

  incrementUpdatesCount(userId: string, pointsBonus = 15) {
    const user = this.findUserById(userId);
    if (user) {
      user.updatesCount = (user.updatesCount || 0) + 1;
      user.civicPoints = (user.civicPoints || 0) + pointsBonus;
      this.updateStreak(user);
      this.evaluateBadges(user);
      user.updatedAt = new Date().toISOString();
    }
  }

  addCivicPoints(userId: string, points: number, badgeId?: string) {
    const user = this.findUserById(userId);
    if (user) {
      user.civicPoints = Math.max(0, (user.civicPoints || 0) + points);
      if (badgeId && !user.badges.includes(badgeId)) {
        user.badges.push(badgeId);
      }
      this.updateStreak(user);
      this.evaluateBadges(user);
      user.updatedAt = new Date().toISOString();
      return user;
    }
    return null;
  }

  logAdminAction(log: Omit<AdminAuditLog, "id" | "createdAt">): AdminAuditLog {
    const entry: AdminAuditLog = {
      id: `alog-${Date.now().toString(36)}`,
      ...log,
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(entry);
    return entry;
  }

  getAuditLogs(filters?: { action?: string; adminEmail?: string }): AdminAuditLog[] {
    let logs = this.auditLogs;
    if (filters?.action && filters.action !== "all") {
      logs = logs.filter((l) => l.action === filters.action);
    }
    if (filters?.adminEmail && filters.adminEmail.trim()) {
      const q = filters.adminEmail.toLowerCase().trim();
      logs = logs.filter((l) => l.adminEmail.toLowerCase().includes(q));
    }
    return logs;
  }

  getStats() {
    const total = this.users.length;
    const active = this.users.filter((u) => u.status === "active").length;
    const suspended = this.users.filter((u) => u.status === "suspended").length;
    const admins = this.users.filter((u) => u.role === "admin").length;
    const moderators = this.users.filter((u) => u.role === "moderator").length;
    const regularUsers = this.users.filter((u) => u.role === "user").length;

    return {
      total,
      active,
      suspended,
      admins,
      moderators,
      regularUsers,
    };
  }
}

declare global {
  // eslint-disable-next-line no-var
  var _nirapodUserStore: UserStore | undefined;
}

if (!global._nirapodUserStore) {
  global._nirapodUserStore = new UserStore();
}

export const userStore = global._nirapodUserStore;
