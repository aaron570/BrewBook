'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlusCircle, Trash2, GripVertical, ChevronUp, ChevronDown, Save, Eye, EyeOff } from 'lucide-react'
import type { Category, Recipe, RecipeIngredient, RecipeStep } from '@/lib/types/database'

interface RecipeFormProps {
  orgId: string
  categories: Category[]
  recipe?: Recipe
  ingredients?: RecipeIngredient[]
  steps?: RecipeStep[]
}

interface IngredientDraft {
  id?: string
  name: string
  quantity: string
  unit: string
}

interface StepDraft {
  id?: string
  instruction: string
  tip: string
}

export default function RecipeForm({ orgId, categories, recipe, ingredients = [], steps = [] }: RecipeFormProps) {
  const router = useRouter()
  const isEditing = !!recipe

  const [title, setTitle] = useState(recipe?.title ?? '')
  const [description, setDescription] = useState(recipe?.description ?? '')
  const [categoryId, setCategoryId] = useState(recipe?.category_id ?? '')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(recipe?.difficulty ?? 'easy')
  const [prepTime, setPrepTime] = useState(recipe?.prep_time_minutes?.toString() ?? '')
  const [isPublished, setIsPublished] = useState(recipe?.is_published ?? false)

  const [ingredientList, setIngredientList] = useState<IngredientDraft[]>(
    ingredients.length > 0
      ? ingredients.map(i => ({ id: i.id, name: i.name, quantity: i.quantity ?? '', unit: i.unit ?? '' }))
      : [{ name: '', quantity: '', unit: '' }]
  )

  const [stepList, setStepList] = useState<StepDraft[]>(
    steps.length > 0
      ? steps.map(s => ({ id: s.id, instruction: s.instruction, tip: s.tip ?? '' }))
      : [{ instruction: '', tip: '' }]
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // ── Ingredients ──────────────────────────────────────────────
  function addIngredient() {
    setIngredientList(prev => [...prev, { name: '', quantity: '', unit: '' }])
  }

  function removeIngredient(index: number) {
    setIngredientList(prev => prev.filter((_, i) => i !== index))
  }

  function updateIngredient(index: number, field: keyof IngredientDraft, value: string) {
    setIngredientList(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  // ── Steps ─────────────────────────────────────────────────────
  function addStep() {
    setStepList(prev => [...prev, { instruction: '', tip: '' }])
  }

  function removeStep(index: number) {
    setStepList(prev => prev.filter((_, i) => i !== index))
  }

  function updateStep(index: number, field: keyof StepDraft, value: string) {
    setStepList(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function moveStep(index: number, dir: -1 | 1) {
    setStepList(prev => {
      const next = [...prev]
      const swap = index + dir
      if (swap < 0 || swap >= next.length) return prev
      ;[next[index], next[swap]] = [next[swap], next[index]]
      return next
    })
  }

  // ── Save ──────────────────────────────────────────────────────
  async function handleSave(publish: boolean) {
    if (!title.trim()) { setError('Recipe title is required'); return }
    setSaving(true)
    setError('')

    const supabase = createClient()

    try {
      let recipeId = recipe?.id

      if (isEditing) {
        await supabase.from('recipes').update({
          title: title.trim(),
          description: description.trim() || null,
          category_id: categoryId || null,
          difficulty,
          prep_time_minutes: prepTime ? parseInt(prepTime) : null,
          is_published: publish,
        }).eq('id', recipeId!)
      } else {
        const { data: newRecipe, error: createError } = await supabase
          .from('recipes')
          .insert({
            org_id: orgId,
            title: title.trim(),
            description: description.trim() || null,
            category_id: categoryId || null,
            difficulty,
            prep_time_minutes: prepTime ? parseInt(prepTime) : null,
            is_published: publish,
          })
          .select()
          .single()

        if (createError || !newRecipe) throw new Error(createError?.message)
        recipeId = newRecipe.id
      }

      // Replace ingredients
      await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId!)
      const validIngredients = ingredientList.filter(i => i.name.trim())
      if (validIngredients.length > 0) {
        await supabase.from('recipe_ingredients').insert(
          validIngredients.map((i, idx) => ({
            recipe_id: recipeId!,
            name: i.name.trim(),
            quantity: i.quantity.trim() || null,
            unit: i.unit.trim() || null,
            sort_order: idx,
          }))
        )
      }

      // Replace steps
      await supabase.from('recipe_steps').delete().eq('recipe_id', recipeId!)
      const validSteps = stepList.filter(s => s.instruction.trim())
      if (validSteps.length > 0) {
        await supabase.from('recipe_steps').insert(
          validSteps.map((s, idx) => ({
            recipe_id: recipeId!,
            step_number: idx + 1,
            instruction: s.instruction.trim(),
            tip: s.tip.trim() || null,
          }))
        )
      }

      router.push(`/recipes/${recipeId}`)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save recipe')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</div>}

      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Basic Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Recipe name *</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Lavender Oat Latte" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What makes this drink special?"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm bg-background"
              >
                <option value="">No category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Prep time (minutes)</Label>
              <Input
                type="number"
                min="0"
                value={prepTime}
                onChange={e => setPrepTime(e.target.value)}
                placeholder="e.g. 5"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as const).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize ${
                    difficulty === d
                      ? 'bg-amber-800 text-white border-amber-800'
                      : 'border-stone-200 text-stone-600 hover:border-amber-700'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ingredients */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Ingredients</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
              <PlusCircle className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {ingredientList.map((ingredient, index) => (
            <div key={index} className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-stone-300 shrink-0" />
              <Input
                placeholder="Ingredient"
                value={ingredient.name}
                onChange={e => updateIngredient(index, 'name', e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Qty"
                value={ingredient.quantity}
                onChange={e => updateIngredient(index, 'quantity', e.target.value)}
                className="w-20"
              />
              <Input
                placeholder="Unit"
                value={ingredient.unit}
                onChange={e => updateIngredient(index, 'unit', e.target.value)}
                className="w-20"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeIngredient(index)}
                className="text-stone-400 hover:text-red-500 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Steps</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addStep}>
              <PlusCircle className="h-4 w-4 mr-1" /> Add step
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {stepList.map((step, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex flex-col items-center gap-1 pt-1">
                <span className="text-xs font-bold text-amber-800 bg-amber-100 rounded-full w-6 h-6 flex items-center justify-center">
                  {index + 1}
                </span>
                <button type="button" onClick={() => moveStep(index, -1)} disabled={index === 0}
                  className="text-stone-300 hover:text-stone-500 disabled:opacity-20">
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button type="button" onClick={() => moveStep(index, 1)} disabled={index === stepList.length - 1}
                  className="text-stone-300 hover:text-stone-500 disabled:opacity-20">
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="What does the barista do in this step?"
                  value={step.instruction}
                  onChange={e => updateStep(index, 'instruction', e.target.value)}
                  rows={2}
                />
                <Input
                  placeholder="Optional tip or note for this step"
                  value={step.tip}
                  onChange={e => updateStep(index, 'tip', e.target.value)}
                  className="text-sm"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeStep(index)}
                className="text-stone-400 hover:text-red-500 mt-1 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={() => handleSave(true)}
          disabled={saving}
          className="bg-amber-800 hover:bg-amber-900"
        >
          <Eye className="h-4 w-4 mr-2" />
          {saving ? 'Saving…' : (isPublished ? 'Save & Publish' : 'Save & Publish')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSave(false)}
          disabled={saving}
        >
          <EyeOff className="h-4 w-4 mr-2" />
          Save as Draft
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
