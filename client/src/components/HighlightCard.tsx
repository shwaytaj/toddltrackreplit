import { Card } from '@/components/ui/card';
import { Sparkles, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Highlight } from '@shared/highlights';

interface HighlightCardProps {
  highlight: Highlight;
}

export default function HighlightCard({ highlight }: HighlightCardProps) {
  const isCelebration = highlight.type === 'celebration';
  
  return (
    <Card
      className={cn(
        "p-4 border-l-4",
        isCelebration 
          ? "border-l-green-500 bg-green-50 dark:bg-green-950/20" 
          : "border-l-amber-500 bg-amber-50 dark:bg-amber-950/20"
      )}
      data-testid={`highlight-card-${highlight.type}`}
    >
      <div className="flex gap-3">
        <div className={cn(
          "flex-shrink-0 p-2 rounded-full",
          isCelebration 
            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
            : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        )}>
          {isCelebration ? <Sparkles className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              "font-semibold text-sm",
              isCelebration 
                ? "text-green-800 dark:text-green-300" 
                : "text-amber-800 dark:text-amber-300"
            )}>
              {highlight.message}
            </h3>
            {isCelebration && highlight.percentage && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200">
                {highlight.percentage}%
              </span>
            )}
          </div>
          {highlight.detail && (
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {highlight.detail}
            </p>
          )}
          {highlight.daysUntilRangeEnds > 0 && (
            <p className="mt-2 text-xs text-muted-foreground italic">
              {highlight.daysUntilRangeEnds} days until next developmental stage
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
