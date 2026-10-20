/**
 * Cartes en colonnes (une sur téléphone, deux sur tablette, trois sur ordinateur) : chacune garde
 * la hauteur de son contenu, sans imposer celle de sa voisine, et le navigateur équilibre la
 * hauteur des colonnes. Les cartes se lisent de haut en bas, colonne après colonne.
 */
export function BoardMasonry({ children }: { children: React.ReactNode }) {
  return (
    <div className="gap-4 md:columns-2 lg:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
      {children}
    </div>
  )
}
