import { useState } from 'react'
import GrowthDetailModal from '../GrowthDetailModal'
import { Button } from '@/components/ui/button'

export default function GrowthDetailModalExample() {
  const [open, setOpen] = useState(false)
  
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Growth Detail</Button>
      <GrowthDetailModal
        open={open}
        onClose={() => setOpen(false)}
        metric={{
          type: 'weight',
          value: '8.8',
          unit: 'kgs',
          percentile: 3,
          lastUpdate: '23rd Aug 2025',
          trend: 'up 1 centile from last month.'
        }}
      />
    </>
  )
}
