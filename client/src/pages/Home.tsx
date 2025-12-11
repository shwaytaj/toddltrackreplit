import { useState, useMemo, useEffect } from 'react';
import ChildSelector from '@/components/ChildSelector';
import CategoryProgressCard from '@/components/CategoryProgressCard';
import GrowthMetricCard from '@/components/GrowthMetricCard';
import HighlightCard from '@/components/HighlightCard';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { calculateAdjustedAge, getAgeRange, getAdjustedMonthsForRange, formatAge } from '@/lib/age-calculation';
import type { Milestone, ChildMilestone, GrowthMetric } from '@shared/schema';
import type { Highlight } from '@shared/highlights';

export default function Home() {
  const [, setLocation] = useLocation();
  const [activeNav, setActiveNav] = useState<'home' | 'milestones' | 'profile'>('home');
  const { user, isLoading: userLoading } = useUser();
  const { children, activeChildId, activeChild: selectedChild, setActiveChildId, isLoading: childrenLoading } = useActiveChild();

  useEffect(() => {
    if (!userLoading && !user) {
      setLocation('/');
    }
  }, [userLoading, user, setLocation]);

  useEffect(() => {
    if (!userLoading && user && !childrenLoading && children.length === 0) {
      setLocation('/onboarding');
    }
  }, [userLoading, user, childrenLoading, children, setLocation]);

  const adjustedAge = useMemo(() => {
    if (!selectedChild) return null;
    return calculateAdjustedAge(selectedChild.dueDate);
  }, [selectedChild]);

  const adjustedMonths = useMemo(() => {
    if (!selectedChild) return 0;
    return getAdjustedMonthsForRange(selectedChild.dueDate);
  }, [selectedChild]);

  const ageRange = useMemo(() => 
    adjustedMonths >= 0 ? getAgeRange(adjustedMonths) : null,
    [adjustedMonths]
  );

  const { data: milestones = [] } = useQuery<Milestone[]>({
    queryKey: ['/api/milestones/age-range', ageRange?.min, ageRange?.max],
    enabled: ageRange !== null && ageRange?.min !== undefined && ageRange?.max !== undefined,
  });

  const { data: childMilestones = [] } = useQuery<ChildMilestone[]>({
    queryKey: ['/api/children', activeChildId, 'milestones'],
    enabled: !!activeChildId,
  });

  const { data: growthMetrics = [] } = useQuery<GrowthMetric[]>({
    queryKey: ['/api/children', activeChildId, 'growth-metrics'],
    enabled: !!activeChildId,
  });

  // Fetch highlights for the active child
  const { data: highlightsData } = useQuery<{
    highlights: Highlight[];
    ageRange: { min: number; max: number; label: string };
    daysUntilRangeEnds: number;
  }>({
    queryKey: ['/api/children', activeChildId, 'highlights'],
    enabled: !!activeChildId,
  });

  const achievedMilestoneIds = new Set(
    childMilestones.filter(cm => cm.achieved).map(cm => cm.milestoneId)
  );

  const categoryProgress = useMemo(() => {
    const categories = ['Developmental', 'Teeth', 'Vision', 'Hearing'] as const;
    
    return categories.map(category => {
      const categoryMilestones = milestones.filter(m => m.category === category);
      const achievedCount = categoryMilestones.filter(m => achievedMilestoneIds.has(m.id)).length;
      return {
        category,
        total: categoryMilestones.length,
        achieved: achievedCount,
      };
    }).filter(c => c.total > 0);
  }, [milestones, achievedMilestoneIds]);

  const latestMetrics = useMemo(() => {
    const weight = growthMetrics
      .filter(m => m.type === 'weight')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    const height = growthMetrics
      .filter(m => m.type === 'height')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    const head = growthMetrics
      .filter(m => m.type === 'head_circumference')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    return { weight, height, head };
  }, [growthMetrics]);

  const handleNavigation = (page: 'home' | 'milestones' | 'profile') => {
    setActiveNav(page);
    if (page === 'milestones') setLocation('/milestones');
    if (page === 'profile') setLocation('/profile');
  };

  const handleViewCategory = (category: string) => {
    setLocation(`/milestones?category=${encodeURIComponent(category)}`);
  };

  if (childrenLoading || !selectedChild || !adjustedAge) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4 space-y-6 max-w-2xl mx-auto">
          <div className="h-10 bg-muted animate-pulse rounded-full w-32" />
          <div className="h-20 bg-muted animate-pulse rounded" />
        </div>
        <BottomNav active={activeNav} onNavigate={handleNavigation} />
      </div>
    );
  }

  const firstName = selectedChild.name.split(' ')[0];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <div>
          <ChildSelector
            children={children}
            activeId={activeChildId || ''}
            onSelect={setActiveChildId}
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-overview">Overview</h1>
          <div className="space-y-1">
            <p className="font-medium" data-testid="text-child-age">
              {firstName}'s adjusted age is {formatAge(adjustedAge)}!
            </p>
            <p className="text-sm text-muted-foreground">
              We calculate the developmental milestone range based on due date and not the birth date of the child.
            </p>
          </div>
        </div>

        {highlightsData?.highlights && highlightsData.highlights.length > 0 && (
          <div className="space-y-3" data-testid="section-highlights">
            {highlightsData.highlights.map((highlight, index) => (
              <HighlightCard key={`${highlight.type}-${index}`} highlight={highlight} />
            ))}
          </div>
        )}

        <div>
          <h2 className="text-xl font-bold mb-4" data-testid="heading-milestone-range">
            {ageRange?.label} Milestones
          </h2>

          <div className="space-y-4">
            {categoryProgress.map(({ category, total, achieved }) => (
              <CategoryProgressCard
                key={category}
                category={category}
                childName={selectedChild.name}
                achievedCount={achieved}
                totalCount={total}
                onViewAll={() => handleViewCategory(category)}
              />
            ))}
          </div>
        </div>

        {(latestMetrics.weight || latestMetrics.height || latestMetrics.head) && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Growth</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                data-testid="button-view-growth-details"
                onClick={() => setLocation('/growth/weight')}
              >
                View details →
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {latestMetrics.weight && (
                <GrowthMetricCard
                  type="weight"
                  value={latestMetrics.weight.value.toString()}
                  unit="kg"
                  percentile={latestMetrics.weight.percentile || 0}
                  onClick={() => setLocation('/growth/weight')}
                  data-testid="card-growth-weight"
                />
              )}
              {latestMetrics.height && (
                <GrowthMetricCard
                  type="height"
                  value={latestMetrics.height.value.toString()}
                  unit="cm"
                  percentile={latestMetrics.height.percentile || 0}
                  onClick={() => setLocation('/growth/height')}
                  data-testid="card-growth-height"
                />
              )}
              {latestMetrics.head && (
                <GrowthMetricCard
                  type="head"
                  value={latestMetrics.head.value.toString()}
                  unit="cm"
                  percentile={latestMetrics.head.percentile || 0}
                  onClick={() => setLocation('/growth/head')}
                  data-testid="card-growth-head"
                />
              )}
            </div>
          </div>
        )}
      </div>

      <BottomNav active={activeNav} onNavigate={handleNavigation} />
    </div>
  );
}
