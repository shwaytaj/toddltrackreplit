import GrowthMetricCard from '../GrowthMetricCard'

export default function GrowthMetricCardExample() {
  return (
    <div className="grid grid-cols-3 gap-3 max-w-2xl">
      <GrowthMetricCard
        type="weight"
        value="8.8"
        unit="kgs"
        percentile={3}
        color="bg-blue-50 dark:bg-blue-950/20"
        onClick={() => console.log('Weight clicked')}
      />
      <GrowthMetricCard
        type="height"
        value="76"
        unit="cm"
        percentile={1}
        color="bg-amber-50 dark:bg-amber-950/20"
        onClick={() => console.log('Height clicked')}
      />
      <GrowthMetricCard
        type="head"
        value="45"
        unit="cm"
        percentile={4}
        color="bg-teal-50 dark:bg-teal-950/20"
        onClick={() => console.log('Head circumference clicked')}
      />
    </div>
  )
}
