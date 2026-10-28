import { hashPassword, verifyPassword } from "./security";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  role: "user" | "moderator" | "admin";
  status: "active" | "suspended";
  reportsSubmitted: number;
  verificationsCount: number;
  createdAt: string;
  updatedAt: string;
  suspendedReason?: string;
  suspendedAt?: string;
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

// Initial seed passwords hashed with PBKDF2
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
    reportsSubmitted: 3,
    verificationsCount: 15,
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
    reportsSubmitted: 5,
    verificationsCount: 38,
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
    reportsSubmitted: 2,
    verificationsCount: 6,
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
      reportsSubmitted: 0,
      verificationsCount: 0,
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

  updateUserRole(
    targetUserId: string,
    newRole: "user" | "moderator" | "admin",
    admin: { id: string; email: string },
    reason: string
  ): AppUser {
    const target = this.findUserById(targetUserId);
    if (!target) throw new Error("Target user not found.");

    const oldRole = target.role;
    target.role = newRole;
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

  updateUserStatus(
    targetUserId: string,
    newStatus: "active" | "suspended",
    admin: { id: string; email: string },
    reason: string
  ): AppUser {
    const target = this.findUserById(targetUserId);
    if (!target) throw new Error("Target user not found.");

    const now = new Date().toISOString();
    target.status = newStatus;
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

  incrementUserReportCount(userId: string) {
    const user = this.findUserById(userId);
    if (user) {
      user.reportsSubmitted += 1;
      user.updatedAt = new Date().toISOString();
    }
  }

  incrementUserVerifyCount(userId: string) {
    const user = this.findUserById(userId);
    if (user) {
      user.verificationsCount += 1;
      user.updatedAt = new Date().toISOString();
    }
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

  getAuditLogs(): AdminAuditLog[] {
    return this.auditLogs;
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
