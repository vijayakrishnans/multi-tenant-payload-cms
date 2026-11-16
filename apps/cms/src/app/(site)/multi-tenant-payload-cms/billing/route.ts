import { formDeps } from '@/lib/multi-tenant-payload-cms/form-deps'
import { billingForm } from '@/lib/multi-tenant-payload-cms/forms'

export const dynamic = 'force-dynamic'

// The Billing & plan page's forms (multi-tenant-payload-cms-console design §4).
export function POST(request: Request): Promise<Response> {
  return billingForm(request, formDeps)
}
