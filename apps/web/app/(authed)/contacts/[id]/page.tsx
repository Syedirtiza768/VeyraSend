import { getCurrentUser } from '../../../../lib/server-api';
import { ContactDetailView } from '../../../../components/contact-detail';

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;
  if (!user.permissions.includes('contacts:read')) {
    return <div><h1>Contact</h1><div className="card"><p>Access denied.</p></div></div>;
  }
  return (
    <div>
      <h1>Contact</h1>
      <ContactDetailView
        contactId={id}
        canWrite={user.permissions.includes('contacts:write')}
        canNotes={user.permissions.includes('notes:read')}
        canTasks={user.permissions.includes('tasks:read')}
      />
    </div>
  );
}
