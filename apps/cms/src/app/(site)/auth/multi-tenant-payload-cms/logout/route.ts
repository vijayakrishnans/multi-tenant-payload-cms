import { isSameOrigin } from '@/lib/multi-tenant-payload-cms/cookies'
import { endSession } from '@/lib/multi-tenant-payload-cms/logout'
import { multiTenantPayloadCmsTransport } from '@/lib/multi-tenant-payload-cms/transport'

export const dynamic = 'force-dynamic'

// Sign out (design §1): revoke the Multi Tenant Payload Cms session at api-edge, not just forget
// it, and remove the cookie. Same-origin posts only, so another site cannot
// sign a visitor out.
export async function POST(request: Request): Promise<Response> {
  const self = new URL(request.url)
  if (!isSameOrigin(request.headers, request.url)) {
    return new Response('Sign-out must come from this site.\n', { status: 403, headers: { 'cache-control': 'no-store', 'content-type': 'text/plain' } })
  }
  const { setCookie } = await endSession(await multiTenantPayloadCmsTransport(), request.headers, self.protocol === 'https:')
  return new Response(null, {
    status: 303,
    headers: { 'cache-control': 'no-store', location: '/admin/login?signedOut=1', 'set-cookie': setCookie },
  })
}
