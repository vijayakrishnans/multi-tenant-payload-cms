import type { AuthStrategy, AuthStrategyFunction, Payload } from 'payload'

import { presentedSetupToken, setupIsOpen } from '../setup-gate'
import { accountFor, type AccountStore } from './accounts'
import type { MultiTenantPayloadCmsTransport } from './client'
import { isCrossSiteNonNavigation, isForeignOrigin, MULTI_TENANT_PAYLOAD_CMS_SESSION_COOKIE, readCookie } from './cookies'
import { resolveSession } from './session'

// The only way into the admin (design §2): a live Multi Tenant Payload Cms session in the
// multi_tenant_payload_cms_session cookie, resolved through api-edge, mapped to a `users` row.
// The token itself is never put on the user: Payload hands req.user to the
// browser.

export type StrategyDeps = {
  transport: () => Promise<MultiTenantPayloadCmsTransport>
  store: (payload: Payload) => AccountStore
  setupToken: () => string | undefined
}

export function multiTenantPayloadCmsAuthenticate(deps: StrategyDeps): AuthStrategyFunction {
  return async ({ headers, payload }) => {
    if (isCrossSiteNonNavigation(headers) || isForeignOrigin(headers)) return { user: null }
    const token = readCookie(headers, MULTI_TENANT_PAYLOAD_CMS_SESSION_COOKIE)
    if (!token) return { user: null }
    const session = await resolveSession(await deps.transport(), token)
    if (!session) return { user: null }
    const setupOpen = setupIsOpen(deps.setupToken(), presentedSetupToken(headers))
    const account = await accountFor(deps.store(payload), session.user, setupOpen)
    return { user: { ...account, collection: 'users', _strategy: 'multi-tenant-payload-cms' } as never }
  }
}

// The runtime pieces load on first use, so importing the users collection
// (tests do) does not load the Workers adapter.
export const multiTenantPayloadCmsStrategy: AuthStrategy = {
  name: 'multi-tenant-payload-cms',
  authenticate: multiTenantPayloadCmsAuthenticate({
    transport: async () => (await import('./transport')).multiTenantPayloadCmsTransport(),
    store: (payload) => {
      let store: AccountStore | undefined
      const lazy = async () => (store ??= (await import('./payload-store')).payloadAccountStore(payload))
      return {
        findByMultiTenantPayloadCmsId: async (id) => (await lazy()).findByMultiTenantPayloadCmsId(id),
        findUnlinkedByEmail: async (email) => (await lazy()).findUnlinkedByEmail(email),
        adminExists: async () => (await lazy()).adminExists(),
        create: async (data) => (await lazy()).create(data),
        update: async (id, data) => (await lazy()).update(id, data),
      }
    },
    setupToken: () => process.env.CMS_SETUP_TOKEN,
  }),
}
