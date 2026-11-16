import type { MultiTenantPayloadCmsUser } from './client'

// The Payload account of a signed-in Multi Tenant Payload Cms user (design §3). Multi Tenant Payload Cms says who
// someone is; the CMS keeps only what the content plane needs: the link
// (multiTenantPayloadCmsUserId), a display name and a role. No role means pending: signed in,
// but not let into the admin until an admin gives them one.

export type Role = 'admin' | 'editor'
export type Account = { id: string; email: string; name?: string | null; role?: Role | null; multiTenantPayloadCmsUserId?: string | null }

export type AccountStore = {
  findByMultiTenantPayloadCmsId(multiTenantPayloadCmsUserId: string): Promise<Account | null>
  /** A row made before Multi Tenant Payload Cms sign-in (or by an admin, as an invitation) with this email and no link yet. */
  findUnlinkedByEmail(email: string): Promise<Account | null>
  adminExists(): Promise<boolean>
  create(data: Omit<Account, 'id'>): Promise<Account>
  update(id: string, data: Partial<Omit<Account, 'id'>>): Promise<Account>
}

/**
 * Find, link or create the account, in that order. `setupOpen` is true when
 * the request carries the owner's setup token: while no admin exists, it makes
 * the person signing in the first admin. Without it nobody becomes admin by
 * signing in.
 */
export async function accountFor(store: AccountStore, user: MultiTenantPayloadCmsUser, setupOpen: boolean): Promise<Account> {
  let account = await store.findByMultiTenantPayloadCmsId(user.id)
  if (!account) {
    const unlinked = await store.findUnlinkedByEmail(user.email)
    if (unlinked) account = await store.update(unlinked.id, { multiTenantPayloadCmsUserId: user.id })
  }
  if (!account) {
    const role: Role | null = setupOpen && !(await store.adminExists()) ? 'admin' : null
    try {
      account = await store.create({ email: user.email, name: user.displayName ?? null, multiTenantPayloadCmsUserId: user.id, role })
    } catch (error) {
      // Two first requests of one person can race to create the row; the
      // unique link lets one win, and the other reads it back.
      const raced = await store.findByMultiTenantPayloadCmsId(user.id)
      if (!raced) throw error
      account = raced
    }
    return account
  }
  if (!account.role && setupOpen && !(await store.adminExists())) {
    account = await store.update(account.id, { role: 'admin' })
  }
  return account
}
