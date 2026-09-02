import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { hashPassword, comparePassword } from "../../utils/password";
import type {
  UpdateBasicDetailsInput,
  UpdateAddressInput,
  UpdateEmergencyContactInput,
} from "./profile.schema";

const profileSelect = {
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
  createdAt: true,
  updatedAt: true,
  role: { select: { id: true, name: true, displayName: true } },
  department: { select: { id: true, name: true, code: true } },
  profile: true,
  currentEmployment: {
    select: {
      designation: true,
      employmentType: true,
      workMode: true,
      workLocation: true,
      reportingManager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          designation: true,
        },
      },
    },
  },
  importantDates: {
    select: {
      joiningDate: true,
      confirmationDate: true,
    },
  },
  teamMembers: {
    select: {
      teamId: true,
      isTeamLead: true,
      team: { select: { id: true, name: true } },
    },
  },
};

export class ProfileService {
  /**
   * Fetch current user profile with full details
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: profileSelect,
    });
    if (!user) throw new AppError(404, "User not found");
    return user;
  }

  /**
   * Update basic details (First Name, Last Name, Personal Email, Mobile, Gender, DOB, Social Links)
   */
  async updateBasic(userId: string, data: UpdateBasicDetailsInput) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new AppError(404, "User not found");

    // Update User table fields
    await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        personalEmail: data.personalEmail || null,
        mobile: data.mobile || null,
        phone: data.mobile || user.phone,
        alternateMobile: data.alternateMobile || null,
        gender: data.gender || null,
      },
    });

    // Parse dateOfBirth safely
    let dob: Date | null = null;
    if (data.dateOfBirth) {
      const parsed = new Date(data.dateOfBirth);
      if (!isNaN(parsed.getTime())) {
        dob = parsed;
      }
    }

    // Upsert UserProfile record
    await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        dateOfBirth: dob,
        linkedinUrl: data.linkedinUrl || null,
        portfolioUrl: data.portfolioUrl || null,
      },
      update: {
        dateOfBirth: dob,
        linkedinUrl: data.linkedinUrl || null,
        portfolioUrl: data.portfolioUrl || null,
      },
    });

    return this.getProfile(userId);
  }

  /**
   * Update address details (Current + Permanent)
   */
  async updateAddress(userId: string, data: UpdateAddressInput) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new AppError(404, "User not found");

    const permanentAddress = data.sameAsCurrentAddress
      ? data.currentAddress
      : data.permanentAddress;

    await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        currentAddress: (data.currentAddress as any) || null,
        permanentAddress: (permanentAddress as any) || null,
        sameAsCurrentAddress: data.sameAsCurrentAddress,
      },
      update: {
        currentAddress: (data.currentAddress as any) || null,
        permanentAddress: (permanentAddress as any) || null,
        sameAsCurrentAddress: data.sameAsCurrentAddress,
      },
    });

    return this.getProfile(userId);
  }

  /**
   * Update emergency contact details
   */
  async updateEmergency(userId: string, data: UpdateEmergencyContactInput) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new AppError(404, "User not found");

    await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        emergencyContactName: data.emergencyContactName,
        emergencyContactRelation: data.emergencyContactRelation,
        emergencyContactPhone: data.emergencyContactPhone,
      },
      update: {
        emergencyContactName: data.emergencyContactName,
        emergencyContactRelation: data.emergencyContactRelation,
        emergencyContactPhone: data.emergencyContactPhone,
      },
    });

    return this.getProfile(userId);
  }

  /**
   * Update avatar image URL
   */
  async updatePicture(userId: string, avatarUrl: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new AppError(404, "User not found");

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return this.getProfile(userId);
  }

  /**
   * Change password with validation of current password
   */
  async changePassword(userId: string, oldPass: string, newPass: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new AppError(404, "User not found");

    const valid = await comparePassword(oldPass, user.password);
    if (!valid) {
      throw new AppError(400, "Current password is incorrect");
    }

    const newHash = await hashPassword(newPass);
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: newHash,
        mustChangePassword: false,
      },
    });

    return { message: "Password updated successfully" };
  }
}

export const profileService = new ProfileService();
