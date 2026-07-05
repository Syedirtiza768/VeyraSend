import { getCurrentUser, serverApi } from '../../../lib/server-api';
import { ContactsManager } from '../../../components/contacts-manager';

interface ContactRow {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  customFields: Record<string, unknown>;
  createdAt: string;
}

export default async function ContactsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  if (!user.permissions.includes('contacts:read')) {
    return (
      <div>
        <h1>Contacts</h1>
        <div className="card" style={{ marginTop: 24 }}>
          <p className="body-sm" style={{ color: 'var(--enxi-color-text-meta)', margin: 0 }}>
            Your role does not include <code>contacts:read</code>.
          </p>
        </div>
      </div>
    );
  }

  const res = await serverApi<ContactRow[]>('/api/contacts');
  return (
    <div>
      <h1>Contacts</h1>
      <p className="meta" style={{ margin: '8px 0 24px' }}>
        Import via CSV or add individually. Suppressions (bounces/unsubscribes) update contact status automatically.
      </p>
      <ContactsManager
        initialContacts={res.data ?? []}
        canWrite={user.permissions.includes('contacts:write')}
        canDelete={user.permissions.includes('contacts:delete')}
      />
    </div>
  );
}
