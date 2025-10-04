import { Card } from '@/components/ui/card';
import { Crown, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HighlightCardProps {
  type: 'achievement' | 'alert';
  title: string;
  description: string;
}

export default function HighlightCard({ type, title, description }: HighlightCardProps) {
  const isAchievement = type === 'achievement';
  
  return (
    <Card
      className={cn(
        "p-4",
        isAchievement ? "bg-accent/30" : "bg-destructive/10"
      )}
      data-testid={`card-highlight-${type}`}
    >
      <div className="flex gap-3">
        <div className={cn(
          "mt-1",
          isAchievement ? "text-accent-foreground" : "text-destructive-foreground"
        )}>
          {isAchievement ? <Crown className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </Card>
  );
}
