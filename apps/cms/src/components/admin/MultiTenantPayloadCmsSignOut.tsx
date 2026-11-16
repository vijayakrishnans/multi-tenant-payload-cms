'use client'

import { useEffect, useRef } from 'react'

// The admin's logout view, replaced: the nav's log-out link lands here, and
// this posts to /auth/multi-tenant-payload-cms/logout, which revokes the Multi Tenant Payload Cms session.
export function MultiTenantPayloadCmsSignOut() {
  const form = useRef<HTMLFormElement>(null)
  useEffect(() => {
    form.current?.submit()
  }, [])
  return (
    <form ref={form} method="post" action="/auth/multi-tenant-payload-cms/logout">
      <p>Signing you out…</p>
      <button type="submit" className="btn btn--style-secondary btn--size-medium">
        Sign out
      </button>
    </form>
  )
}
