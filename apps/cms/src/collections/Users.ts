import type { CollectionAfterLogoutHook, CollectionConfig } from 'payload'

import { adminOrSelf, isAdmin, isAdminField, isStaff, selfOrAdmin } from '../lib/access'
import { multiTenantPayloadCmsStrategy } from '../lib/multi-tenant-payload-cms/strategy'

// Sign-out from Payload's own endpoint (/api/users/logout, which the admin
// calls on inactivity) ends the Multi Tenant Payload Cms session too, so the cookie cannot sign
// the person straight back in.
const endMultiTenantPayloadCmsSession: CollectionAfterLogoutHook = async ({ req }) => {
  const [{ multiTenantPayloadCmsTransport }, { endSession }] = await Promise.all([import('../lib/multi-tenant-payload-cms/transport'), import('../lib/multi-tenant-payload-cms/logout')])
  const secure = new URL(req.url ?? 'https://cms.invalid').protocol === 'https:'
  const { setCookie } = await endSession(await multiTenantPayloadCmsTransport(), req.headers, secure)
  req.responseHeaders ??= new Headers()
  req.responseHeaders.append('set-cookie', setCookie)
}

// Staff accounts (multi-tenant-payload-cms-console design §3). People sign in with their
// Multi Tenant Payload Cms account; there are no Payload passwords. A row is created on first
// sign-in and linked by multiTenantPayloadCmsUserId. No role means pending: signed in but not
// let into the admin. An admin can also add a row by email beforehand, with a
// role, as an invitation: it is linked when that email signs in.
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    // enableFields keeps the auth columns (email, sessions, ...) so the
    // schema stays as migration 200 made it; only the password flows go.
    disableLocalStrategy: { enableFields: true },
    strategies: [multiTenantPayloadCmsStrategy],
  },
  admin: { useAsTitle: 'email', defaultColumns: ['email', 'name', 'role', 'multiTenantPayloadCmsUserId'] },
  access: {
    admin: isStaff,
    read: selfOrAdmin,
    create: isAdmin,
    update: adminOrSelf,
    delete: isAdmin,
  },
  hooks: { afterLogout: [endMultiTenantPayloadCmsSession] },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'role',
      type: 'select',
      saveToJWT: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      admin: { description: 'Empty means pending: signed in with Multi Tenant Payload Cms, but not let into the admin yet.' },
      access: { create: isAdminField, update: isAdminField },
    },
    {
      name: 'multiTenantPayloadCmsUserId',
      label: 'Multi Tenant Payload Cms user',
      type: 'text',
      unique: true,
      index: true,
      admin: { readOnly: true, position: 'sidebar', description: 'Set on first Multi Tenant Payload Cms sign-in.' },
      access: { create: () => false, update: () => false },
    },
  ],
}
