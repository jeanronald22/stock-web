import type { TeamMember } from "@/lib/api/platform"

/** « Awa Bello », ou l'adresse e-mail si le nom n'est pas encore renseigné. */
export function memberName(member: TeamMember): string {
  return (
    [member.firstName, member.lastName].filter(Boolean).join(" ") ||
    member.email ||
    ""
  )
}
