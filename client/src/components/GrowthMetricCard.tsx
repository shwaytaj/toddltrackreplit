import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface GrowthMetricCardProps {
  type: 'weight' | 'height' | 'head';
  value: string;
  unit: string;
  percentile: number;
  color?: string;
  onClick?: () => void;
}

export default function GrowthMetricCard({
  type,
  value,
  unit,
  percentile,
  color = 'bg-blue-50 dark:bg-blue-950/20',
  onClick
}: GrowthMetricCardProps) {
  const labels = {
    weight: 'Weight',
    height: 'Height',
    head: 'Head'
  };

  return (
    <Card
      className={cn(
        "p-4 cursor-pointer hover-elevate active-elevate-2",
        color
      )}
      onClick={onClick}
      data-testid={`card-growth-${type}`}
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground">{labels[type]}</p>
        <p className="text-2xl font-semibold">
          {value}
          <span className="text-sm text-muted-foreground ml-0.5">{unit}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Baby is in the {percentile}{percentile === 1 ? 'st' : percentile === 2 ? 'nd' : percentile === 3 ? 'rd' : 'th'} percentile
        </p>
      </div>
    </Card>
  );
}
