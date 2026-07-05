import { getCurrentUser } from '../../../lib/server-api';
import { CompaniesManager } from '../../../components/companies-manager';

export default async function CompaniesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!user.permissions.includes('companies:read')) {
    return (
      <div>
        <h1>Companies</h1>
        <div className="card" style={{ marginTop: 24 }}>
          <p className="body-sm" style={{ margin: 0 }}>Your role does not include <code>companies:read</code>.</p>
        </div>
      </div>
    );
  }
  return (
    <div>
      <h1>Companies</h1>
      <p className="meta" style={{ margin: '8px 0 24px' }}>Organizations linked to your contacts and deals.</p>
      <CompaniesManager
        canWrite={user.permissions.includes('companies:write')}
        canDelete={user.permissions.includes('companies:delete')}
      />
    </div>
  );
}
