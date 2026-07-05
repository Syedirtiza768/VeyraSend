import { getCurrentUser } from '../../../lib/server-api';
import { PhoneNumbersManager } from '../../../components/phone-numbers-manager';

export default async function PhoneNumbersPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!user.permissions.includes('phone-numbers:read')) {
    return (
      <div>
        <h1>Phone numbers</h1>
        <div className="card" style={{ marginTop: 24 }}>
          <p className="body-sm" style={{ margin: 0 }}>Your role does not include <code>phone-numbers:read</code>.</p>
        </div>
      </div>
    );
  }
  return (
    <div>
      <h1>Phone numbers</h1>
      <p className="meta" style={{ margin: '8px 0 24px' }}>
        Provision Twilio, buy SMS/voice numbers, and manage forwarding.
      </p>
      <PhoneNumbersManager
        canProvision={user.permissions.includes('twilio:provision')}
        canWrite={user.permissions.includes('phone-numbers:write')}
        canDelete={user.permissions.includes('phone-numbers:delete')}
      />
    </div>
  );
}
