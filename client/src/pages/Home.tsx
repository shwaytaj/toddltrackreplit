import { useState, useEffect, useMemo } from 'react';
import ChildSelector from '@/components/ChildSelector';
import HighlightCard from '@/components/HighlightCard';
import MilestoneCard from '@/components/MilestoneCard';
import GrowthMetricCard from '@/components/GrowthMetricCard';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import { calculateCorrectedAge, getAgeRange, formatAge, formatAdjustment } from '@/lib/age-calculation';
import { getMonkeyIcon } from '@/components/MonkeyIcons';
import type { Child, Milestone, ChildMilestone, GrowthMetric } from '@shared/schema';

// Map subcategories to colors for visual distinction
const subcategoryColors: Record<string, string> = {
  'Gross Motor Skills': 'bg-purple-100 dark:bg-purple-900/20',
  'Fine Motor Skills': 'bg-purple-100 dark:bg-purple-900/20',
  'Communication': 'bg-green-100 dark:bg-green-900/20',
  'Social & Emotional': 'bg-amber-100 dark:bg-amber-900/20',
  'Cognitive': 'bg-blue-100 dark:bg-blue-900/20',
  'Physical': 'bg-rose-100 dark:bg-rose-900/20',
  'Development': 'bg-cyan-100 dark:bg-cyan-900/20',
  'Eruption': 'bg-pink-100 dark:bg-pink-900/20',
  'Vision': 'bg-amber-50 dark:bg-amber-950/20',
  'Hearing': 'bg-teal-50 dark:bg-teal-950/20',
};

