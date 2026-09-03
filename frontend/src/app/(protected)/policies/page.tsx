"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api, apiFileUrl, type CompanyPolicy, type PolicyCategory } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreatePolicySheet } from "@/components/policies/CreatePolicySheet";
import { RichTextViewer } from "@/components/ui/rich-text-editor";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  ScrollText,
  Plus,
  Search,
  CheckCircle2,
  FileText,
  ShieldCheck,
  ExternalLink,
  Trash2,
  Eye,
  Pencil,
} from "lucide-react";

const pageVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function PoliciesPage() {
  const { user } = useAuth();
  const roleName = (typeof user?.role === "string" ? user.role : user?.role?.name || "").toUpperCase();
  const isSuperAdmin = ["SUPERADMIN", "ADMIN"].includes(roleName) || user?.isSpecialRole;
  const isSuperAdminOrHR = ["SUPERADMIN", "HR_ADMIN", "ADMIN", "HR"].includes(roleName) || user?.isSpecialRole;

  const [policies, setPolicies] = useState<CompanyPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<CompanyPolicy | null>(null);
  const [inspectPolicy, setInspectPolicy] = useState<CompanyPolicy | null>(null);
  const [acknowledging, setAcknowledging] = useState(false);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const res = await api.listPolicies(1, 100, {
        search: search || undefined,
        category: selectedCategory !== "ALL" ? (selectedCategory as PolicyCategory) : undefined,
      });
      setPolicies(res.data || []);
    } catch (err: any) {
      toast.error("Failed to load company policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, [search, selectedCategory]);

  const handleAcknowledge = async (policyId: string) => {
    try {
      setAcknowledging(true);
      await api.acknowledgePolicy(policyId);
      toast.success("Policy acknowledged!");
      loadPolicies();
      if (inspectPolicy && inspectPolicy.id === policyId) {
        setInspectPolicy({ ...inspectPolicy, isAcknowledged: true });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to acknowledge policy");
    } finally {
      setAcknowledging(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this policy?")) return;
    try {
      await api.deletePolicy(id);
      toast.success("Policy deleted");
      loadPolicies();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete policy");
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-text-primary flex items-center gap-3 tracking-tight">
            <ScrollText className="h-7 w-7 text-brand" />
            Company Policies
          </h1>
          <p className="text-xs md:text-sm text-text-tertiary mt-1">
            Access official workplace guidelines, compliance documents, and employee code of conduct.
          </p>
        </div>

        {isSuperAdminOrHR && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-brand hover:bg-brand/90 text-white font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add Policy
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card className="p-4 border border-border-base bg-surface rounded-xl shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search policies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border-base bg-surface text-text-primary focus:border-brand focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {["ALL", "HR", "IT", "FINANCE", "SECURITY", "GENERAL"].map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs h-8 px-3 rounded-lg ${
                selectedCategory === cat
                  ? "bg-brand! text-white! font-bold"
                  : "text-text-secondary hover:bg-surface-subtle"
              }`}
            >
              {cat === "ALL" ? "All Policies" : cat}
            </Button>
          ))}
        </div>
      </Card>

      {/* Policies Table */}
      <Card className="border border-border-base bg-surface rounded-xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-text-tertiary animate-pulse font-mono text-xs">
            Loading policies...
          </div>
        ) : policies.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ScrollText className="h-10 w-10 text-text-tertiary mx-auto opacity-50" />
            <h3 className="font-heading font-bold text-base text-text-primary">No policies found</h3>
            <p className="text-xs text-text-tertiary max-w-sm mx-auto">
              There are no policies matching your search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle border-b border-border-base font-semibold text-text-tertiary uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-6">Policy Name</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Version</th>
                  <th className="py-3.5 px-6">Last Updated</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base/50">
                {policies.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-subtle/30 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="font-bold text-text-primary flex items-center gap-2">
                        <FileText className="h-4 w-4 text-brand shrink-0" />
                        <span>{p.title}</span>
                        {p.isMandatory && (
                          <Badge className="bg-brand/10 text-brand border-brand/20 text-[9px] font-bold">
                            Mandatory
                          </Badge>
                        )}
                      </div>
                      {p.code && <p className="text-[10px] font-mono text-text-tertiary pl-6">{p.code}</p>}
                    </td>

                    <td className="py-3.5 px-6">
                      <Badge variant="outline" className="font-mono text-[10px] uppercase">
                        {p.category}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-6 font-mono text-text-primary font-semibold">
                      {p.version}
                    </td>

                    <td className="py-3.5 px-6 font-mono text-text-tertiary">
                      {new Date(p.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </td>

                    <td className="py-3.5 px-6 text-right space-x-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInspectPolicy(p)}
                        className="text-xs h-7 px-2.5 rounded-lg border-border-base hover:bg-surface-subtle"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> View
                      </Button>

                      {isSuperAdminOrHR && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edit Policy"
                          onClick={() => setEditingPolicy(p)}
                          className="h-7 w-7 text-text-tertiary hover:text-brand hover:bg-brand/10"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {isSuperAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete Policy"
                          onClick={() => handleDelete(p.id)}
                          className="h-7 w-7 text-text-tertiary hover:text-error hover:bg-error/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Inspect Policy Drawer */}
      <Sheet open={Boolean(inspectPolicy)} onOpenChange={(open) => !open && setInspectPolicy(null)}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto bg-surface p-6">
          {inspectPolicy && (
            <div className="space-y-6">
              <SheetHeader className="pb-4 border-b border-border-base">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px] uppercase">
                    {inspectPolicy.category}
                  </Badge>
                  <span className="font-mono text-xs text-text-tertiary">{inspectPolicy.version}</span>
                </div>
                <SheetTitle className="font-heading text-2xl font-bold text-text-primary mt-2">
                  {inspectPolicy.title}
                </SheetTitle>
                <SheetDescription className="text-xs text-text-tertiary">
                  Effective Date: {new Date(inspectPolicy.effectiveDate).toLocaleDateString()}
                </SheetDescription>
              </SheetHeader>

              {/* Policy Body */}
              <div className="p-4 rounded-xl border border-border-base bg-surface-subtle/20 space-y-3">
                <RichTextViewer content={inspectPolicy.content} />
              </div>

              {/* File Download link if any */}
              {inspectPolicy.fileUrl && (
                <div className="p-4 rounded-xl border border-border-base bg-surface flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-brand" />
                    <div>
                      <p className="font-bold text-xs text-text-primary">Policy PDF Document</p>
                      <p className="text-[10px] text-text-tertiary truncate max-w-xs">{inspectPolicy.fileUrl.split("/").pop()}</p>
                    </div>
                  </div>
                  <a
                    href={apiFileUrl(inspectPolicy.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand/90"
                  >
                    View / Download PDF <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}

              {/* Acknowledgment Action */}
              {inspectPolicy.isMandatory && (
                <div className="p-4 rounded-xl border border-brand/30 bg-brand/5 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-text-primary flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-brand" /> Policy Acknowledgment
                    </h4>
                    <p className="text-[11px] text-text-tertiary">
                      {inspectPolicy.isAcknowledged
                        ? "You have acknowledged reading and understanding this policy."
                        : "Mandatory compliance: Confirm you have read and agree to this policy."}
                    </p>
                  </div>

                  {inspectPolicy.isAcknowledged ? (
                    <Badge className="bg-success/20 text-success font-bold text-xs px-3 py-1">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Acknowledged
                    </Badge>
                  ) : (
                    <Button
                      onClick={() => handleAcknowledge(inspectPolicy.id)}
                      disabled={acknowledging}
                      className="bg-brand text-white font-bold text-xs"
                    >
                      {acknowledging ? "Acknowledging..." : "I Acknowledge"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Create / Edit Policy Drawer */}
      <CreatePolicySheet
        isOpen={isCreateOpen || Boolean(editingPolicy)}
        initialData={editingPolicy}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingPolicy(null);
        }}
        onSuccess={loadPolicies}
      />
    </motion.div>
  );
}
