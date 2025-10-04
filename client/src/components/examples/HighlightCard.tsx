import HighlightCard from '../HighlightCard'

export default function HighlightCardExample() {
  return (
    <div className="space-y-3 max-w-md">
      <HighlightCard
        type="achievement"
        title="Woohoo! Arya is a trooper."
        description="She started walking last week. Her walk may seem wobbly now but she will be walking more stably and even running!"
      />
      <HighlightCard
        type="alert"
        title="Arya is not talking yet."
        description="Try some of our guides and if you're still worried contact a GP or Public Health Nurse. Ask for a development review."
      />
    </div>
  )
}
