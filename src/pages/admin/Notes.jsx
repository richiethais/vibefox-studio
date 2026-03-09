import NotesWorkspace from '../../components/admin/NotesWorkspace'

export default function AdminNotes() {
  return (
    <NotesWorkspace
      tableName="notes"
      pageTitle="Client Notes"
      createLabel="+ New note"
      emptyLabel="No client notes yet."
      withRelationships
    />
  )
}
