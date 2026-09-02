import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import type { CreateDraftInput } from "./user.schema";

export class UserDraftService {
  /**
   * Save or update draft for multi-step user creation wizard
   */
  async saveDraft(data: CreateDraftInput, createdBy?: string) {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days expiration

    if (data.draftId) {
      const existing = await prisma.userDraft.findUnique({ where: { id: data.draftId } });
      if (existing) {
        return prisma.userDraft.update({
          where: { id: data.draftId },
          data: {
            officialEmail: data.officialEmail || existing.officialEmail,
            currentStep: data.currentStep,
            stepData: data.stepData,
            expiresAt,
          },
        });
      }
    }

    return prisma.userDraft.create({
      data: {
        officialEmail: data.officialEmail || null,
        currentStep: data.currentStep,
        stepData: data.stepData,
        createdBy: createdBy || null,
        expiresAt,
      },
    });
  }

  /**
   * Retrieve draft by draftId
   */
  async getDraft(draftId: string) {
    const draft = await prisma.userDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft) {
      throw new AppError(404, "User creation draft not found");
    }

    if (draft.expiresAt < new Date()) {
      await prisma.userDraft.delete({ where: { id: draftId } });
      throw new AppError(410, "Draft has expired. Please start user creation again.");
    }

    return draft;
  }

  /**
   * List the caller's own active (non-expired) drafts, newest first.
   */
  async listMine(createdBy: string) {
    await prisma.userDraft.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return prisma.userDraft.findMany({
      where: { createdBy },
      orderBy: { updatedAt: "desc" },
    });
  }

  /**
   * Delete draft on completion or cancellation
   */
  async deleteDraft(draftId: string) {
    try {
      await prisma.userDraft.delete({ where: { id: draftId } });
    } catch {
      // Ignore if draft already deleted
    }
  }

  /**
   * Clean up expired drafts
   */
  async cleanupExpiredDrafts() {
    return prisma.userDraft.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}

export const userDraftService = new UserDraftService();
