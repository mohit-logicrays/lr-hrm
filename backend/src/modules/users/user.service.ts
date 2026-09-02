import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { hashPassword, comparePassword } from "../../utils/password";
import { emailService } from "../../services/email.service";
import { userDraftService } from "./user.draft.service";
import type { CreateUserInput, UpdateUserInput, CreateFullUserInput } from "./user.schema";

const userSelect = {
  id: true,
  email: true,
  employeeId: true,
  personalEmail: true,
  mobile: true,
  alternateMobile: true,
  gender: true,
  avatarUrl: true,
  firstName: true,
  lastName: true,
  phone: true,
  designation: true,
  status: true,
  isSpecialRole: true,
  specialRoleName: true,
  mustChangePassword: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { id: true, name: true, displayName: true } },
  department: { select: { id: true, name: true, code: true } },
  profile: true,
  currentEmployment: true,
  importantDates: true,
  previousEmployments: true,
  teamMembers: {
    select: {
      teamId: true,
      isTeamLead: true,
      team: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.UserSelect;

export class UserService {
  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
    roleId?: string;
    departmentId?: string;
    status?: string;
    role?: string; // e.g. "lead,manager"
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;

    let roleFilter: Prisma.UserWhereInput | undefined;
    if (params.role) {
      const roles = params.role.split(",").map((r) => r.trim().toLowerCase());
      roleFilter = {
        role: {
          OR: roles.map((r) => ({
            name: { contains: r, mode: "insensitive" },
          })),
        },
      };
    }

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(params.status ? { status: params.status as never } : {}),
      ...(params.roleId ? { roleId: params.roleId } : {}),
      ...(params.departmentId ? { departmentId: params.departmentId } : {}),
      ...roleFilter,
      ...(params.search
        ? {
            OR: [
              { firstName: { contains: params.search, mode: "insensitive" } },
              { lastName: { contains: params.search, mode: "insensitive" } },
              { email: { contains: params.search, mode: "insensitive" } },
              { employeeId: { contains: params.search, mode: "insensitive" } },
              { designation: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async getById(id: string) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: userSelect,
    });
    if (!user) throw new AppError(404, "User not found");
    return user;
  }

  /**
   * Final creation of employee from complete 6-step wizard
   */
  async createFullUser(data: CreateFullUserInput, createdBy?: string) {
    const { step1, step2, step3, step4, step5, step6, draftId } = data;

    const email = step1.officialEmail.toLowerCase();
    const existing = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    if (existing) {
      throw new AppError(409, `User with official email "${email}" already exists`);
    }

    // Auto-generate employeeId if not manually provided
    let empId = step1.employeeId?.trim();
    if (!empId) {
      const year = new Date().getFullYear();
      const count = await prisma.user.count();
      empId = `LRT-${year}-${String(count + 1).padStart(3, "0")}`;
    }

    const existingEmp = await prisma.user.findFirst({
      where: { employeeId: empId, deletedAt: null },
    });
    if (existingEmp) {
      throw new AppError(409, `User with Employee ID "${empId}" already exists`);
    }

    const role = await prisma.role.findUnique({ where: { id: step1.roleId } });
    if (!role) throw new AppError(404, "Selected role not found");

    const department = await prisma.department.findUnique({ where: { id: step1.departmentId } });
    if (!department) throw new AppError(404, "Selected department not found");

    // Generate secure temporary password
    const tempPassword = `LR@${Math.random().toString(36).slice(-6)}#2026`;
    const passwordHash = await hashPassword(tempPassword);

    // Calculate dates
    const joiningDateObj = new Date(step6.joiningDate);
    const probationMonths = step4.probationPeriodMonths || 3;
    const autoProbationEndDate = new Date(joiningDateObj);
    autoProbationEndDate.setMonth(autoProbationEndDate.getMonth() + probationMonths);

    const probationEndDateObj = step6.probationEndDate ? new Date(step6.probationEndDate) : autoProbationEndDate;

    // Database Transaction
    const user = await prisma.$transaction(async (tx) => {
      // 1. Create Core User
      const createdUser = await tx.user.create({
        data: {
          email,
          employeeId: empId,
          personalEmail: step1.personalEmail || null,
          mobile: step1.mobile,
          alternateMobile: step1.alternateMobile || null,
          gender: step1.gender || null,
          avatarUrl: step1.avatarUrl || null,
          firstName: step1.firstName,
          lastName: step1.lastName,
          phone: step1.mobile,
          designation: step4.designation,
          roleId: role.id,
          departmentId: department.id,
          status: "ACTIVE",
          password: passwordHash,
          isSpecialRole: step5.isSpecialRole || role.isSpecial,
          specialRoleName: step5.isSpecialRole ? step5.specialRoleName || role.displayName : null,
          mustChangePassword: true,
          createdBy,
        },
      });

      // 2. Create Profile Details
      await tx.userProfile.create({
        data: {
          userId: createdUser.id,
          dateOfBirth: step2.dateOfBirth ? new Date(step2.dateOfBirth) : null,
          bloodGroup: step2.bloodGroup || null,
          maritalStatus: step2.maritalStatus || null,
          nationality: step2.nationality || null,
          aadhaarNumber: step2.aadhaarNumber || null,
          panNumber: step2.panNumber || null,
          currentAddress: step2.currentAddress || Prisma.JsonNull,
          permanentAddress: step2.sameAsCurrentAddress ? step2.currentAddress || Prisma.JsonNull : step2.permanentAddress || Prisma.JsonNull,
          sameAsCurrentAddress: step2.sameAsCurrentAddress,
          emergencyContactName: step2.emergencyContactName || null,
          emergencyContactRelation: step2.emergencyContactRelation || null,
          emergencyContactPhone: step2.emergencyContactPhone || null,
          linkedinUrl: step2.linkedinUrl || null,
          portfolioUrl: step2.portfolioUrl || null,
        },
      });

      // 3. Create Current Employment Details
      await tx.userCurrentEmployment.create({
        data: {
          userId: createdUser.id,
          designation: step4.designation,
          employmentType: step4.employmentType,
          workMode: step4.workMode,
          workLocation: step4.workLocation || null,
          ctc: Number(step4.ctc) || 0,
          probationPeriodMonths: Number(step4.probationPeriodMonths) || 3,
          noticePeriodDays: Number(step4.noticePeriodDays) || 30,
          shiftTiming: step4.shiftTiming || null,
          skills: step4.skills || [],
          about: step4.about || null,
          reportingManagerId: step5.reportingManagerId || null,
          projectManagerId: step5.projectManagerId || null,
        },
      });

      // 4. Create Important Dates
      await tx.userImportantDates.create({
        data: {
          userId: createdUser.id,
          interviewDate: step6.interviewDate ? new Date(step6.interviewDate) : null,
          offerDate: step6.offerDate ? new Date(step6.offerDate) : null,
          joiningDate: joiningDateObj,
          probationEndDate: probationEndDateObj,
          confirmationDate: step6.confirmationDate ? new Date(step6.confirmationDate) : null,
          resignDate: step6.resignDate ? new Date(step6.resignDate) : null,
          lastWorkingDay: step6.lastWorkingDay ? new Date(step6.lastWorkingDay) : null,
          fullAndFinalDate: step6.fullAndFinalDate ? new Date(step6.fullAndFinalDate) : null,
        },
      });

      // 5. Create Previous Employment Entries
      if (step3.previousEmployments && step3.previousEmployments.length > 0) {
        await tx.userPreviousEmployment.createMany({
          data: step3.previousEmployments.map((emp) => ({
            userId: createdUser.id,
            companyName: emp.companyName,
            designation: emp.designation || null,
            employmentType: emp.employmentType || null,
            startDate: emp.startDate ? new Date(emp.startDate) : null,
            endDate: emp.endDate ? new Date(emp.endDate) : null,
            lastDrawnSalary: emp.lastDrawnSalary ? Number(emp.lastDrawnSalary) : null,
            reasonForLeaving: emp.reasonForLeaving || null,
            hrContactName: emp.hrContactName || null,
            hrContactPhone: emp.hrContactPhone || null,
            hrContactEmail: emp.hrContactEmail || null,
            experienceLetterUrl: emp.experienceLetterUrl || null,
            relievingLetterUrl: emp.relievingLetterUrl || null,
          })),
        });
      }

      // 6. Create Primary & Additional Team Links
      const allTeamIds = Array.from(new Set([step5.primaryTeamId, ...(step5.additionalTeamIds || [])]));
      for (const tId of allTeamIds) {
        if (tId) {
          await tx.teamMember.create({
            data: {
              userId: createdUser.id,
              teamId: tId,
              isTeamLead: false,
            },
          });
        }
      }

      return createdUser;
    });

    // Clean up draft if draftId provided
    if (draftId) {
      await userDraftService.deleteDraft(draftId);
    }

    // Send Welcome Credentials Email
    const fullName = `${step1.firstName} ${step1.lastName}`.trim();
    await emailService.sendWelcomeCredentials({
      toEmail: email,
      employeeName: fullName,
      employeeId: empId,
      temporaryPassword: tempPassword,
    });

    // Return full created user details
    return this.getById(user.id);
  }

  async create(data: CreateUserInput, createdBy?: string) {
    const email = data.email.toLowerCase();
    const existing = await prisma.user.findFirst({ where: { email, deletedAt: null } });
    if (existing) throw new AppError(409, "User with this email already exists");

    const role = await prisma.role.findUnique({ where: { id: data.roleId } });
    if (!role) throw new AppError(404, "Role not found");

    const password = data.password || `LR@${Math.random().toString(36).slice(-6)}#2026`;
    const passwordHash = await hashPassword(password);

    const count = await prisma.user.count();
    const empId = `LRT-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

    const user = await prisma.user.create({
      data: {
        email,
        employeeId: empId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? null,
        designation: data.designation ?? null,
        roleId: role.id,
        departmentId: data.departmentId ?? null,
        status: data.status,
        password: passwordHash,
        isSpecialRole: role.isSpecial,
        specialRoleName: role.isSpecial ? role.displayName : null,
        mustChangePassword: true,
        createdBy,
      },
      select: userSelect,
    });

    return user;
  }

  async update(id: string, data: UpdateUserInput) {
    const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError(404, "User not found");

    const roleId = data.roleId ?? existing.roleId;
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new AppError(404, "Role not found");

    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        designation: data.designation,
        roleId,
        departmentId: data.departmentId,
        status: data.status,
        isSpecialRole: role.isSpecial || existing.isSpecialRole,
        specialRoleName: role.isSpecial ? role.displayName : existing.specialRoleName,
      },
      select: userSelect,
    });

    return user;
  }

  async updateStatus(id: string, status: "ACTIVE" | "INACTIVE" | "SUSPENDED") {
    const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError(404, "User not found");

    return prisma.user.update({
      where: { id },
      data: { status },
      select: userSelect,
    });
  }

  async resetPassword(id: string, customPassword?: string) {
    const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new AppError(404, "User not found");

    const newPassword = customPassword || `LR@${Math.random().toString(36).slice(-6)}#2026`;
    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id },
      data: { password: passwordHash, mustChangePassword: true },
    });

    return { temporaryPassword: newPassword };
  }

  async remove(id: string) {
    const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError(404, "User not found");

    await prisma.user.update({
      where: { id },
      data: { status: "INACTIVE", deletedAt: new Date() },
    });
  }

  async changePassword(id: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new AppError(404, "User not found");

    const valid = await comparePassword(oldPassword, user.password);
    if (!valid) throw new AppError(400, "Current password is incorrect");

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id },
      data: { password: newHash, mustChangePassword: false },
    });
  }

  async updateProfile(
    id: string,
    data: { firstName?: string; lastName?: string; phone?: string | null; designation?: string | null }
  ) {
    const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new AppError(404, "User not found");

    return prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        designation: data.designation,
      },
      select: userSelect,
    });
  }
}

export const userService = new UserService();
