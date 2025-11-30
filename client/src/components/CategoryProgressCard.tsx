import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Brain, Ear, Eye } from 'lucide-react';
import { GiTooth } from 'react-icons/gi';
import { ChevronRight } from 'lucide-react';

interface CategoryProgressCardProps {
  category: 'Developmental' | 'Teeth' | 'Vision' | 'Hearing';
  childName: string;
  achievedCount: number;
  totalCount: number;
  onViewAll: () => void;
}

const categoryConfig = {
  Developmental: {
    icon: Brain,
    label: 'developmental',
    colorClass: 'text-[hsl(var(--category-gross-motor))]',
    progressColorClass: '[&>div]:bg-[hsl(var(--category-gross-motor))]',
  },
  Teeth: {
    icon: GiTooth,
    label: 'teething',
    colorClass: 'text-[hsl(var(--category-teeth))]',
    progressColorClass: '[&>div]:bg-[hsl(var(--category-teeth))]',
  },
  Vision: {
    icon: Eye,
    label: 'vision',
    colorClass: 'text-[hsl(var(--category-vision))]',
    progressColorClass: '[&>div]:bg-[hsl(var(--category-vision))]',
  },
  Hearing: {
    icon: Ear,
    label: 'hearing',
    colorClass: 'text-[hsl(var(--category-hearing))]',
    progressColorClass: '[&>div]:bg-[hsl(var(--category-hearing))]',
  },
};

export default function CategoryProgressCard({
  category,
  childName,
  achievedCount,
  totalCount,
  onViewAll,
}: CategoryProgressCardProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;
  const percentage = totalCount > 0 ? Math.round((achievedCount / totalCount) * 100) : 0;
  const firstName = childName.split(' ')[0];

  return (
    <Card 
      className="p-4 hover-elevate active-elevate-2 cursor-pointer" 
      onClick={onViewAll} 
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewAll();
        }
      }}
      data-testid={`card-category-${category.toLowerCase()}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${config.colorClass}`} />
          <span className="font-semibold">{category}</span>
        </div>
        <span
          className="flex items-center gap-1 text-sm text-muted-foreground"
          aria-hidden="true"
        >
          View all
          <ChevronRight className="w-4 h-4" />
        </span>
      </div>
      
      <p className="text-sm text-muted-foreground mb-3" data-testid={`text-progress-${category.toLowerCase()}`}>
        {firstName} has achieved {percentage}% of the {config.label} milestones for this age range.
      </p>
      
      <Progress 
        value={percentage} 
        className={`h-2 ${config.progressColorClass}`}
        data-testid={`progress-${category.toLowerCase()}`}
      />
    </Card>
  );
}
