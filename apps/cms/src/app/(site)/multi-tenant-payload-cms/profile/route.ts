import { formDeps } from '@/lib/multi-tenant-payload-cms/form-deps'
import { profileForm } from '@/lib/multi-tenant-payload-cms/forms'

export const dynamic = 'force-dynamic'

// The Profile page's form (multi-tenant-payload-cms-console design §4).
export function POST(request: Request): Promise<Response> {
  return profileForm(request, formDeps)
}
