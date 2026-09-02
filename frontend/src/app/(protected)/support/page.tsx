"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import {
  api,
  type SupportTicket,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CreateTicketSheet } from "@/components/support/CreateTicketSheet";
import {
  LifeBuoy,
  Plus,
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Trash2,
  UserCheck,
} from "lucide-react";

const pageVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function SupportPage() {
  const { user } = useAuth();
  const roleName = (typeof user?.role === "string" ? user.role : user?.role?.name || "").toUpperCase();
  const isAdminOrAgent = ["SUPERADMIN", "HR_ADMIN", "ADMIN", "IT_ADMIN", "MANAGER"].includes(roleName);

  const [activeTab, setActiveTab] = useState<"my" | "admin">("my");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await api.listSupportTickets(1, 100, {
        search: search || undefined,
        category: selectedCategory !== "ALL" ? (selectedCategory as TicketCategory) : undefined,
        status: selectedStatus !== "ALL" ? (selectedStatus as TicketStatus) : undefined,
        scope: activeTab,
      });
      setTickets(res.data || []);
    } catch (err: any) {
      toast.error("Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [activeTab, search, selectedCategory, selectedStatus]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await api.deleteSupportTicket(id);
      toast.success("Support ticket deleted");
      loadTickets();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete ticket");
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
            <LifeBuoy className="h-7 w-7 text-brand" />
            Support Desk
          </h1>
          <p className="text-xs md:text-sm text-text-tertiary mt-1">
            Submit support tickets and track resolution progress for IT, HR, and Operations.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-brand hover:bg-brand/90 text-white font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Create Ticket
        </Button>
      </div>

      {/* Tabs & Search Bar */}
      <Card className="p-4 border border-border-base bg-surface rounded-xl shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* RBAC Tab Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-subtle border border-border-base rounded-xl w-full md:w-auto">
          <Button
            variant={activeTab === "my" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("my")}
            className={`text-xs font-bold px-4 h-8 rounded-lg ${
              activeTab === "my" ? "bg-brand! text-white!" : "text-text-secondary"
            }`}
          >
            My Tickets
          </Button>

          {isAdminOrAgent && (
            <Button
              variant={activeTab === "admin" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("admin")}
              className={`text-xs font-bold px-4 h-8 rounded-lg ${
                activeTab === "admin" ? "bg-brand! text-white!" : "text-text-secondary"
              }`}
            >
              All Tickets (Admin)
            </Button>
          )}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search ticket subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border-base bg-surface text-text-primary focus:border-brand focus:outline-none"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-8 px-2 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-brand focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="IT_HARDWARE">IT Hardware</option>
            <option value="IT_SOFTWARE">IT Software</option>
            <option value="HR_QUERY">HR Query</option>
            <option value="PAYROLL">Payroll</option>
            <option value="ACCESS_REQUEST">Access Request</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-8 px-2 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-brand focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </Card>

      {/* Tickets Table */}
      <Card className="border border-border-base bg-surface rounded-xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-text-tertiary animate-pulse font-mono text-xs">
            Loading tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <LifeBuoy className="h-10 w-10 text-text-tertiary mx-auto opacity-50" />
            <h3 className="font-heading font-bold text-base text-text-primary">No tickets found</h3>
            <p className="text-xs text-text-tertiary max-w-sm mx-auto">
              {activeTab === "my"
                ? "You haven't submitted any support tickets yet."
                : "There are no pending tickets in the help desk queue."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle border-b border-border-base font-semibold text-text-tertiary uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-6">Ticket ID</th>
                  <th className="py-3.5 px-6">Subject</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Priority</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Updated</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base/50">
                {tickets.map((t) => {
                  const creatorName = t.creator ? `${t.creator.firstName} ${t.creator.lastName}` : "User";
                  return (
                    <tr key={t.id} className="hover:bg-surface-subtle/30 transition-colors">
                      <td className="py-3.5 px-6 font-mono font-bold text-brand">
                        #{t.ticketNumber}
                      </td>

                      <td className="py-3.5 px-6">
                        <Link
                          href={`/support/${t.id}`}
                          className="font-bold text-text-primary hover:text-brand transition-colors block line-clamp-1"
                        >
                          {t.subject}
                        </Link>
                        <p className="text-[10px] text-text-tertiary">
                          Requested by {creatorName}
                        </p>
                      </td>

                      <td className="py-3.5 px-6">
                        <Badge variant="outline" className="font-mono text-[10px] uppercase">
                          {t.category.replace("_", " ")}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-6">
                        {t.priority === "URGENT" && (
                          <Badge className="bg-error/15 text-error font-bold text-[10px]">Urgent</Badge>
                        )}
                        {t.priority === "HIGH" && (
                          <Badge className="bg-warning/15 text-warning font-bold text-[10px]">High</Badge>
                        )}
                        {t.priority === "MEDIUM" && (
                          <Badge className="bg-info/15 text-info font-bold text-[10px]">Medium</Badge>
                        )}
                        {t.priority === "LOW" && (
                          <Badge variant="outline" className="text-text-tertiary text-[10px]">Low</Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-6">
                        {t.status === "OPEN" && (
                          <Badge className="bg-error/15 text-error font-bold text-[10px]">Open</Badge>
                        )}
                        {t.status === "IN_PROGRESS" && (
                          <Badge className="bg-warning/15 text-warning font-bold text-[10px]">In Progress</Badge>
                        )}
                        {t.status === "RESOLVED" && (
                          <Badge className="bg-success/15 text-success font-bold text-[10px]">Resolved</Badge>
                        )}
                        {t.status === "CLOSED" && (
                          <Badge className="bg-surface-subtle text-text-tertiary text-[10px]">Closed</Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-6 font-mono text-text-tertiary">
                        {new Date(t.updatedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      <td className="py-3.5 px-6 text-right space-x-2">
                        <Link
                          href={`/support/${t.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
                        >
                          View <ArrowRight className="h-3 w-3" />
                        </Link>

                        {isAdminOrAgent && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleDelete(t.id, e)}
                            className="h-7 w-7 text-text-tertiary hover:text-error hover:bg-error/10 ml-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Ticket Drawer */}
      <CreateTicketSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadTickets}
      />
    </motion.div>
  );
}
