import { useState } from 'react'
import MilestoneDetailModal from '../MilestoneDetailModal'
import { Button } from '@/components/ui/button'

export default function MilestoneDetailModalExample() {
  const [open, setOpen] = useState(false)
  
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Milestone Detail</Button>
      <MilestoneDetailModal
        open={open}
        onClose={() => setOpen(false)}
        milestone={{
          title: "Says 2 to 3 word sentences",
          category: "Communication",
          ageRange: "20-26 month",
          about: "This is the jump from single words to combining them: 'more milk,' 'Daddy go work,' 'my shoe on.' It's telegraphic speech, short, content-heavy, missing little glue words, and that's perfect. You'll hear real verbs, early word order, and a wider range of reasons to talk.",
          typicalRange: "Two-word combinations start between 18-24 months",
          achieved: true
        }}
        guides={[
          {
            title: "Add one word.",
            description: "Child: 'ball.' You: 'big ball,' then 'big red ball.' Keep it natural, not drill-like. Model verbs all day."
          },
          {
            title: "Narrate simply",
            description: "'Daddy is cooking,' 'Open door,' 'Birds are flying.' Verbs drive sentences."
          },
          {
            title: "Use choices that require combinations.",
            description: "'Do you want more crackers or more banana?' Wait 5-7 seconds. If they say 'banana,' expand: 'More banana.'"
          }
        ]}
        products={[
          {
            image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200&h=200&fit=crop",
            title: "Carson Dellosa First Words Flash Cards for Toddlers 2-4 Years",
            description: "Educational toy"
          },
          {
            image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=200&h=200&fit=crop",
            title: "Talking Flash Cards for Toddlers 1 2 3 4 5 6 Years Old Educational Toys",
            description: "Interactive learning"
          }
        ]}
      />
    </>
  )
}
