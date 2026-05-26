import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/AppNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get the user's org
  const { data: membershipRaw } = await supabase
    .from('organization_members')
    .select('org_id, role, organizations(id, name, slug)')
    .eq('user_id', user.id)
    .single()

  const membership = membershipRaw as { org_id: string; role: string; organizations: { id: string; name: string; slug: string } | null } | null
  const org = membership?.organizations ?? null

  return (
    <div className="min-h-screen bg-stone-50">
      <AppNav orgName={org?.name ?? 'My Stand'} userRole={membership?.role ?? 'barista'} />
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
