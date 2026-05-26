import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeft, Clock, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import DeleteRecipeButton from '@/components/recipes/DeleteRecipeButton'
import type { Recipe, RecipeIngredient, RecipeStep } from '@/lib/types/database'

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
}

type RecipeWithCategory = Recipe & { categories: { name: string; color: string } | null }

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: membershipRaw } = await supabase
    .from('organization_members')
    .select('org_id, role')
    .eq('user_id', user!.id)
    .single()

  const membership = membershipRaw as { org_id: string; role: string } | null

  const { data: recipeRaw } = await supabase
    .from('recipes')
    .select('*, categories(name, color)')
    .eq('id', id)
    .eq('org_id', membership!.org_id)
    .single()

  if (!recipeRaw) notFound()
  const recipe = recipeRaw as RecipeWithCategory

  const [{ data: ingredientsRaw }, { data: stepsRaw }] = await Promise.all([
    supabase.from('recipe_ingredients').select('*').eq('recipe_id', id).order('sort_order'),
    supabase.from('recipe_steps').select('*').eq('recipe_id', id).order('step_number'),
  ])

  const ingredients = (ingredientsRaw ?? []) as RecipeIngredient[]
  const steps = (stepsRaw ?? []) as RecipeStep[]

  const canEdit = membership?.role === 'owner' || membership?.role === 'manager'

  return (
    <div className="max-w-2xl space-y-8">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-stone-500 hover:text-stone-700 flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> All recipes
        </Link>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Link href={`/recipes/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1.5" /> Edit
              </Button>
            </Link>
            <DeleteRecipeButton recipeId={id} />
          </div>
        )}
      </div>

      {/* Cover image */}
      {recipe.cover_image_url && (
        <div className="rounded-xl overflow-hidden h-56">
          <img src={recipe.cover_image_url} alt={recipe.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 flex-wrap">
          {recipe.categories && (
            <Badge style={{ backgroundColor: recipe.categories.color + '22', color: recipe.categories.color }}>
              {recipe.categories.name}
            </Badge>
          )}
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${DIFFICULTY_COLORS[recipe.difficulty] ?? ''}`}>
            {recipe.difficulty}
          </span>
          {!recipe.is_published && canEdit && (
            <Badge variant="outline">Draft</Badge>
          )}
        </div>

        <h1 className="text-3xl font-bold text-stone-900">{recipe.title}</h1>

        {recipe.description && (
          <p className="text-stone-600 text-lg leading-relaxed">{recipe.description}</p>
        )}

        {recipe.prep_time_minutes && (
          <div className="flex items-center gap-1.5 text-stone-500">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{recipe.prep_time_minutes} minutes prep</span>
          </div>
        )}
      </div>

      {/* Ingredients */}
      {ingredients.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-stone-900 mb-4 pb-2 border-b border-stone-100">
            Ingredients
          </h2>
          <ul className="space-y-2">
            {ingredients.map(ing => (
              <li key={ing.id} className="flex items-center gap-3 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-700 shrink-0" />
                <span className="text-stone-800">
                  {ing.quantity && <span className="font-medium">{ing.quantity} </span>}
                  {ing.unit && <span className="font-medium">{ing.unit} </span>}
                  {ing.name}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Steps */}
      {steps.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-stone-900 mb-6 pb-2 border-b border-stone-100">
            Instructions
          </h2>
          <ol className="space-y-6">
            {steps.map(step => (
              <li key={step.id} className="flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-800 text-white text-sm font-bold">
                    {step.step_number}
                  </span>
                </div>
                <div className="flex-1 pt-1 space-y-2">
                  <p className="text-stone-800 leading-relaxed text-base">{step.instruction}</p>
                  {step.tip && (
                    <div className="flex items-start gap-2 bg-amber-50 rounded-lg px-3 py-2">
                      <span className="text-amber-700 text-xs font-semibold uppercase tracking-wide mt-0.5">Tip</span>
                      <p className="text-amber-900 text-sm">{step.tip}</p>
                    </div>
                  )}
                  {step.image_url && (
                    <img
                      src={step.image_url}
                      alt={`Step ${step.step_number}`}
                      className="rounded-lg w-full max-h-48 object-cover mt-2"
                    />
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {steps.length === 0 && ingredients.length === 0 && (
        <div className="text-center py-12 text-stone-400">
          <p>No ingredients or steps added yet.</p>
          {canEdit && (
            <Link href={`/recipes/${id}/edit`}>
              <Button variant="outline" className="mt-4">Add ingredients & steps</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
