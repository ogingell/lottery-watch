import { Sparkles, LayoutGrid, Dices, BookOpen } from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/',       label: 'Today',  icon: Sparkles },
  { to: '/cards',  label: 'Cards',  icon: LayoutGrid },
  { to: '/draws',  label: 'Draws',  icon: Dices },
  { to: '/guide',  label: 'Guide',  icon: BookOpen },
]
