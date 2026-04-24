"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { formatDistanceToNow } from "@/lib/utils";
import {
  Bell,
  CheckCheck,
  Trash2,
  Briefcase,
  CreditCard,
  Calendar,
  FileText,
  Shield,
  Scale,
  Info,
  Circle,
} from "lucide-react";
import type { Notification, NotificationType } from "@/types/notification";

const typeConfig: Record<
  NotificationType,
  { icon: typeof Bell; color: string; bg: string }
> = {
  case_filed: { icon: Briefcase, color: "text-primary", bg: "bg-primary/10" },
  case_assigned: { icon: Briefcase, color: "text-info", bg: "bg-blue-50" },
  case_accepted: { icon: Briefcase, color: "text-success", bg: "bg-green-50" },
  case_declined: { icon: Briefcase, color: "text-danger", bg: "bg-red-50" },
  case_status_changed: { icon: Briefcase, color: "text-primary", bg: "bg-primary/10" },
  payment_pending: { icon: CreditCard, color: "text-warning", bg: "bg-amber-50" },
  payment_completed: { icon: CreditCard, color: "text-success", bg: "bg-green-50" },
  hearing_scheduled: { icon: Calendar, color: "text-info", bg: "bg-blue-50" },
  hearing_reminder: { icon: Calendar, color: "text-warning", bg: "bg-amber-50" },
  document_uploaded: { icon: FileText, color: "text-primary", bg: "bg-primary/10" },
  scrutiny_approved: { icon: Shield, color: "text-success", bg: "bg-green-50" },
  scrutiny_returned: { icon: Shield, color: "text-warning", bg: "bg-amber-50" },
  judgment_delivered: { icon: Scale, color: "text-primary", bg: "bg-primary/10" },
  summon_issued: { icon: Scale, color: "text-danger", bg: "bg-red-50" },
  document_requested: { icon: FileText, color: "text-warning", bg: "bg-amber-50" },
  general: { icon: Info, color: "text-muted", bg: "bg-cream-dark" },
};

interface NotificationListProps {
  notifications: Notification[];
  isLoading: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
  onClearAll?: () => void;
  /** Whether to show actions (mark read, delete). Default: true */
  showActions?: boolean;
  /** Max height with scroll. Pass a Tailwind class like "max-h-96" */
  maxHeight?: string;
  filter?: "all" | "unread" | "read";
}

export default function NotificationList({
  notifications,
  isLoading,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onClearAll,
  showActions = true,
  maxHeight,
  filter = "all",
}: NotificationListProps) {
  const filtered =
    filter === "unread"
      ? notifications.filter((n) => !n.is_read)
      : filter === "read"
      ? notifications.filter((n) => n.is_read)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <EmptyState
        title={filter === "unread" ? "All caught up!" : "No notifications"}
        description={
          filter === "unread"
            ? "You have no unread notifications."
            : "Your notifications will appear here."
        }
        icon={<Bell className="h-10 w-10" />}
      />
    );
  }

  return (
    <div className="space-y-2">
      {/* Bulk actions */}
      {showActions && (
        <div className="flex items-center justify-between pb-2">
          <p className="text-sm text-muted">
            {unreadCount > 0 ? `${unreadCount} unread` : "All read"}
          </p>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button size="sm" variant="ghost" onClick={onMarkAllRead}>
                <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
            {onClearAll && notifications.length > 0 && (
              <Button size="sm" variant="ghost" onClick={onClearAll} className="text-danger hover:text-danger">
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Clear all
              </Button>
            )}
          </div>
        </div>
      )}

      {/* List */}
      <div className={maxHeight ? `${maxHeight} overflow-y-auto` : undefined}>
        <div className="space-y-1">
          {filtered.map((notification) => {
            const config = typeConfig[notification.type] || typeConfig.general;
            const Icon = config.icon;

            const href =
              notification.reference_type === "case" && notification.reference_id
                ? `/cases/${notification.reference_id}`
                : null;

            const content = (
              <div
                className={[
                  "group flex items-start gap-3 rounded-lg p-3 transition-colors",
                  !notification.is_read
                    ? "bg-primary/5 hover:bg-primary/10"
                    : "hover:bg-cream-light",
                ].join(" ")}
              >
                {/* Icon */}
                <div
                  className={[
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    config.bg,
                  ].join(" ")}
                >
                  <Icon className={["h-4 w-4", config.color].join(" ")} />
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={[
                        "text-sm leading-snug",
                        !notification.is_read ? "font-semibold text-foreground" : "font-medium text-foreground",
                      ].join(" ")}
                    >
                      {notification.title}
                    </p>
                    {!notification.is_read && (
                      <Circle className="mt-1 h-2 w-2 shrink-0 fill-primary text-primary" />
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-muted/70">
                    {formatDistanceToNow(notification.created_at)}
                  </p>
                </div>

                {/* Actions */}
                {showActions && (
                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {!notification.is_read && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onMarkRead(notification.id);
                        }}
                        title="Mark as read"
                        className="rounded p-1 hover:bg-cream-dark"
                      >
                        <CheckCheck className="h-3.5 w-3.5 text-success" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete(notification.id);
                      }}
                      title="Delete"
                      className="rounded p-1 hover:bg-cream-dark"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-danger" />
                    </button>
                  </div>
                )}
              </div>
            );

            return (
              <div key={notification.id}>
                {href ? (
                  <Link href={href} onClick={() => !notification.is_read && onMarkRead(notification.id)}>
                    {content}
                  </Link>
                ) : (
                  <div
                    onClick={() => !notification.is_read && onMarkRead(notification.id)}
                    className={!notification.is_read ? "cursor-pointer" : ""}
                  >
                    {content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
