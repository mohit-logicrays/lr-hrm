/*
  Warnings:

  - You are about to drop the column `responseBody` on the `RequestLog` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Department_code_key";

-- DropIndex
DROP INDEX "Project_code_key";

-- DropIndex
DROP INDEX "Team_name_departmentId_key";

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RequestLog" DROP COLUMN "responseBody";

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Department_deletedAt_idx" ON "Department"("deletedAt");

-- CreateIndex
CREATE INDEX "Project_deletedAt_idx" ON "Project"("deletedAt");

-- CreateIndex
CREATE INDEX "Team_deletedAt_idx" ON "Team"("deletedAt");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- Partial unique indexes so soft-deleted rows don't block recreation
CREATE UNIQUE INDEX "Department_code_active_key"
  ON "Department"("code") WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX "Project_code_active_key"
  ON "Project"("code") WHERE "deletedAt" IS NULL AND "code" IS NOT NULL;

CREATE UNIQUE INDEX "Team_name_departmentId_active_key"
  ON "Team"("name", "departmentId") WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX "User_email_active_key"
  ON "User"("email") WHERE "deletedAt" IS NULL;
