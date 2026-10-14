"use client"

import { BellIcon, CheckCheckIcon, Settings2Icon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useFormatter, useNow, useTranslations } from "next-intl"
import { useState } from "react"

import { EmptyState } from "@/components/catalog/empty-state"
import { ValidatedScene } from "@/components/illustrations/validated-scene"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { AppNotification } from "@/lib/api/notifications"
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/lib/api/notification-queries"
import { Routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

import { notificationIcons, useNotificationText } from "./notification-content"

/** Au-delà, le badge affiche « 9+ ». */
const MAX_BADGE = 9

/**
 * Cloche de l'en-tête (DECISIONS.md, D26) : nombre de non lues, et panneau des dernières
 * notifications. Ouvrir une notification la marque comme lue et mène à la page concernée.
 */
export function NotificationBell() {
  const t = useTranslations("notifications")
  const [open, setOpen] = useState(false)
  const notifications = useNotifications()
  const markAll = useMarkAllNotificationsRead()
  const unread = notifications.data?.unread ?? 0
  const items = notifications.data?.items ?? []

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={t("open", { count: unread })}
          />
        }
      >
        <BellIcon />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white tabular-nums"
          >
            {unread > MAX_BADGE ? `${MAX_BADGE}+` : unread}
          </span>
        )}
      </SheetTrigger>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>
            {unread > 0 ? t("unread", { count: unread }) : t("allRead")}
          </SheetDescription>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={unread === 0 || markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              <CheckCheckIcon />
              {t("markAllRead")}
            </Button>
            <Link
              href={Routes.notificationSettings}
              onClick={() => setOpen(false)}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              <Settings2Icon />
              {t("settings")}
            </Link>
          </div>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <EmptyState
              illustration={<ValidatedScene />}
              title={t("empty.title")}
              description={t("empty.description")}
            />
          ) : (
            <ul className="divide-y">
              {items.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onOpen={() => setOpen(false)}
                />
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function NotificationRow({
  notification,
  onOpen,
}: {
  notification: AppNotification
  onOpen: () => void
}) {
  const router = useRouter()
  const format = useFormatter()
  const now = useNow()
  const text = useNotificationText()(notification)
  const markRead = useMarkNotificationRead()
  const Icon = notificationIcons[notification.type]

  const open = () => {
    if (!notification.read) markRead.mutate(notification.id)
    if (notification.link) {
      onOpen()
      router.push(notification.link)
    }
  }

  return (
    <li>
      <button
        type="button"
        onClick={open}
        className={cn(
          "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none",
          !notification.read && "bg-primary/5"
        )}
      >
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            notification.read
              ? "bg-muted text-muted-foreground"
              : "bg-primary/10 text-primary"
          )}
          aria-hidden
        >
          <Icon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start gap-2">
            <span
              className={cn(
                "flex-1 text-sm",
                notification.read ? "font-medium" : "font-semibold"
              )}
            >
              {text.title}
            </span>
            {!notification.read && (
              <span
                className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                aria-hidden
              />
            )}
          </span>
          <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
            {text.detail}
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            {format.relativeTime(new Date(notification.createdAt), now)}
          </span>
        </span>
      </button>
    </li>
  )
}
