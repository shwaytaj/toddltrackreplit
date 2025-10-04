import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MilestoneCardProps {
  title: string;
  category: string;
  categoryColor?: string;
  achieved?: boolean;
  onClick?: () => void;
}

export default function MilestoneCard({
  title,
  category,
  categoryColor = 'bg-primary/20',
  achieved = false,
  onClick
}: MilestoneCardProps) {
  return (
    <Card
      className={cn(
        "p-4 cursor-pointer hover-elevate active-elevate-2 transition-all",
        categoryColor
      )}
      onClick={onClick}
      data-testid={`card-milestone-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex flex-col items-center justify-center text-center min-h-[100px] gap-2">
        <p className="font-semibold text-sm leading-snug">{title}</p>
        <p className="text-xs text-muted-foreground">{category}</p>
        {achieved && (
          <div className="mt-1 text-xs text-success font-medium">✓ Achieved</div>
        )}
      </div>
    </Card>
  );
}
