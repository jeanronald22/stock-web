import { redirect } from "next/navigation"

import { Routes } from "@/lib/routes"

/**
 * Pas de page publique à la racine : l'application s'ouvre sur le tableau de bord, dont l'accès
 * renvoie vers la connexion quand personne n'est connecté (SessionGate). La session vit dans le
 * navigateur : le serveur ne peut pas trancher lui-même.
 */
export default function Home() {
  redirect(Routes.dashboard)
}
