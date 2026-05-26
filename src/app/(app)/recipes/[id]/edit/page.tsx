import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RecipeForm from '@/components/recipes/RecipeForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { Category, Recipe, RecipeIngredient, RecipeStep } from '@/lib/types/database'

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  const { data: recipeRaw } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .eq('org_id', membership.org_id)
    .single()

  if (!recipeRaw) notFound()
  const recipe = recipeRaw as Recipe

  const [{ data: ingredientsRaw }, { data: stepsRaw }, { data: categoriesRaw }] = await Promise.all([
    supabase.from('recipe_ingredients').select('*').eq('recipe_id', id).order('sort_order'),
    supabase.from('recipe_steps').select('*').eq('recipe_id', id).order('step_number'),
    supabase.from('categories').select('*').eq('org_id', membership.org_id).order('sort_order'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/recipes/${id}`} className="text-sm text-stone-500 hover:text-stone-700 flex items-center gap-1 mb-3">
          <ChevronLeft className="h-4 w-4" /> Back to recipe
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">Edit Recipe</h1>
      </div>
      <RecipeForm
        orgId={membership.org_id}
        categories={(categoriesRaw ?? []) as Category[]}
        recipe={recipe}
        ingredients={(ingredientsRaw ?? []) as RecipeIngredient[]}
        steps={(stepsRaw ?? []) as RecipeStep[]}
      />
    </div>
  )
}