// Helper function to get color for a milestone
function getMilestoneColor(milestone: Milestone): string {
  // Use subcategory if available, otherwise fall back to category
  const key = milestone.subcategory || milestone.category;
  return subcategoryColors[key] || 'bg-gray-100 dark:bg-gray-900/20';
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [activeNav, setActiveNav] = useState<'home' | 'milestones' | 'profile'>('home');
  const { user, isLoading: userLoading } = useUser();

  const { data: children = [], isLoading: childrenLoading } = useQuery<Child[]>({
    queryKey: ['/api/children'],
    enabled: !!user,
  });

  const [activeChild, setActiveChild] = useState('');

  useEffect(() => {
    if (children.length > 0 && !activeChild) {
      setActiveChild(children[0].id);
    }
  }, [children, activeChild]);

  useEffect(() => {
    if (!userLoading && !user) {
      setLocation('/');
    }
  }, [user, userLoading, setLocation]);

  const selectedChild = useMemo(() => 
    children.find(c => c.id === activeChild),
    [children, activeChild]
  );

  // Calculate corrected age (accounts for premature/post-mature birth)
  const ageInfo = useMemo(() => {
    if (!selectedChild) return null;
    return calculateCorrectedAge(selectedChild.birthDate, selectedChild.dueDate);
  }, [selectedChild]);

  // Use corrected age for milestone filtering
  const correctedMonths = useMemo(() => {
    if (!ageInfo) return 0;
    const age = ageInfo.shouldUseCorrectedAge ? ageInfo.corrected : ageInfo.chronological;
    return age.years * 12 + age.months;
  }, [ageInfo]);

  const ageRange = useMemo(() => 
    correctedMonths >= 0 ? getAgeRange(correctedMonths) : null,
    [correctedMonths]
  );

  const { data: milestones = [] } = useQuery<Milestone[]>({
    queryKey: ['/api/milestones/age-range', ageRange?.min, ageRange?.max],
    enabled: ageRange !== null && ageRange?.min !== undefined && ageRange?.max !== undefined,
  });

  const { data: childMilestones = [] } = useQuery<ChildMilestone[]>({
    queryKey: ['/api/children', activeChild, 'milestones'],
    enabled: !!activeChild && activeChild !== '',
  });

  const { data: growthMetrics = [] } = useQuery<GrowthMetric[]>({
    queryKey: ['/api/children', activeChild, 'growth-metrics'],
    enabled: !!activeChild && activeChild !== '',
  });

  const achievedMilestoneIds = new Set(
    childMilestones.filter(cm => cm.achieved).map(cm => cm.milestoneId)
  );

  const milestonesByCategory = useMemo(() => {
    // New comprehensive milestone structure uses main categories
    const developmental = milestones.filter(m => m.category === 'Developmental');
    const growth = milestones.filter(m => m.category === 'Growth');
    const teeth = milestones.filter(m => m.category === 'Teeth');
    const vision = milestones.filter(m => m.category === 'Vision');
    const hearing = milestones.filter(m => m.category === 'Hearing');
    
    return { developmental, growth, teeth, vision, hearing };
  }, [milestones]);

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

  if (childrenLoading || !selectedChild || !ageInfo) {
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
  const pronoun = selectedChild.gender === 'female' ? 'She' : selectedChild.gender === 'male' ? 'He' : 'They';

  const achievedCount = childMilestones.filter(cm => cm.achieved).length;
  const totalInRange = milestones.length;
  const notAchievedMilestones = milestones.filter(m => !achievedMilestoneIds.has(m.id));

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <div>
          <ChildSelector
            children={children}
            activeId={activeChild}
            onSelect={setActiveChild}
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-overview">Overview</h1>
          <div className="space-y-1">
            <p className="text-muted-foreground" data-testid="text-child-age">
              {firstName} is {formatAge(ageInfo.chronological)}
            </p>
            {ageInfo.shouldUseCorrectedAge && ageInfo.adjustmentWeeks > 0 && (
              <>
                <p className="text-sm text-muted-foreground" data-testid="text-adjusted-age">
                  Adjusted age: {formatAge(ageInfo.corrected)} ({formatAdjustment(
                    ageInfo.adjustmentWeeks,
                    ageInfo.isPremature,
                    ageInfo.isPostMature
                  )})
                </p>
                <p className="text-xs text-muted-foreground" data-testid="text-milestone-range">
                  Showing milestones for: {ageRange?.label} range
                </p>
              </>
            )}
          </div>
        </div>

        {achievedCount > 0 || notAchievedMilestones.length > 0 ? (
          <div>
            <h2 className="font-semibold mb-3">Highlights</h2>
            <div className="space-y-3">
              {achievedCount > 0 && (
                <HighlightCard
                  type="achievement"
                  title={`Great progress! ${firstName} has achieved ${achievedCount} ${achievedCount === 1 ? 'milestone' : 'milestones'}.`}
                  description={`${pronoun} ${achievedCount === 1 ? 'is' : 'are'} developing well. Keep up the great work!`}
                />
              )}
              
              {notAchievedMilestones.length > 0 && notAchievedMilestones.slice(0, 1).map(milestone => (
                <HighlightCard
                  key={milestone.id}
                  type="alert"
                  title={`${firstName} hasn't achieved "${milestone.title}" yet.`}
                  description={`This milestone is typically achieved between ${milestone.ageRangeMonthsMin}-${milestone.ageRangeMonthsMax} months. Check our guides for activities to help.`}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <div className="mb-3">
            <h2 className="font-semibold">{ageRange?.label} Milestones</h2>
            {ageInfo?.shouldUseCorrectedAge && (
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-adjusted-milestone-note">
                Milestone age range based on adjusted age
              </p>
            )}
          </div>

          {milestonesByCategory.developmental.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Developmental</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  data-testid="button-view-all-developmental"
                  onClick={() => setLocation('/milestones')}
                >
                  View all →
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {milestonesByCategory.developmental.slice(0, 3).map(milestone => (
                  <MilestoneCard
                    key={milestone.id}
                    title={milestone.title}
                    category={milestone.subcategory || milestone.category}
                    categoryColor={getMilestoneColor(milestone)}
                    achieved={achievedMilestoneIds.has(milestone.id)}
                    onClick={() => setLocation(`/milestone/${milestone.id}`)}
                    icon={getMonkeyIcon(milestone.subcategory || milestone.category)}
                    data-testid={`card-milestone-${milestone.id}`}
                  />
                ))}
              </div>
            </div>
          )}

          {milestonesByCategory.growth.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Growth Benchmarks</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  data-testid="button-view-all-growth"
                  onClick={() => setLocation('/milestones')}
                >
                  View all →
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {milestonesByCategory.growth.slice(0, 3).map(milestone => (
                  <MilestoneCard
                    key={milestone.id}
                    title={milestone.title}
                    category={milestone.subcategory || milestone.category}
                    categoryColor={getMilestoneColor(milestone)}
                    achieved={achievedMilestoneIds.has(milestone.id)}
                    onClick={() => setLocation(`/milestone/${milestone.id}`)}
                    icon={getMonkeyIcon(milestone.subcategory || milestone.category)}
                    data-testid={`card-milestone-${milestone.id}`}
                  />
                ))}
              </div>
            </div>
          )}
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
                  color="bg-blue-50 dark:bg-blue-950/20"
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
                  color="bg-amber-50 dark:bg-amber-950/20"
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
                  color="bg-teal-50 dark:bg-teal-950/20"
                  onClick={() => setLocation('/growth/head')}
                  data-testid="card-growth-head"
                />
              )}
            </div>
          </div>
        )}

        {milestonesByCategory.teeth.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Teeth</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                data-testid="button-view-all-teeth"
                onClick={() => setLocation('/milestones')}
              >
                View all →
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {milestonesByCategory.teeth.slice(0, 3).map(milestone => (
                <MilestoneCard
                  key={milestone.id}
                  title={milestone.title}
                  category={milestone.subcategory || milestone.category}
                  categoryColor={getMilestoneColor(milestone)}
                  achieved={achievedMilestoneIds.has(milestone.id)}
                  onClick={() => setLocation(`/milestone/${milestone.id}`)}
                  icon={getMonkeyIcon(milestone.subcategory || milestone.category)}
                  data-testid={`card-teeth-${milestone.id}`}
                />
              ))}
            </div>
          </div>
        )}

        {milestonesByCategory.vision.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Vision</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                data-testid="button-view-all-vision"
              >
                View all →
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {milestonesByCategory.vision.slice(0, 3).map(milestone => (
                <MilestoneCard
                  key={milestone.id}
                  title={milestone.title}
                  category={milestone.subcategory || milestone.category}
                  categoryColor={getMilestoneColor(milestone)}
                  achieved={achievedMilestoneIds.has(milestone.id)}
                  onClick={() => setLocation(`/milestone/${milestone.id}`)}
                  icon={getMonkeyIcon(milestone.category)}
                  data-testid={`card-vision-${milestone.id}`}
                />
              ))}
            </div>
          </div>
        )}

        {milestonesByCategory.hearing.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Hearing</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                data-testid="button-view-all-hearing"
              >
                View all →
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {milestonesByCategory.hearing.slice(0, 3).map(milestone => (
                <MilestoneCard
                  key={milestone.id}
                  title={milestone.title}
                  category={milestone.subcategory || milestone.category}
                  categoryColor={getMilestoneColor(milestone)}
                  achieved={achievedMilestoneIds.has(milestone.id)}
                  onClick={() => setLocation(`/milestone/${milestone.id}`)}
                  icon={getMonkeyIcon(milestone.category)}
                  data-testid={`card-hearing-${milestone.id}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav active={activeNav} onNavigate={handleNavigation} />
    </div>
  );
}
