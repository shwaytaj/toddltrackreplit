import MilestoneCard from '../MilestoneCard'

export default function MilestoneCardExample() {
  return (
    <div className="grid grid-cols-2 gap-3 max-w-md">
      <MilestoneCard
        title="Jump in place"
        category="Gross motor"
        categoryColor="bg-purple-100 dark:bg-purple-900/20"
        onClick={() => console.log('Milestone clicked')}
      />
      <MilestoneCard
        title="2 to 3 word sentences"
        category="Communication"
        categoryColor="bg-green-100 dark:bg-green-900/20"
        achieved
        onClick={() => console.log('Milestone clicked')}
      />
    </div>
  )
}
