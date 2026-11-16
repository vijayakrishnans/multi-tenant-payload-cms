import { formDeps } from '@/lib/multi-tenant-payload-cms/form-deps'
import { notificationsForm } from '@/lib/multi-tenant-payload-cms/forms'

export const dynamic = 'force-dynamic'

// The Notifications page's form (multi-tenant-payload-cms-console design §4).
export function POST(request: Request): Promise<Response> {
  return notificationsForm(request, formDeps)
}
