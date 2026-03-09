import NotesWorkspace from '../../components/admin/NotesWorkspace'

export default function AdminSeoNotes() {
  return (
    <NotesWorkspace
      tableName="seo_notes"
      pageTitle="SEO Notes"
      createLabel="+ New SEO note"
      emptyLabel="No SEO notes yet."
    />
  )
}
