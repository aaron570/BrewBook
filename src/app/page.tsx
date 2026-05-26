import Link from 'next/link'
import { Coffee, BookOpen, Users, ChefHat, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 to-amber-900 text-white">
      {/* Nav */}
      <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coffee className="h-6 w-6" />
          <span className="text-xl font-bold">BrewBook</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-amber-200 hover:text-white hover:bg-amber-800">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold">Get started free</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-800/60 rounded-full px-4 py-1.5 text-amber-200 text-sm mb-8">
          <ChefHat className="h-4 w-4" />
          Built for coffee stands
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6">
          Your drink recipes.<br />
          <span className="text-amber-400">Your barista training.</span>
        </h1>
        <p className="text-amber-200 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          BrewBook lets coffee stand owners build a beautiful digital recipe book — step-by-step instructions your baristas can follow from day one.
        </p>
        <Link href="/signup">
          <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-base px-8">
            Start your recipe book <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: BookOpen,
              title: 'Step-by-step recipes',
              desc: 'Break every drink into clear steps with ingredient quantities, instructions, and pro tips.',
            },
            {
              icon: Users,
              title: 'Train staff faster',
              desc: 'New baristas get up to speed on your exact recipes in minutes — not weeks.',
            },
            {
              icon: ChefHat,
              title: 'Your brand, your book',
              desc: 'Organize by category, set difficulty levels, and keep drafts until your recipe is perfect.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-amber-800/40 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Icon className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-amber-200 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-16 px-6">
        <h2 className="text-3xl font-bold mb-4">Ready to build your recipe book?</h2>
        <p className="text-amber-300 mb-8">Free to start. No credit card required.</p>
        <Link href="/signup">
          <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold px-10">
            Create your account
          </Button>
        </Link>
      </section>

      <footer className="text-center pb-10 text-amber-600 text-sm">
        © {new Date().getFullYear()} BrewBook
      </footer>
    </div>
  )
}
