import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RecipeForm from '@/components/recipes/RecipeForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { Category } from '@/lib/types/database'

export default async function NewRecipePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: membershipRaw } = await supabase
    .from('organization_members')
    .select('org_id, role')
    .eq('user_id', user!.id)
    .single()

  const membership = membershipRaw as { org_id: string; role: string } | null

  if (!membership || !['owner', 'manager'].includes(membership.role ?? '')) {
    redirect('/dashboard')
  }

  const { data: categoriesRaw } = await supabase
    .from('categories')
    .select('*')
    .eq('org_id', membership.org_id)
    .order('sort_order')

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm text-stone-500 hover:text-stone-700 flex items-center gap-1 mb-3">
          <ChevronLeft className="h-4 w-4" /> Back to recipes
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">New Recipe</h1>
      </div>
      <RecipeForm orgId={membership.org_id} categories={(categoriesRaw ?? []) as Category[]} />
    </div>
  )
}
