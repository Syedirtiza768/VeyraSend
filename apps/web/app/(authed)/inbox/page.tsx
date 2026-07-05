import { redirect } from 'next/navigation';

/** Phase 14 — legacy inbox route redirects to unified conversations. */
export default function InboxRedirectPage() {
  redirect('/conversations');
}
