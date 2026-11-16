import type { AdminViewServerProps } from 'payload'
import { redirect } from 'next/navigation'

import { safeAdminRedirect } from '../../lib/multi-tenant-payload-cms/cookies'
import { multiTenantPayloadCmsPublicApiUrl } from '../../lib/multi-tenant-payload-cms/transport'
import { Logo } from './Brand'
import { MultiTenantPayloadCmsSignIn } from './MultiTenantPayloadCmsSignIn'

const first = (value: string | string[] | undefined): string | null => (typeof value === 'string' ? value : null)

// The admin's login view, replaced (design §1): Payload's local strategy is
// off, so its own view would render no form.
export async function MultiTenantPayloadCmsLogin({ initPageResult, searchParams }: AdminViewServerProps) {
  const target = safeAdminRedirect(first(searchParams?.redirect))
  if (initPageResult.req.user) redirect(target)
  return (
    <>
      <div style={{ marginBottom: 'calc(var(--base) * 1.5)' }}>
        <Logo />
      </div>
      <MultiTenantPayloadCmsSignIn
        apiUrl={multiTenantPayloadCmsPublicApiUrl()}
        redirect={target}
        error={first(searchParams?.error)}
        signedOut={first(searchParams?.signedOut) === '1'}
        productName="Multi Tenant Payload Cms"
      />
    </>
  )
}
