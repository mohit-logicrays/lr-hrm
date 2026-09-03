import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Restore team & department read permissions to hr, manager, and lead roles.
 * (Teams/Departments are read-only visible for these roles, but hidden in the
 * sidebar UI via frontend navigation — the permission itself stays.)
 * Idempotent — safe to run multiple times.
 */
async function main() {
  const targets = [
    { roleName: "hr", key: "team:read" },
    { roleName: "hr", key: "department:read" },
    { roleName: "manager", key: "team:read" },
    { roleName: "manager", key: "department:read" },
    { roleName: "lead", key: "team:read" },
    { roleName: "lead", key: "department:read" },
  ];

  let added = 0;

  for (const { roleName, key } of targets) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      // eslint-disable-next-line no-console
      console.log(`Skipping: role '${roleName}' not found`);
      continue;
    }

    const permission = await prisma.permission.findUnique({ where: { key } });
    if (!permission) {
      // eslint-disable-next-line no-console
      console.log(`Skipping: permission '${key}' not found`);
      continue;
    }

    const result = await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: role.id, permissionId: permission.id },
      },
      update: {},
      create: { roleId: role.id, permissionId: permission.id },
    });
    added += result.id ? 1 : 0;
    // eslint-disable-next-line no-console
    console.log(`Ensured '${key}' on '${roleName}'`);
  }

  // eslint-disable-next-line no-console
  console.log(`Done. Ensured ${added} role-permission row(s).`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error("Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
