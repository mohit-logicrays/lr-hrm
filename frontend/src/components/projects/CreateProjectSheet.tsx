"use client";

import { useEffect, useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api, type Department, type Team, type User, type Project } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Plus,
  Trash2,
  Users,
  Flag,
  DollarSign,
} from "lucide-react";

const steps = [
  { id: 1, name: "Basic Info" },
  { id: 2, name: "Team & Access" },
  { id: 3, name: "Milestones" },
  { id: 4, name: "Review" },
];

export function CreateProjectSheet({
  project,
  departments,
  teams,
  users,
  onClose,
  onSaved,
}: {
  project: Project | null;
  departments: Department[];
  teams: Team[];
  users: User[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: project?.name ?? "",
    code: project?.code ?? "",
    description: project?.description ?? "",
    status: project?.status ?? "PLANNING",
    priority: project?.priority ?? "MEDIUM",
    startDate: project?.startDate ? project.startDate.split("T")[0] : "",
    endDate: project?.endDate ? project.endDate.split("T")[0] : "",
    departmentId: project?.departmentId ?? "",
    primaryTeamId: project?.primaryTeamId ?? "",
    projectManagerId: project?.projectManagerId ?? "",
    budget: project?.budget ?? 0,
    clientName: project?.clientName ?? "",
    isBillable: project?.isBillable ?? true,
    category: project?.category ?? "Internal",
    visibility: project?.visibility ?? "Workspace",
  });

  // Step 2: Initial Members
  const [members, setMembers] = useState<
    Array<{ userId: string; roleInProject: "MEMBER" | "LEAD" | "PROJECT_MANAGER" | "VIEWER" }>
  >(() => {
    if (project?.members?.length) {
      return project.members.map((m) => ({
        userId: m.user.id,
        roleInProject: (m.roleInProject as any) || "MEMBER",
      }));
    }
    return [];
  });

  // Step 3: Initial Milestones
  const [milestones, setMilestones] = useState<
    Array<{ title: string; description: string; dueDate: string }>
  >([
    { title: "Project Kickoff", description: "Initial setup and requirements sign-off", dueDate: "" },
  ]);

  function handleAddMember(userId: string, roleInProject: "MEMBER" | "LEAD" | "PROJECT_MANAGER" | "VIEWER" = "MEMBER") {
    if (!userId || members.some((m) => m.userId === userId)) return;
    setMembers([...members, { userId, roleInProject }]);
  }

  function handleRemoveMember(userId: string) {
    setMembers(members.filter((m) => m.userId !== userId));
  }

  function handleAddMilestone() {
    setMilestones([...milestones, { title: "", description: "", dueDate: "" }]);
  }

  function handleRemoveMilestone(index: number) {
    setMilestones(milestones.filter((_, i) => i !== index));
  }

  async function handleSubmit(e?: FormEvent) {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      if (project) {
        await api.updateProject(project.id, {
          name: form.name,
          code: form.code || null,
          description: form.description || null,
          status: form.status,
          priority: form.priority,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          departmentId: form.departmentId || null,
          primaryTeamId: form.primaryTeamId || null,
          projectManagerId: form.projectManagerId || null,
          budget: Number(form.budget) || null,
          clientName: form.clientName || null,
          isBillable: form.isBillable,
          category: form.category || null,
          visibility: form.visibility,
        });
        toast.success("Project updated successfully");
      } else {
        await api.createProject({
          name: form.name,
          code: form.code || null,
          description: form.description || null,
          status: form.status as any,
          priority: form.priority as any,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          departmentId: form.departmentId || null,
          primaryTeamId: form.primaryTeamId || null,
          projectManagerId: form.projectManagerId || null,
          budget: Number(form.budget) || null,
          clientName: form.clientName || null,
          isBillable: form.isBillable,
          category: form.category || null,
          visibility: form.visibility,
          initialMembers: members,
          initialMilestones: milestones.filter((m) => m.title.trim()),
        });
        toast.success("Project created successfully");
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-surface overflow-hidden">
        {/* Header */}
        <SheetHeader className="p-4 border-b border-border-base bg-surface-subtle/40 shrink-0">
          <div className="pr-6 flex items-center justify-between">
            <div>
              <SheetTitle className="font-heading text-base font-bold text-text-primary flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-brand" />
                {project ? "Edit Project" : "Create New Project"}
              </SheetTitle>
              <SheetDescription className="text-xs text-text-tertiary mt-0.5">
                Set up project metadata, assigned team members, and milestones.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Stepper Progress Bar */}
        <div className="px-6 py-3 border-b border-border-base bg-surface-subtle/20 shrink-0">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-border-base -z-10 -translate-y-1/2" />
            <div
              className="absolute top-1/2 left-0 h-[2px] bg-brand -z-10 -translate-y-1/2 transition-all duration-300"
              style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            />

            {steps.map((s) => {
              const active = s.id === step;
              const completed = s.id < step;
              return (
                <div key={s.id} className="flex flex-col items-center gap-1 bg-surface px-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                      completed
                        ? "bg-brand text-white"
                        : active
                        ? "bg-brand text-white ring-4 ring-brand/20"
                        : "bg-surface-subtle text-text-tertiary border border-border-base"
                    }`}
                  >
                    {completed ? <CheckCircle2 className="h-4 w-4" /> : s.id}
                  </div>
                  <span className={`text-[10px] font-semibold ${active ? "text-brand" : "text-text-tertiary"}`}>
                    {s.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Body Steps */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <Label htmlFor="p-name" className="text-xs font-semibold">
                    Project Name *
                  </Label>
                  <Input
                    id="p-name"
                    required
                    className="text-xs h-9"
                    placeholder="e.g. HRM Enterprise Platform Redesign"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="p-code" className="text-xs font-semibold">
                      Project Key / Code *
                    </Label>
                    <Input
                      id="p-code"
                      required
                      className="text-xs h-9 font-mono uppercase"
                      placeholder="e.g. HRIS"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="p-priority" className="text-xs font-semibold">
                      Priority
                    </Label>
                    <select
                      id="p-priority"
                      className="h-9 w-full rounded-md border border-border-base bg-surface px-2.5 text-xs font-medium text-text-primary focus:border-brand focus:outline-none"
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="p-dept" className="text-xs font-semibold">
                      Department
                    </Label>
                    <select
                      id="p-dept"
                      className="h-9 w-full rounded-md border border-border-base bg-surface px-2.5 text-xs font-medium text-text-primary focus:border-brand focus:outline-none"
                      value={form.departmentId}
                      onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                    >
                      <option value="">Select Department...</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="p-team" className="text-xs font-semibold">
                      Primary Team
                    </Label>
                    <select
                      id="p-team"
                      className="h-9 w-full rounded-md border border-border-base bg-surface px-2.5 text-xs font-medium text-text-primary focus:border-brand focus:outline-none"
                      value={form.primaryTeamId}
                      onChange={(e) => setForm({ ...form, primaryTeamId: e.target.value })}
                    >
                      <option value="">Select Team...</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="p-start" className="text-xs font-semibold">
                      Start Date
                    </Label>
                    <Input
                      id="p-start"
                      type="date"
                      className="text-xs h-9"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="p-end" className="text-xs font-semibold">
                      Target End Date
                    </Label>
                    <Input
                      id="p-end"
                      type="date"
                      className="text-xs h-9"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="p-budget" className="text-xs font-semibold">
                      Budget ($ USD)
                    </Label>
                    <Input
                      id="p-budget"
                      type="number"
                      className="text-xs h-9 font-mono"
                      placeholder="e.g. 50000"
                      value={form.budget || ""}
                      onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="p-client" className="text-xs font-semibold">
                      Client Name (Optional)
                    </Label>
                    <Input
                      id="p-client"
                      className="text-xs h-9"
                      placeholder="e.g. Acme Corp"
                      value={form.clientName}
                      onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="p-desc" className="text-xs font-semibold">
                    Description (Rich Text)
                  </Label>
                  <RichTextEditor
                    value={form.description}
                    onChange={(val) => setForm({ ...form, description: val })}
                    placeholder="Provide detailed project overview and deliverables..."
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <Label htmlFor="p-pm" className="text-xs font-semibold">
                    Project Manager *
                  </Label>
                  <select
                    id="p-pm"
                    className="h-9 w-full rounded-md border border-border-base bg-surface px-2.5 text-xs font-medium text-text-primary focus:border-brand focus:outline-none"
                    value={form.projectManagerId}
                    onChange={(e) => setForm({ ...form, projectManagerId: e.target.value })}
                  >
                    <option value="">Select Project Manager...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 border-t border-border-base space-y-2">
                  <Label className="text-xs font-semibold">Add Project Team Members</Label>
                  <div className="flex gap-2">
                    <select
                      id="add-user-sel"
                      className="h-8 flex-1 rounded-md border border-border-base bg-surface px-2.5 text-xs focus:border-brand focus:outline-none"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddMember(e.target.value);
                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="">Select Employee to add...</option>
                      {Object.entries(
                        users.reduce((groups, u) => {
                          const key = u.department?.name || u.designation || "General Team";
                          if (!groups[key]) groups[key] = [];
                          groups[key].push(u);
                          return groups;
                        }, {} as Record<string, typeof users>)
                      ).map(([groupName, groupUsers]) => (
                        <optgroup key={groupName} label={`── ${groupName} ──`}>
                          {groupUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.firstName} {u.lastName} ({u.designation || u.email})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    {members.length === 0 ? (
                      <p className="text-xs text-text-tertiary">No members added yet.</p>
                    ) : (
                      members.map((m) => {
                        const targetUser = users.find((u) => u.id === m.userId);
                        return (
                          <div
                            key={m.userId}
                            className="flex items-center justify-between p-2 rounded-lg border border-border-base bg-surface-subtle/30 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-brand/10 text-brand font-mono font-bold flex items-center justify-center text-[10px]">
                                {targetUser?.firstName?.[0] || "U"}
                              </div>
                              <span className="font-semibold text-text-primary">
                                {targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : m.userId}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                className="h-6 rounded border border-border-base text-[10px] bg-surface px-1"
                                value={m.roleInProject}
                                onChange={(e) => {
                                  setMembers(
                                    members.map((item) =>
                                      item.userId === m.userId
                                        ? { ...item, roleInProject: e.target.value as any }
                                        : item
                                    )
                                  );
                                }}
                              >
                                <option value="MEMBER">Member</option>
                                <option value="LEAD">Lead</option>
                                <option value="PROJECT_MANAGER">Manager</option>
                                <option value="VIEWER">Viewer</option>
                              </select>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => handleRemoveMember(m.userId)}
                                className="text-error h-6 w-6"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Project Milestones</Label>
                  <Button variant="outline" size="sm" onClick={handleAddMilestone} className="text-xs h-7 gap-1">
                    <Plus className="h-3.5 w-3.5" /> Add Milestone
                  </Button>
                </div>

                <div className="space-y-3">
                  {milestones.map((ms, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-border-base bg-surface-subtle/20 space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold font-mono text-brand">Milestone #{idx + 1}</span>
                        {milestones.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleRemoveMilestone(idx)}
                            className="text-error h-6 w-6"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <Input
                        placeholder="Milestone title e.g. Kickoff Signoff"
                        className="text-xs h-8"
                        value={ms.title}
                        onChange={(e) => {
                          const updated = [...milestones];
                          updated[idx].title = e.target.value;
                          setMilestones(updated);
                        }}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Description..."
                          className="text-xs h-8"
                          value={ms.description}
                          onChange={(e) => {
                            const updated = [...milestones];
                            updated[idx].description = e.target.value;
                            setMilestones(updated);
                          }}
                        />
                        <Input
                          type="date"
                          className="text-xs h-8"
                          value={ms.dueDate}
                          onChange={(e) => {
                            const updated = [...milestones];
                            updated[idx].dueDate = e.target.value;
                            setMilestones(updated);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4 text-xs"
              >
                <div className="p-4 rounded-xl border border-brand/20 bg-brand/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm font-heading text-text-primary">{form.name}</h3>
                    <Badge variant="outline" className="font-mono">
                      {form.code || "PROJ"}
                    </Badge>
                  </div>
                  <p className="text-text-tertiary leading-relaxed">{form.description || "No description provided."}</p>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-base/40 text-[11px]">
                    <div>
                      <span className="text-text-tertiary">Priority: </span>
                      <span className="font-semibold text-text-primary">{form.priority}</span>
                    </div>
                    <div>
                      <span className="text-text-tertiary">Budget: </span>
                      <span className="font-semibold text-text-primary">${form.budget || 0}</span>
                    </div>
                    <div>
                      <span className="text-text-tertiary">Team Members: </span>
                      <span className="font-semibold text-text-primary">{members.length} Users</span>
                    </div>
                    <div>
                      <span className="text-text-tertiary">Milestones: </span>
                      <span className="font-semibold text-text-primary">{milestones.length} Defined</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-border-base bg-surface flex items-center justify-between shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            disabled={saving}
            className="text-xs h-8 gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          {step < 4 ? (
            <Button
              size="sm"
              onClick={() => {
                if (step === 1 && !form.name) {
                  toast.error("Project Name is required");
                  return;
                }
                setStep(step + 1);
              }}
              className="text-xs h-8 gap-1 bg-brand hover:bg-brand-hover text-white"
            >
              Continue <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={saving}
              onClick={() => handleSubmit()}
              className="text-xs h-8 gap-1 bg-brand hover:bg-brand-hover text-white font-bold px-4"
            >
              {saving ? "Saving..." : project ? "Save Changes" : "Create Project"}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
