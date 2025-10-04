import { useState } from 'react'
import BottomNav from '../BottomNav'

export default function BottomNavExample() {
  const [active, setActive] = useState<'home' | 'milestones' | 'profile'>('home')
  
  return (
    <div className="h-20">
      <BottomNav 
        active={active} 
        onNavigate={(page) => {
          setActive(page)
          console.log('Navigate to:', page)
        }} 
      />
    </div>
  )
}
