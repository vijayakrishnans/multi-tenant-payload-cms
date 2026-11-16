import { getCloudflareContext } from '@opennextjs/cloudflare'

import { isWorkersRuntime } from '../runtime'
import type { MultiTenantPayloadCmsTransport } from './client'

// How the CMS server reaches api-edge. On Workers, the MULTI_TENANT_PAYLOAD_CMS_API service
// binding: the call stays inside Cloudflare and api-edge authenticates it by
// its bearer token like any other client. Off Workers (local `next dev`, a
// local `wrangler dev` without the binding), MULTI_TENANT_PAYLOAD_CMS_API_URL.
export async function multiTenantPayloadCmsTransport(): Promise<MultiTenantPayloadCmsTransport> {
  if (isWorkersRuntime()) {
    const { env } = await getCloudflareContext({ async: true })
    const binding = (env as { MULTI_TENANT_PAYLOAD_CMS_API?: { fetch(url: string, init?: RequestInit): Promise<Response> } }).MULTI_TENANT_PAYLOAD_CMS_API
    if (binding) return (path, init) => binding.fetch(`https://multi-tenant-payload-cms-api${path}`, init)
  }
  const base = process.env.MULTI_TENANT_PAYLOAD_CMS_API_URL
  if (!base) {
    return async () => {
      throw new Error('The CMS has no way to reach Multi Tenant Payload Cms: the MULTI_TENANT_PAYLOAD_CMS_API binding (or MULTI_TENANT_PAYLOAD_CMS_API_URL) is missing.')
    }
  }
  return (path, init) => fetch(`${base.replace(/\/+$/, '')}${path}`, init)
}

/** The api-edge URL the browser calls for sign-in (a Worker var; not a secret). */
export function multiTenantPayloadCmsPublicApiUrl(): string {
  return (process.env.MULTI_TENANT_PAYLOAD_CMS_API_PUBLIC_URL ?? process.env.MULTI_TENANT_PAYLOAD_CMS_API_URL ?? '').replace(/\/+$/, '')
}
