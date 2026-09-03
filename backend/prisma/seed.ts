import { PrismaClient, type UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { config } from "../src/config";
import { PERMISSIONS } from "../src/modules/permissions/permissions.constants";

const prisma = new PrismaClient();

const BCRYPT_COST = 12;

interface RoleSeed {
  name: string;
  displayName: string;
  description?: string;
  isSpecial: boolean;
  priority: number;
  permissions: string[];
}

const ROLE_SEEDS: RoleSeed[] = [
  {
    name: "superadmin",
    displayName: "Super Admin",
    description: "Full system access and management",
    isSpecial: true,
    priority: 0,
    permissions: [],
  },
  {
    name: "hr",
    displayName: "HR Manager",
    description: "Human resources management, user lifecycle, policies, support tickets, announcements, and leaves",
    isSpecial: false,
    priority: 1,
    permissions: [
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.USER_DELETE,
      PERMISSIONS.USER_ASSIGN_ROLE,
      PERMISSIONS.USER_MANAGE,
      PERMISSIONS.ROLE_READ,
      PERMISSIONS.PERMISSION_READ,
      PERMISSIONS.TIME_LOG_CREATE,
      PERMISSIONS.TIME_LOG_READ_OWN,
      PERMISSIONS.TIME_LOG_READ_ALL,
      PERMISSIONS.TIME_LOG_APPROVE,
      PERMISSIONS.TIME_LOG_MANAGE,
      PERMISSIONS.LEAVE_TYPE_READ,
      PERMISSIONS.LEAVE_TYPE_MANAGE,
      PERMISSIONS.LEAVE_REQUEST_CREATE,
      PERMISSIONS.LEAVE_REQUEST_READ_OWN,
      PERMISSIONS.LEAVE_REQUEST_READ_ALL,
      PERMISSIONS.LEAVE_REQUEST_APPROVE,
      PERMISSIONS.LEAVE_BALANCE_READ,
      PERMISSIONS.LEAVE_BALANCE_MANAGE,
      PERMISSIONS.HOLIDAY_READ,
      PERMISSIONS.HOLIDAY_MANAGE,
      PERMISSIONS.ANNOUNCEMENT_READ,
      PERMISSIONS.POLICY_READ,
      PERMISSIONS.SUPPORT_CREATE,
      PERMISSIONS.SUPPORT_READ_OWN,
      PERMISSIONS.SUPPORT_READ_ALL,
      PERMISSIONS.SUPPORT_MANAGE,
      PERMISSIONS.REQUEST_LOG_READ,
    ],
  },
  {
    name: "manager",
    displayName: "Project Manager",
    description: "Create projects, assign PM/TL/members, manage project details, approve timesheets and manage tasks",
    isSpecial: false,
    priority: 2,
    permissions: [
      PERMISSIONS.USER_READ,
      PERMISSIONS.TEAM_READ,
      PERMISSIONS.DEPARTMENT_READ,
      PERMISSIONS.PROJECT_CREATE,
      PERMISSIONS.PROJECT_READ,
      PERMISSIONS.PROJECT_UPDATE,
      PERMISSIONS.PROJECT_DELETE,
      PERMISSIONS.PROJECT_MANAGE_MEMBERS,
      PERMISSIONS.TIME_LOG_CREATE,
      PERMISSIONS.TIME_LOG_READ_OWN,
      PERMISSIONS.TIME_LOG_READ_ALL,
      PERMISSIONS.TIME_LOG_APPROVE,
      PERMISSIONS.LEAVE_TYPE_READ,
      PERMISSIONS.LEAVE_REQUEST_CREATE,
      PERMISSIONS.LEAVE_REQUEST_READ_OWN,
      PERMISSIONS.LEAVE_BALANCE_READ,
      PERMISSIONS.HOLIDAY_READ,
      PERMISSIONS.ANNOUNCEMENT_READ,
      PERMISSIONS.POLICY_READ,
      PERMISSIONS.SUPPORT_CREATE,
      PERMISSIONS.SUPPORT_READ_OWN,
    ],
  },
  {
    name: "lead",
    displayName: "Team Lead",
    description: "Team management, approve leave requests, add members to project, approve timelogs, team analytics",
    isSpecial: false,
    priority: 3,
    permissions: [
      PERMISSIONS.USER_READ,
      PERMISSIONS.TEAM_READ,
      PERMISSIONS.DEPARTMENT_READ,
      PERMISSIONS.PROJECT_READ,
      PERMISSIONS.PROJECT_MANAGE_MEMBERS,
      PERMISSIONS.TIME_LOG_CREATE,
      PERMISSIONS.TIME_LOG_READ_OWN,
      PERMISSIONS.TIME_LOG_READ_ALL,
      PERMISSIONS.TIME_LOG_APPROVE,
      PERMISSIONS.LEAVE_TYPE_READ,
      PERMISSIONS.LEAVE_REQUEST_CREATE,
      PERMISSIONS.LEAVE_REQUEST_READ_OWN,
      PERMISSIONS.LEAVE_REQUEST_READ_ALL,
      PERMISSIONS.LEAVE_REQUEST_APPROVE,
      PERMISSIONS.LEAVE_BALANCE_READ,
      PERMISSIONS.HOLIDAY_READ,
      PERMISSIONS.ANNOUNCEMENT_READ,
      PERMISSIONS.POLICY_READ,
      PERMISSIONS.SUPPORT_CREATE,
      PERMISSIONS.SUPPORT_READ_OWN,
    ],
  },
  {
    name: "associate",
    displayName: "Associate",
    description: "Individual contributor, timesheets, assigned tasks, own leaves, support tickets",
    isSpecial: false,
    priority: 4,
    permissions: [
      PERMISSIONS.PROJECT_READ,
      PERMISSIONS.TIME_LOG_CREATE,
      PERMISSIONS.TIME_LOG_READ_OWN,
      PERMISSIONS.LEAVE_TYPE_READ,
      PERMISSIONS.LEAVE_REQUEST_CREATE,
      PERMISSIONS.LEAVE_REQUEST_READ_OWN,
      PERMISSIONS.LEAVE_BALANCE_READ,
      PERMISSIONS.HOLIDAY_READ,
      PERMISSIONS.ANNOUNCEMENT_READ,
      PERMISSIONS.POLICY_READ,
      PERMISSIONS.SUPPORT_CREATE,
      PERMISSIONS.SUPPORT_READ_OWN,
    ],
  },
  {
    name: "member",
    displayName: "Member",
    description: "Individual contributor, timesheets, assigned tasks, own leaves, support tickets",
    isSpecial: false,
    priority: 5,
    permissions: [
      PERMISSIONS.PROJECT_READ,
      PERMISSIONS.TIME_LOG_CREATE,
      PERMISSIONS.TIME_LOG_READ_OWN,
      PERMISSIONS.LEAVE_TYPE_READ,
      PERMISSIONS.LEAVE_REQUEST_CREATE,
      PERMISSIONS.LEAVE_REQUEST_READ_OWN,
      PERMISSIONS.LEAVE_BALANCE_READ,
      PERMISSIONS.HOLIDAY_READ,
      PERMISSIONS.ANNOUNCEMENT_READ,
      PERMISSIONS.POLICY_READ,
      PERMISSIONS.SUPPORT_CREATE,
      PERMISSIONS.SUPPORT_READ_OWN,
    ],
  },
];

const SPECIAL_ROLES = [
  { name: "founder", displayName: "Founder", priority: 0 },
  { name: "ceo", displayName: "CEO", priority: 1 },
  { name: "cto", displayName: "CTO", priority: 2 },
  { name: "coo", displayName: "COO", priority: 3 },
  { name: "cfo", displayName: "CFO", priority: 4 },
];

async function seedPermissions(): Promise<void> {
  const permissionSeeds = Object.entries(PERMISSIONS).map(([group, key]) => ({
    key,
    group: key.split(":")[0],
  }));

  for (const seed of permissionSeeds) {
    await prisma.permission.upsert({
      where: { key: seed.key },
      update: { group: seed.group },
      create: { key: seed.key, group: seed.group },
    });
  }
}

async function seedRoles(): Promise<void> {
  for (const role of ROLE_SEEDS) {
    const existing = await prisma.role.findUnique({ where: { name: role.name } });
    if (existing) {
      await prisma.role.update({
        where: { name: role.name },
        data: {
          displayName: role.displayName,
          description: role.description,
          priority: role.priority,
        },
      });
      await prisma.rolePermission.deleteMany({ where: { roleId: existing.id } });
      if (role.permissions.length > 0) {
        const permissions = await prisma.permission.findMany({
          where: { key: { in: role.permissions } },
          select: { id: true },
        });
        await prisma.rolePermission.createMany({
          data: permissions.map((p) => ({ roleId: existing.id, permissionId: p.id })),
          skipDuplicates: true,
        });
      }
      continue;
    }

    const created = await prisma.role.create({
      data: {
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        isSpecial: role.isSpecial,
        isSystem: true,
        priority: role.priority,
      },
    });

    if (role.permissions.length > 0) {
      const permissions = await prisma.permission.findMany({
        where: { key: { in: role.permissions } },
        select: { id: true },
      });
      await prisma.rolePermission.createMany({
        data: permissions.map((p) => ({ roleId: created.id, permissionId: p.id })),
      });
    }
  }

  for (const special of SPECIAL_ROLES) {
    await prisma.role.upsert({
      where: { name: special.name },
      update: { displayName: special.displayName, priority: special.priority, isSpecial: true },
      create: {
        name: special.name,
        displayName: special.displayName,
        isSpecial: true,
        isSystem: true,
        priority: special.priority,
      },
    });
  }
}

async function seedSuperUser(): Promise<void> {
  const email = config.superuser.email;
  const password = config.superuser.password;
  const role = await prisma.role.findUnique({ where: { name: "superadmin" } });
  if (!role) throw new Error("superadmin role not seeded");

  const existing = await prisma.user.findFirst({ where: { email } });
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        roleId: role.id,
        isSpecialRole: true,
        specialRoleName: "Super Admin",
        status: "ACTIVE" as UserStatus,
        deletedAt: null,
        password: passwordHash,
        mustChangePassword: false,
      },
    });
    return;
  }

  await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      firstName: "Super",
      lastName: "Admin",
      designation: "Super Admin",
      roleId: role.id,
      isSpecialRole: true,
      specialRoleName: "Super Admin",
      status: "ACTIVE",
      mustChangePassword: false,
    },
  });
}

