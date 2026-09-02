"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import {
  api,
  type SupportTicket,
  type TicketStatus,
  type TicketPriority,
} from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { RichTextViewer } from "@/components/ui/rich-text-editor";
import {
  LifeBuoy,
  ArrowLeft,
  Send,
  Lock,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";

const pageVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function TicketDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();
  const roleName = (typeof user?.role === "string" ? user.role : user?.role?.name || "").toUpperCase();
  const isAdminOrAgent = ["SUPERADMIN", "HR_ADMIN", "ADMIN", "IT_ADMIN", "MANAGER"].includes(roleName);

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const res = await api.getSupportTicket(id);
      setTicket(res.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadTicket();
  }, [id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    try {
      setSubmittingComment(true);
      await api.addTicketComment(id, {
        content: commentContent,
        isInternalNote,
      });

      toast.success(isInternalNote ? "Internal note posted" : "Reply added");
      setCommentContent("");
      setIsInternalNote(false);
      loadTicket();
    } catch (err: any) {
      toast.error(err.message || "Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    try {
      setUpdatingStatus(true);
      await api.updateSupportTicket(id, { status: newStatus });
      toast.success(`Ticket status updated to ${newStatus}`);
      loadTicket();
    } catch (err: any) {
      toast.error(err.message || "Failed to update ticket status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-text-tertiary font-mono text-xs animate-pulse">
        Loading ticket thread...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-12 text-center space-y-3">
        <LifeBuoy className="h-10 w-10 text-text-tertiary mx-auto opacity-50" />
        <h3 className="font-heading font-bold text-base text-text-primary">Ticket not found</h3>
        <Button onClick={() => router.push("/support")} variant="outline" size="sm">
          Return to Support Desk
        </Button>
      </div>
    );
  }

  const creatorName = ticket.creator
    ? `${ticket.creator.firstName} ${ticket.creator.lastName}`
    : "Requester";
  const creatorInitials = creatorName
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto"
    >
      {/* Back Button & Top Meta */}
      <div className="flex items-center justify-between">
        <Link
          href="/support"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-text-tertiary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Tickets
        </Link>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-brand">Ticket #{ticket.ticketNumber}</span>
          <Badge variant="outline" className="font-mono text-[10px] uppercase">
            {ticket.category.replace("_", " ")}
          </Badge>
        </div>
      </div>

      {/* Main Ticket Card */}
      <Card className="p-6 border border-border-base bg-surface rounded-xl shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-base pb-4">
          <div>
            <h1 className="font-heading text-2xl font-extrabold text-text-primary">
              {ticket.subject}
            </h1>
            <p className="text-xs text-text-tertiary mt-1 flex items-center gap-2">
              <span>Opened by <strong className="text-text-primary">{creatorName}</strong></span>
              <span>•</span>
              <span className="font-mono">{new Date(ticket.createdAt).toLocaleString()}</span>
            </p>
          </div>

          {/* Status & Action Controls */}
          <div className="flex items-center gap-3">
            {isAdminOrAgent ? (
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                disabled={updatingStatus}
                className="h-9 px-3 rounded-lg border border-border-base bg-surface text-text-primary font-bold text-xs focus:border-brand focus:outline-none cursor-pointer"
              >
                <option value="OPEN">Status: Open</option>
                <option value="IN_PROGRESS">Status: In Progress</option>
                <option value="RESOLVED">Status: Resolved</option>
                <option value="CLOSED">Status: Closed</option>
              </select>
            ) : (
              <Badge className="bg-brand/10 text-brand font-bold text-xs px-3 py-1">
                {ticket.status}
              </Badge>
            )}
          </div>
        </div>

        {/* Ticket Original Description */}
        <div className="p-4 rounded-xl border border-border-base bg-surface-subtle/30 text-xs text-text-primary leading-relaxed space-y-2">
          <label className="font-bold text-[11px] uppercase tracking-wider text-text-tertiary">Original Problem Description</label>
          <RichTextViewer content={ticket.description} />
        </div>
      </Card>

      {/* Discussion & Response Thread */}
      <div className="space-y-4 pt-2">
        <h2 className="font-heading text-lg font-bold text-text-primary flex items-center gap-2">
          Activity & Responses ({ticket.comments?.length || 0})
        </h2>

        {ticket.comments && ticket.comments.length > 0 && (
          <div className="space-y-4">
            {ticket.comments.map((comment) => {
              const authorName = `${comment.author.firstName} ${comment.author.lastName}`;
              const authorInitials = authorName
                .split(" ")
                .map((n) => n[0])
                .join("");

              return (
                <Card
                  key={comment.id}
                  className={`p-4 border rounded-xl shadow-2xs space-y-2 ${
                    comment.isInternalNote
                      ? "border-warning/40 bg-warning/5"
                      : "border-border-base bg-surface"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 border border-border-base">
                        <AvatarFallback className="bg-brand/10 text-brand font-bold text-[10px]">
                          {authorInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-xs text-text-primary flex items-center gap-1.5">
                          {authorName}
                          {comment.isInternalNote && (
                            <Badge className="bg-warning/20 text-warning text-[9px] font-bold">
                              <Lock className="h-3 w-3 mr-0.5" /> Internal Admin Note
                            </Badge>
                          )}
                        </p>
                        <p className="text-[10px] font-mono text-text-tertiary">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-text-primary pl-9">
                    <RichTextViewer content={comment.content} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Post Reply / Internal Note Form */}
        <Card className="p-5 border border-border-base bg-surface rounded-xl shadow-2xs space-y-4">
          <h3 className="font-heading text-sm font-bold text-text-primary">
            Post Response
          </h3>

          <form onSubmit={handlePostComment} className="space-y-4">
            <RichTextEditor
              value={commentContent}
              onChange={setCommentContent}
              placeholder="Type your response or update..."
            />

            <div className="flex items-center justify-between pt-2">
              {isAdminOrAgent ? (
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-text-tertiary">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border-base text-brand focus:ring-brand accent-brand"
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.target.checked)}
                  />
                  <span>Post as Internal Note (Admin/Agent Only)</span>
                </label>
              ) : <div />}

              <Button
                type="submit"
                disabled={submittingComment || !commentContent.trim()}
                className="bg-brand hover:bg-brand/90 text-white font-bold text-xs"
              >
                {submittingComment ? "Posting..." : "Send Response"} <Send className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </motion.div>
  );
}
