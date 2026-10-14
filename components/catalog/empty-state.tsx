import { cn } from "@/lib/utils"

/** Écran vide : une illustration animée, une phrase, une action. */
export function EmptyState({
  illustration,
  title,
  description,
  action,
  className,
}: {
  illustration: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-md flex-col items-center py-10 text-center sm:py-16",
        className
      )}
    >
      <div className="w-full max-w-72">{illustration}</div>
      <h2 className="mt-6 text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