async function seedLeaveTypes(): Promise<void> {
  const LEAVE_TYPES = [
    { name: "Casual Leave", code: "CL", maxDaysPerYear: 12, isPaid: true },
    { name: "Sick Leave", code: "SL", maxDaysPerYear: 10, isPaid: true },
    { name: "Earned / Privilege Leave", code: "PL", maxDaysPerYear: 15, isPaid: true },
    { name: "Maternity Leave", code: "ML", maxDaysPerYear: 180, isPaid: true },
    { name: "Paternity Leave", code: "PTL", maxDaysPerYear: 15, isPaid: true },
    { name: "Bereavement Leave", code: "BL", maxDaysPerYear: 5, isPaid: true },
    { name: "Compensatory Off", code: "COMP_OFF", maxDaysPerYear: 12, isPaid: true },
    { name: "Leave Without Pay", code: "LWP", maxDaysPerYear: null, isPaid: false },
  ];

  for (const lt of LEAVE_TYPES) {
    await prisma.leaveType.upsert({
      where: { code: lt.code },
      update: { name: lt.name, maxDaysPerYear: lt.maxDaysPerYear, isPaid: lt.isPaid },
      create: lt,
    });
  }
}

async function main(): Promise<void> {
  await seedPermissions();
  await seedRoles();
  await seedSuperUser();
  await seedLeaveTypes();
  // eslint-disable-next-line no-console
  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
