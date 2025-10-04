import { useState } from 'react'
import ChildSelector from '../ChildSelector'

export default function ChildSelectorExample() {
  const [activeId, setActiveId] = useState('1')
  
  const children = [
    { id: '1', name: 'Arya', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' },
    { id: '2', name: 'Arjun', photo: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop' },
    { id: '3', name: 'Maya' },
  ]
  
  return (
    <ChildSelector 
      children={children} 
      activeId={activeId} 
      onSelect={(id) => {
        setActiveId(id)
        console.log('Selected child:', id)
      }} 
    />
  )
}
