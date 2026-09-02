"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api, type Announcement, type AnnouncementCategory, type AnnouncementStatus } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RichTextViewer } from "@/components/ui/rich-text-editor";
import { CreateAnnouncementSheet } from "@/components/announcements/CreateAnnouncementSheet";
import {
  Megaphone,
  Plus,
  Search,
  Pin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
} from "lucide-react";

const pageVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const roleName = (typeof user?.role === "string" ? user.role : user?.role?.name || "").toUpperCase();
  const isSuperAdminOrHR = ["SUPERADMIN", "HR_ADMIN", "ADMIN"].includes(roleName);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.listAnnouncements(1, 100, {
        search: search || undefined,
        category: selectedCategory !== "ALL" ? (selectedCategory as AnnouncementCategory) : undefined,
        status: selectedStatus !== "ALL" ? (selectedStatus as AnnouncementStatus) : undefined,
      });
      setAnnouncements(res.data || []);
    } catch (err: any) {
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [search, selectedCategory, selectedStatus]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await api.deleteAnnouncement(id);
      toast.success("Announcement deleted");
      loadAnnouncements();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete announcement");
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
            <Megaphone className="h-7 w-7 text-brand" />
            Company Announcements
          </h1>
          <p className="text-xs md:text-sm text-text-tertiary mt-1">
            Stay updated with the latest news, policy notices, and important events.
          </p>
        </div>

        {isSuperAdminOrHR && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-brand hover:bg-brand/90 text-white font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> New Announcement
          </Button>
        )}
      </div>

      {/* Filters Bar */}
      <Card className="p-4 border border-border-base bg-surface rounded-xl shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border-base bg-surface text-text-primary focus:border-brand focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {["ALL", "GENERAL", "HR", "EVENTS", "IT_INFRA", "URGENT"].map((cat) => (
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
                {cat === "ALL" ? "All Categories" : cat.replace("_", " ")}
              </Button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-8 px-2 rounded-lg border border-border-base bg-surface text-text-primary text-xs focus:border-brand focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </Card>

      {/* Announcements Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 h-48 border border-border-base bg-surface animate-pulse rounded-xl" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <Card className="p-12 text-center border border-border-base bg-surface rounded-xl space-y-3">
          <Megaphone className="h-10 w-10 text-text-tertiary mx-auto opacity-50" />
          <h3 className="font-heading font-bold text-base text-text-primary">No announcements found</h3>
          <p className="text-xs text-text-tertiary max-w-sm mx-auto">
            There are no announcements matching your filters. Check back later for updates.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {announcements.map((item) => {
              const authorName = item.author
                ? `${item.author.firstName} ${item.author.lastName}`
                : "HR Department";
              const authorInitials = authorName
                .split(" ")
                .map((n) => n[0])
                .join("");

              return (
                <motion.div
                  key={item.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ y: -3 }}
                >
                  <Card
                    className={`p-6 border rounded-xl shadow-2xs relative flex flex-col justify-between h-full bg-surface transition-all ${
                      item.isPinned ? "border-l-4 border-l-brand border-border-base" : "border-border-base"
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          {item.status === "ACTIVE" && (
                            <Badge className="bg-success/15 text-success border-success/30 font-bold text-[10px]">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                            </Badge>
                          )}
                          {item.status === "EXPIRED" && (
                            <Badge className="bg-surface-subtle text-text-tertiary border-border-base text-[10px]">
                              Expired
                            </Badge>
                          )}
                          {item.priority === "URGENT" && (
                            <Badge className="bg-error/15 text-error border-error/30 font-bold text-[10px]">
                              <AlertTriangle className="h-3 w-3 mr-1" /> Urgent
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {item.isPinned && <Pin className="h-4 w-4 text-brand fill-brand" />}
                          <span className="text-[11px] font-mono text-text-tertiary flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.publishDate).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="font-heading font-extrabold text-base text-text-primary mb-2 line-clamp-2">
                        {item.title}
                      </h3>

                      {/* Content Preview */}
                      <div className="text-xs text-text-secondary line-clamp-3 mb-4 leading-relaxed">
                        <RichTextViewer content={item.content} />
                      </div>
                    </div>

                    {/* Author & Footer */}
                    <div className="pt-4 border-t border-border-base/60 flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7 border border-border-base">
                          <AvatarFallback className="bg-brand/10 text-brand font-bold text-[10px]">
                            {authorInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-xs text-text-primary leading-tight">{authorName}</p>
                          <p className="text-[10px] text-text-tertiary">
                            {item.author?.department?.name || "Operations"}
                          </p>
                        </div>
                      </div>

                      {isSuperAdminOrHR && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          className="h-7 w-7 text-text-tertiary hover:text-error hover:bg-error/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create Announcement Drawer */}
      <CreateAnnouncementSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadAnnouncements}
      />
    </motion.div>
  );
}
