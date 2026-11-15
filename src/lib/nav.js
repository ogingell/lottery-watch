import { Hourglass, Ticket, Dices, Info } from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/',       label: 'Longest wait', short: 'Wait',  icon: Hourglass },
  { to: '/cards',  label: 'Scratchcards', short: 'Cards', icon: Ticket },
  { to: '/draws',  label: 'Draw games',   short: 'Draws', icon: Dices },
  { to: '/about',  label: 'How it works', short: 'About', icon: Info },
]
