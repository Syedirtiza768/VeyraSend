import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../lib/server-api';
import { SignOutButton } from '../../components/sign-out-button';
import { NavLink } from '../../components/nav-link';
import { ActAsBanner } from '../../components/act-as-banner';
import { QueryProvider } from '../../components/query-provider';

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const p = user.permissions;
  const can = (perm: string) => p.includes(perm);

  type NavItem = { href: string; label: string; perm: string };
  const groups: { title: string; items: NavItem[] }[] = [
    { title: 'Workspace', items: [
      { href: '/dashboard', label: 'Overview', perm: '' },
      { href: '/users', label: 'Users', perm: 'users:read' },
      { href: '/audit', label: 'Audit log', perm: 'audit:read' },
      { href: '/settings', label: 'Settings', perm: 'settings:read' },
    ]},
    { title: 'Send', items: [
      { href: '/senders', label: 'Senders', perm: 'senders:read' },
      { href: '/domains', label: 'Domains', perm: 'domains:read' },
      { href: '/messages', label: 'Transactional send', perm: 'messages:read' },
      { href: '/phone-numbers', label: 'Phone numbers', perm: 'phone-numbers:read' },
      { href: '/calls', label: 'Calls', perm: 'calls:read' },
      { href: '/events', label: 'Events log', perm: 'events:read' },
      { href: '/templates', label: 'Templates', perm: 'templates:read' },
    ]},
    { title: 'Audience', items: [
      { href: '/contacts', label: 'Contacts', perm: 'contacts:read' },
      { href: '/companies', label: 'Companies', perm: 'companies:read' },
      { href: '/lists', label: 'Lists', perm: 'lists:read' },
      { href: '/segments', label: 'Segments', perm: 'segments:read' },
      { href: '/suppressions', label: 'Suppressions', perm: 'suppressions:read' },
    ]},
    { title: 'Sales', items: [
      { href: '/pipelines', label: 'Pipelines', perm: 'deals:read' },
      { href: '/tasks', label: 'Tasks', perm: 'tasks:read' },
    ]},
    { title: 'Programs', items: [
      { href: '/campaigns', label: 'Campaigns', perm: 'campaigns:read' },
      { href: '/workflows', label: 'Workflows', perm: 'workflows:read' },
      { href: '/forms', label: 'Forms', perm: 'forms:read' },
      { href: '/funnels', label: 'Funnels', perm: 'funnels:read' },
      { href: '/calendar', label: 'Calendar', perm: 'calendar:read' },
      { href: '/appointments', label: 'Appointments', perm: 'appointments:read' },
      { href: '/reputation', label: 'Reputation', perm: 'reputation:read' },
      { href: '/invoices', label: 'Invoices', perm: 'billing:read' },
      { href: '/payment-links', label: 'Payment links', perm: 'billing:read' },
      { href: '/automations', label: 'Automations (legacy)', perm: 'automations:read' },
      { href: '/conversations', label: 'Conversations', perm: 'conversations:read' },
    ]},
    { title: 'Insights', items: [
      { href: '/analytics', label: 'Analytics', perm: 'analytics:read' },
      { href: '/usage', label: 'Usage & billing', perm: 'usage:read' },
    ]},
    { title: 'Agency', items: [
      { href: '/agency/sub-accounts', label: 'Sub-accounts', perm: 'agency:sub-accounts:read' },
      { href: '/agency/branding', label: 'Branding', perm: 'agency:branding:read' },
      { href: '/agency/billing-plans', label: 'Billing plans', perm: 'agency:billing-plans:read' },
      { href: '/agency/feature-flags', label: 'Feature flags', perm: 'agency:feature-flags:read' },
    ]},
  ];

  return (
    <div>
      {user.actAs ? (
        <ActAsBanner actAs={{ homeTenantName: user.actAs.homeTenantName, subAccountName: user.actAs.subAccountName }} />
      ) : null}
      <header className="app-topbar">
        <div className="wordmark">
          Veyra<span className="accent">Send</span>
        </div>
        <div className="topbar-right">
          <span className="caption">{user.user.email}</span>
          <SignOutButton />
        </div>
      </header>

      <div className="app-shell">
        <aside className="app-rail">
          <nav>
            {groups.map((g) => (
              <div key={g.title}>
                <div className="micro">{g.title}</div>
                {g.items.map((it) =>
                  it.perm === '' || can(it.perm) ? (
                    <NavLink key={it.href} href={it.href}>
                      {it.label}
                    </NavLink>
                  ) : (
                    <div key={it.href} className="rail-item dim">
                      {it.label}
                    </div>
                  ),
                )}
              </div>
            ))}
          </nav>
          <div className="rail-meta">
            <div className="caption">Role</div>
            <div className="body-sm">{user.role.name}</div>
          </div>
        </aside>

        <main className="app-content"><QueryProvider>{children}</QueryProvider></main>
      </div>
    </div>
  );
}
