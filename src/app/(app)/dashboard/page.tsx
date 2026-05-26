import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PlusCircle, Clock, ChefHat, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Category, Recipe } from '@/lib/types/database'

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
}

type RecipeWithCategory = Recipe & { categories: { name: string; color: string } | null }

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const { q, category } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: membershipRaw } = await supabase
    .from('organization_members')
    .select('org_id, role')
    .eq('user_id', user!.id)
    .single()

  const membership = membershipRaw as { org_id: string; role: string } | null
  const canEdit = membership?.role === 'owner' || membership?.role === 'manager'

  if (!membership) {
    return (
      <div className="text-center py-20 text-stone-500">
        <p className="text-lg font-medium">No coffee stand found.</p>
        <p className="text-sm mt-2">Your account was created but no stand is linked yet. Please contact support.</p>
      </div>
    )
  }

  const { data: categoriesRaw } = await supabase
    .from('categories')
    .select('*')
    .eq('org_id', membership.org_id)
    .order('sort_order')

  const categories = (categoriesRaw ?? []) as Category[]

  let query = supabase
    .from('recipes')
    .select('*, categories(name, color)')
    .eq('org_id', membership.org_id)
    .order('sort_order')
    .order('created_at', { ascending: false })

  if (q) query = query.ilike('title', `%${q}%`)
  if (category) query = query.eq('category_id', category)

  const { data: recipesRaw } = await query
  const recipes = (recipesRaw ?? []) as RecipeWithCategory[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Recipe Book</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canEdit && (
          <Link href="/recipes/new">
            <Button className="bg-amber-800 hover:bg-amber-900">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Recipe
            </Button>
          </Link>
        )}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form className="relative flex-1" method="GET">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search recipes…"
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-700"
          />
          {category && <input type="hidden" name="category" value={category} />}
        </form>
        <div className="flex gap-2 flex-wrap">
          <Link href="/dashboard">
            <Button variant={!category ? 'default' : 'outline'} size="sm"
              className={!category ? 'bg-amber-800 hover:bg-amber-900' : ''}>
              All
            </Button>
          </Link>
          {categories.map(cat => (
            <Link key={cat.id} href={`/dashboard?category=${cat.id}${q ? `&q=${q}` : ''}`}>
              <Button
                variant={category === cat.id ? 'default' : 'outline'}
                size="sm"
                className={category === cat.id ? 'bg-amber-800 hover:bg-amber-900' : ''}
              >
                {cat.name}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Recipe Grid */}
      {recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map(recipe => (
            <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                {recipe.cover_image_url && (
                  <div className="h-40 overflow-hidden rounded-t-lg">
                    <img
                      src={recipe.cover_image_url}
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">{recipe.title}</CardTitle>
                    {!recipe.is_published && canEdit && (
                      <Badge variant="outline" className="text-xs shrink-0">Draft</Badge>
                    )}
                  </div>
                  {recipe.description && (
                    <p className="text-stone-500 text-sm line-clamp-2">{recipe.description}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {recipe.categories && (
                      <Badge
                        style={{
                          backgroundColor: recipe.categories.color + '22',
                          color: recipe.categories.color,
                        }}
                        className="text-xs"
                      >
                        {recipe.categories.name}
                      </Badge>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[recipe.difficulty] ?? ''}`}>
                      {recipe.difficulty}
                    </span>
                    {recipe.prep_time_minutes && (
                      <span className="text-xs text-stone-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {recipe.prep_time_minutes}m
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <ChefHat className="h-12 w-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-700">
            {q || category ? 'No recipes match your search' : 'No recipes yet'}
          </h3>
          <p className="text-stone-400 text-sm mt-1 mb-6">
            {q || category ? 'Try a different search or category' : 'Add your first drink recipe to get started'}
          </p>
          {canEdit && !q && !category && (
            <Link href="/recipes/new">
              <Button className="bg-amber-800 hover:bg-amber-900">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add your first recipe
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
